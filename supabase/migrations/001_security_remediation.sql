-- ⚠️⚠️⚠️ DEPRECATED - DO NOT USE ⚠️⚠️⚠️
-- This migration contains 6 security vulnerabilities identified during review
-- USE: 002_security_remediation_v2.sql instead
-- See: PHASE-B-FINAL-SECURITY-REVIEW.md for vulnerability details
-- ⚠️⚠️⚠️ DEPRECATED - DO NOT USE ⚠️⚠️⚠️

-- BAGO SAFE - PHASE B: SECURITY REMEDIATION MIGRATION
-- Date: 2026-10-23
-- Purpose: Fix RLS policies, implement audit logging, improve data privacy
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

-- Create index for efficient querying
CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

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

-- No one can update or delete audit logs (append-only)
-- INSERT is handled by triggers and functions only

COMMENT ON TABLE audit_logs IS 'Audit trail for sensitive staff actions (append-only)';

-- ============================================================================
-- PART 2: PUBLIC TRACKING FUNCTION (SECURITY DEFINER)
-- ============================================================================

-- Create secure public tracking function with minimal data exposure
CREATE OR REPLACE FUNCTION public.track_incident_by_reference(ref_num TEXT)
RETURNS TABLE (
  reference_number TEXT,
  status incident_status,
  category incident_category,
  severity incident_severity,
  title TEXT,
  description TEXT,
  address_text TEXT,
  barangay TEXT,
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
  RETURN QUERY
  SELECT 
    i.reference_number,
    i.status,
    i.category,
    i.severity,
    i.title,
    i.description,
    i.address_text,
    i.barangay,
    i.created_at,
    i.updated_at
  FROM incidents i
  WHERE i.reference_number = UPPER(TRIM(ref_num))
  LIMIT 1;
  
  -- Note: Does NOT return:
  -- - reporter_name, reporter_contact (private)
  -- - reporter_id (private)
  -- - assigned_to (internal)
  -- - location_lat, location_lng (privacy - approximate location only via address_text)
  -- - resolved_at (not needed for public tracking)
END;
$$;

-- Grant execute to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.track_incident_by_reference(TEXT) TO anon, authenticated;

COMMENT ON FUNCTION public.track_incident_by_reference IS 
  'Secure public incident tracking by reference number - returns only non-sensitive fields';

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
-- PART 4: AUDIT TRIGGER FOR INCIDENT STATUS CHANGES
-- ============================================================================

-- Function to log incident status changes
CREATE OR REPLACE FUNCTION log_incident_status_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  actor_profile RECORD;
BEGIN
  -- Only log if status actually changed
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    
    -- Get actor information
    SELECT email, role INTO actor_profile
    FROM profiles
    WHERE id = auth.uid();
    
    -- Insert audit log
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
      'incident_status_change',
      'incident',
      NEW.id,
      jsonb_build_object(
        'reference_number', NEW.reference_number,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'old_assigned_to', OLD.assigned_to,
        'new_assigned_to', NEW.assigned_to,
        'actor_role', actor_profile.role
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for incident updates
DROP TRIGGER IF EXISTS audit_incident_status_change ON incidents;
CREATE TRIGGER audit_incident_status_change
  AFTER UPDATE ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION log_incident_status_change();

COMMENT ON FUNCTION log_incident_status_change IS 
  'Audit trigger function for incident status and assignment changes';

-- ============================================================================
-- PART 5: AUDIT TRIGGER FOR INCIDENT ASSIGNMENT CHANGES
-- ============================================================================

-- Function to log incident assignments
CREATE OR REPLACE FUNCTION log_incident_assignment()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  actor_profile RECORD;
BEGIN
  -- Only log if assigned_to actually changed
  IF (TG_OP = 'UPDATE' AND OLD.assigned_to IS DISTINCT FROM NEW.assigned_to) THEN
    
    -- Get actor information
    SELECT email, role INTO actor_profile
    FROM profiles
    WHERE id = auth.uid();
    
    -- Insert audit log
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
      'incident_assignment_change',
      'incident',
      NEW.id,
      jsonb_build_object(
        'reference_number', NEW.reference_number,
        'old_assigned_to', OLD.assigned_to,
        'new_assigned_to', NEW.assigned_to,
        'status', NEW.status,
        'actor_role', actor_profile.role
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for assignment changes
DROP TRIGGER IF EXISTS audit_incident_assignment ON incidents;
CREATE TRIGGER audit_incident_assignment
  AFTER UPDATE ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION log_incident_assignment();

-- ============================================================================
-- PART 6: ENHANCE INCIDENT_UPDATES TABLE WITH AUDIT FIELDS
-- ============================================================================

-- Add IP address tracking to incident_updates (optional, for enhanced audit)
ALTER TABLE incident_updates ADD COLUMN IF NOT EXISTS ip_address INET;
ALTER TABLE incident_updates ADD COLUMN IF NOT EXISTS user_agent TEXT;

COMMENT ON COLUMN incident_updates.ip_address IS 'IP address of user making the update';
COMMENT ON COLUMN incident_updates.user_agent IS 'User agent of client making the update';

-- ============================================================================
-- PART 7: STORAGE BUCKET POLICIES (DOCUMENTATION ONLY)
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

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================================

-- To rollback this migration (use with caution):
-- 
-- DROP TRIGGER IF EXISTS audit_incident_assignment ON incidents;
-- DROP TRIGGER IF EXISTS audit_incident_status_change ON incidents;
-- DROP FUNCTION IF EXISTS log_incident_assignment();
-- DROP FUNCTION IF EXISTS log_incident_status_change();
-- DROP POLICY IF EXISTS "Block direct public incident queries" ON incidents;
-- DROP POLICY IF EXISTS "Staff can view all incidents" ON incidents;
-- -- Recreate old permissive policy (NOT RECOMMENDED):
-- -- CREATE POLICY "Public can view incident by reference number" 
-- --   ON incidents FOR SELECT USING (true);
-- DROP FUNCTION IF EXISTS public.track_incident_by_reference(TEXT);
-- ALTER TABLE incident_updates DROP COLUMN IF EXISTS ip_address;
-- ALTER TABLE incident_updates DROP COLUMN IF EXISTS user_agent;
-- DROP TABLE IF EXISTS audit_logs CASCADE;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
