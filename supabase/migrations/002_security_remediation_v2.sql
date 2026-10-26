-- BAGO SAFE - PHASE B: SECURITY REMEDIATION MIGRATION (CORRECTED VERSION)
-- Date: 2026-10-24
-- Purpose: Fix RLS policies, implement audit logging, improve data privacy
-- Version: 2 (Corrected after final security review)
-- 
-- CRITICAL: This migration must be reviewed and tested in staging before production
-- ROLLBACK: See rollback instructions at the end of this file

-- ============================================================================
-- PART 1: AUDIT LOGGING
-- ============================================================================

-- Create audit_logs table for tracking sensitive actions
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  actor_email TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying (with IF NOT EXISTS for safety)
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Enable RLS on audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only supervisors and admins can view audit logs
CREATE POLICY "Supervisors and admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('supervisor', 'admin')
    )
  );

-- Staff can insert audit logs (with actor_id validation)
-- FIX VULN-006: Add INSERT policy for application audit utility
CREATE POLICY "Staff can create audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('responder', 'supervisor', 'admin')
    )
    AND actor_id = auth.uid()  -- Can only log own actions
  );

-- No one can update or delete audit logs (append-only)
-- No UPDATE or DELETE policies = all denied

COMMENT ON TABLE audit_logs IS 'Audit trail for sensitive staff actions (append-only)';

-- ============================================================================
-- PART 2: PUBLIC TRACKING FUNCTION (SECURITY DEFINER) - CORRECTED
-- ============================================================================

-- FIX VULN-001: Remove description field, generalize address to barangay only
-- FIX VULN-003: Grant EXECUTE only to anon (remove authenticated)
-- FIX VULN-004: Add explicit REVOKE before GRANT

-- Create secure public tracking function with minimal data exposure
CREATE OR REPLACE FUNCTION public.track_incident_by_reference(ref_num TEXT)
RETURNS TABLE (
  reference_number TEXT,
  status incident_status,
  category incident_category,
  severity incident_severity,
  title TEXT,
  location_summary TEXT,  -- CHANGED: Barangay only, not exact address
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) 
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validate input (prevent injection, limit enumeration)
  IF ref_num IS NULL OR LENGTH(ref_num) < 5 OR LENGTH(ref_num) > 50 THEN
    RAISE EXCEPTION 'Invalid reference number format';
  END IF;

  -- Return only public-safe fields for exact reference match
  -- CRITICAL PRIVACY CHANGES:
  -- 1. NO description field (may contain PII like phone numbers)
  -- 2. NO exact address_text (reveals precise location)
  -- 3. Only barangay-level location (generic)
  RETURN QUERY
  SELECT 
    i.reference_number,
    i.status,
    i.category,
    i.severity,
    i.title,
    CASE 
      WHEN i.barangay IS NOT NULL THEN 'Barangay ' || i.barangay
      ELSE 'Location withheld for privacy'
    END as location_summary,
    i.created_at,
    i.updated_at
  FROM incidents i
  WHERE i.reference_number = UPPER(TRIM(ref_num))
  LIMIT 1;
  
  -- Note: Does NOT return:
  -- - description (may contain PII - phone numbers, addresses, names)
  -- - address_text (exact location exposes reporter)
  -- - reporter_name, reporter_contact (private)
  -- - reporter_id (private)
  -- - assigned_to (internal)
  -- - location_lat, location_lng (privacy)
  -- - resolved_at (not needed for public tracking)
  -- - id (incident UUID - internal)
END;
$$;

-- FIX VULN-004: Explicitly revoke all grants first
REVOKE ALL ON FUNCTION public.track_incident_by_reference(TEXT) FROM PUBLIC;

-- FIX VULN-003: Grant EXECUTE only to anon (NOT authenticated)
-- Reasoning: Authenticated non-staff (citizens) should not have access
-- Staff use dashboard queries, not this function
GRANT EXECUTE ON FUNCTION public.track_incident_by_reference(TEXT) TO anon;

COMMENT ON FUNCTION public.track_incident_by_reference IS 
  'Secure public incident tracking by reference number - returns only non-sensitive fields (NO description or exact address)';

-- ============================================================================
-- PART 3: FIX INCIDENTS TABLE RLS POLICIES
-- ============================================================================

-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Public can view incident by reference number" ON incidents;

-- Create restrictive policy: Public CANNOT directly SELECT from incidents table
-- They must use the track_incident_by_reference() function instead
CREATE POLICY "Block direct public incident queries"
  ON incidents FOR SELECT
  TO anon
  USING (false);

-- Staff can view all incidents (unchanged)
-- Note: This policy already exists, but we recreate it for clarity
DROP POLICY IF EXISTS "Staff can view all incidents" ON incidents;
CREATE POLICY "Staff can view all incidents"
  ON incidents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('responder', 'supervisor', 'admin')
    )
  );

-- Public can still submit incidents (INSERT unchanged)
-- Policy "Anyone can submit incidents" remains as-is

-- Staff can update incidents (recreate with explicit audit requirement)
DROP POLICY IF EXISTS "Staff can update incidents" ON incidents;
CREATE POLICY "Staff can update incidents"
  ON incidents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('responder', 'supervisor', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('responder', 'supervisor', 'admin')
    )
  );

-- ============================================================================
-- PART 4: COMPREHENSIVE AUDIT TRIGGER (SINGLE TRIGGER)
-- ============================================================================

-- FIX VULN-002: Combine status and assignment triggers into single comprehensive trigger
-- FIX VULN-005: Add error handling to prevent blocking operations

-- Drop old separate triggers if they exist
DROP TRIGGER IF EXISTS audit_incident_status_change ON incidents;
DROP TRIGGER IF EXISTS audit_incident_assignment ON incidents;
DROP FUNCTION IF EXISTS log_incident_status_change();
DROP FUNCTION IF EXISTS log_incident_assignment();

-- Create single comprehensive audit function
CREATE OR REPLACE FUNCTION log_incident_changes()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  actor_profile RECORD;
  changes JSONB;
  has_changes BOOLEAN;
BEGIN
  -- Only log if UPDATE (not INSERT or DELETE)
  IF TG_OP != 'UPDATE' THEN
    RETURN NEW;
  END IF;
  
  -- Build changes object
  changes := '{}'::jsonb;
  has_changes := false;
  
  -- Check if status changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    changes := changes || jsonb_build_object(
      'status', jsonb_build_object(
        'old', OLD.status,
        'new', NEW.status
      )
    );
    has_changes := true;
  END IF;
  
  -- Check if assignment changed
  IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    changes := changes || jsonb_build_object(
      'assigned_to', jsonb_build_object(
        'old', OLD.assigned_to,
        'new', NEW.assigned_to
      )
    );
    has_changes := true;
  END IF;
  
  -- Only log if there are actual changes to audit-worthy fields
  IF has_changes THEN
    BEGIN
      -- Get actor information
      SELECT email, role INTO actor_profile
      FROM profiles
      WHERE id = auth.uid();
      
      -- Insert audit log with error handling
      INSERT INTO audit_logs (
        actor_id,
        actor_email,
        action,
        resource_type,
        resource_id,
        details
      ) VALUES (
        auth.uid(),
        COALESCE(actor_profile.email, 'system'),
        'incident_updated',
        'incident',
        NEW.id,
        jsonb_build_object(
          'reference_number', NEW.reference_number,
          'changes', changes,
          'actor_role', actor_profile.role
        )
      );
      
    EXCEPTION
      WHEN OTHERS THEN
        -- FIX VULN-005: Log error but don't fail primary operation
        RAISE WARNING 'Audit log failed for incident %: %', NEW.id, SQLERRM;
        -- Consider: INSERT INTO error_log table here
        -- For now, we continue without failing the UPDATE
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create single comprehensive trigger
CREATE TRIGGER audit_incident_changes
  AFTER UPDATE ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION log_incident_changes();

COMMENT ON FUNCTION log_incident_changes IS 
  'Comprehensive audit trigger for incident changes (status, assignment, etc.) - single entry per update';

-- ============================================================================
-- PART 5: ENHANCE INCIDENT_UPDATES TABLE WITH AUDIT FIELDS
-- ============================================================================

-- Add IP address tracking to incident_updates (optional, for enhanced audit)
ALTER TABLE incident_updates ADD COLUMN IF NOT EXISTS ip_address INET;
ALTER TABLE incident_updates ADD COLUMN IF NOT EXISTS user_agent TEXT;

COMMENT ON COLUMN incident_updates.ip_address IS 'IP address of user making the update';
COMMENT ON COLUMN incident_updates.user_agent IS 'User agent of client making the update';

-- ============================================================================
-- PART 6: STORAGE BUCKET POLICIES (DOCUMENTATION ONLY)
-- ============================================================================

-- NOTE: Storage policies must be configured via Supabase Dashboard or Storage API
-- The following are documented here for reference:

-- REQUIRED STORAGE POLICIES:
-- 
-- Bucket: incident-media (should already exist and be PRIVATE)
-- 
-- 1. Allow public upload during incident submission:
--    Policy Name: "Anyone can upload incident media"
--    Operation: INSERT
--    Policy: (bucket_id = 'incident-media')
-- 
-- 2. Only staff can view incident media:
--    Policy Name: "Staff can view incident media"  
--    Operation: SELECT
--    Policy: (bucket_id = 'incident-media' AND auth.role() = 'authenticated' AND 
--             EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() 
--                     AND role IN ('responder', 'supervisor', 'admin')))
--
-- 3. Staff can delete media (for moderation):
--    Policy Name: "Staff can delete incident media"
--    Operation: DELETE
--    Policy: (bucket_id = 'incident-media' AND auth.role() = 'authenticated' AND
--             EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
--                     AND role IN ('supervisor', 'admin')))

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- After applying this migration, run these queries to verify:

-- 1. Check audit_logs table exists and is empty:
-- SELECT COUNT(*) FROM audit_logs;

-- 2. Test tracking function with non-existent reference:
-- SELECT * FROM track_incident_by_reference('NONEXISTENT');

-- 3. Verify anonymous users cannot query incidents directly:
-- SET ROLE anon;
-- SELECT * FROM incidents LIMIT 1;  -- Should return 0 rows
-- RESET ROLE;

-- 4. Verify staff can still query incidents:
-- (Must be run as authenticated staff user in application)

-- 5. Verify authenticated non-staff cannot use tracking function:
-- (Must be tested via application with citizen account)

-- 6. Verify single audit entry per multi-field update:
-- UPDATE incidents SET status = 'verified', assigned_to = 'staff-id' WHERE id = 'test-id';
-- SELECT COUNT(*) FROM audit_logs WHERE resource_id = 'test-id' AND created_at > NOW() - INTERVAL '1 second';
-- -- Should return 1, not 2

-- ============================================================================
-- CORRECTED ROLLBACK INSTRUCTIONS
-- ============================================================================

-- IMPORTANT: DO NOT ROLLBACK SECURITY FIXES WITHOUT CAREFUL REVIEW
-- 
-- If issues are found, prefer FORWARD FIXES over rollback:
--
-- 1. If audit trigger causing issues, temporarily disable:
--    ALTER TABLE incidents DISABLE TRIGGER audit_incident_changes;
--    (Fix issue, then re-enable)
--
-- 2. If tracking function broken, create fixed version:
--    CREATE OR REPLACE FUNCTION track_incident_by_reference_v3(...)
--
-- 3. NEVER restore permissive RLS policy (USING true)
--
-- 4. NEVER drop audit_logs table (preserves evidence)
--
-- ONLY IN EMERGENCY (Database Administrator approval required):
--
-- -- Disable audit trigger
-- DROP TRIGGER IF EXISTS audit_incident_changes ON incidents;
-- DROP FUNCTION IF EXISTS log_incident_changes();
--
-- -- Disable tracking function (do NOT restore direct table access)
-- DROP FUNCTION IF EXISTS public.track_incident_by_reference(TEXT);
--
-- -- Remove RLS blocking policy (ONLY if staff dashboard broken)
-- DROP POLICY IF EXISTS "Block direct public incident queries" ON incidents;
--
-- -- Preserve audit data (rename instead of drop)
-- ALTER TABLE audit_logs RENAME TO audit_logs_archived_20261024;
--
-- -- Remove incident_updates columns
-- ALTER TABLE incident_updates DROP COLUMN IF EXISTS ip_address;
-- ALTER TABLE incident_updates DROP COLUMN IF EXISTS user_agent;
--
-- CRITICAL: After emergency rollback, apply forward fix immediately
-- Do NOT leave system in insecure state

-- ============================================================================
-- MIGRATION CHANGELOG
-- ============================================================================

-- Version 2 Changes (2026-10-24):
-- - VULN-001 FIXED: Removed description from tracking function
-- - VULN-001 FIXED: Changed address_text to location_summary (barangay only)
-- - VULN-002 FIXED: Combined two audit triggers into single comprehensive trigger
-- - VULN-003 FIXED: Removed authenticated from GRANT EXECUTE (anon only)
-- - VULN-004 FIXED: Added explicit REVOKE before GRANT
-- - VULN-005 FIXED: Added exception handling to audit trigger
-- - VULN-006 FIXED: Added INSERT policy for audit_logs table
-- - Added IF NOT EXISTS to all CREATE INDEX statements
-- - Revised rollback guidance (forward-fix philosophy)

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
