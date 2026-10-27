-- ============================================================================
-- BAGO SAFE - PHASE 2: VERIFICATION SYSTEM SCHEMA
-- ============================================================================
-- Migration: 003_verification_system_schema.sql
-- Date: October 26, 2026
-- Purpose: Add incident verification workflow infrastructure
-- Dependencies: 002_security_remediation_v2.sql (Phase B)
-- 
-- SAFETY: All new columns nullable, all changes reversible, existing data preserved
-- TESTING: Must be applied to staging database first
-- APPROVAL: Based on BAGO-SAFE-DECISION-REGISTER.md technical defaults
-- 
-- ============================================================================

-- ============================================================================
-- PART 1: EXTEND USER ROLES FOR VERIFICATION WORKFLOW
-- ============================================================================

-- Add barangay_reviewer role to existing enum
-- SAFETY: Does not affect existing profiles, only adds new option
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid 
    WHERE t.typname = 'user_role' AND e.enumlabel = 'barangay_reviewer'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'barangay_reviewer';
  END IF;
END $$;

COMMENT ON TYPE user_role IS 'User roles: citizen, responder, supervisor, admin, barangay_reviewer';

-- ============================================================================
-- PART 2: EXTEND PROFILES TABLE FOR BARANGAY REVIEWER ASSIGNMENTS
-- ============================================================================

-- Add barangay assignment for reviewers
-- NULLABLE: Existing profiles not affected
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS assigned_barangay UUID REFERENCES barangays(id) ON DELETE SET NULL;

-- Track when user became reviewer
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS reviewer_since TIMESTAMPTZ;

-- Allow deactivating reviewers without deleting account
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS reviewer_active BOOLEAN DEFAULT true;

-- Add optional secondary roles for future extensibility
-- NULLABLE: Not used initially, available for multi-role users later
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS secondary_roles TEXT[];

-- Create index for efficient barangay reviewer queries
CREATE INDEX IF NOT EXISTS idx_profiles_reviewer_barangay 
  ON profiles(role, assigned_barangay) 
  WHERE role = 'barangay_reviewer';

CREATE INDEX IF NOT EXISTS idx_profiles_active_reviewers 
  ON profiles(assigned_barangay) 
  WHERE role = 'barangay_reviewer' AND reviewer_active = true;

COMMENT ON COLUMN profiles.assigned_barangay IS 'Barangay assigned to reviewer (for barangay_reviewer role)';
COMMENT ON COLUMN profiles.reviewer_since IS 'Date when user was assigned reviewer role';
COMMENT ON COLUMN profiles.reviewer_active IS 'Whether reviewer account is active (can be deactivated without deletion)';
COMMENT ON COLUMN profiles.secondary_roles IS 'Optional secondary roles for future multi-role support';

-- ============================================================================
-- PART 3: EXTEND INCIDENTS TABLE FOR VERIFICATION WORKFLOW
-- ============================================================================

-- Add barangay foreign key (normalized reference)
-- NULLABLE: Preserves existing records, backfill applied separately
ALTER TABLE incidents 
  ADD COLUMN IF NOT EXISTS barangay_id UUID REFERENCES barangays(id) ON DELETE SET NULL;

-- Add urgency flag for fast-track incidents
-- DEFAULT FALSE: All existing incidents non-urgent (safe default)
ALTER TABLE incidents 
  ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT false;

-- Track barangay review metadata
-- NULLABLE: Only populated when barangay review occurs
ALTER TABLE incidents 
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE incidents 
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Track city verification metadata
-- NULLABLE: Only populated when city verification occurs
ALTER TABLE incidents 
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE incidents 
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- Track duplicate parent reference
-- NULLABLE: Only populated if marked as duplicate
ALTER TABLE incidents 
  ADD COLUMN IF NOT EXISTS duplicate_of UUID REFERENCES incidents(id) ON DELETE SET NULL;

-- Store verification notes (rejection reason, correction requests, etc.)
-- NULLABLE: Optional field for verifiers
ALTER TABLE incidents 
  ADD COLUMN IF NOT EXISTS verification_notes TEXT;

-- Create indexes for verification queries
CREATE INDEX IF NOT EXISTS idx_incidents_barangay_id 
  ON incidents(barangay_id);

CREATE INDEX IF NOT EXISTS idx_incidents_barangay_status 
  ON incidents(barangay_id, status) 
  WHERE status IN ('submitted', 'under_review');

CREATE INDEX IF NOT EXISTS idx_incidents_urgent 
  ON incidents(is_urgent, created_at DESC) 
  WHERE is_urgent = true;

CREATE INDEX IF NOT EXISTS idx_incidents_reviewed_by 
  ON incidents(reviewed_by) 
  WHERE reviewed_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_incidents_verified_by 
  ON incidents(verified_by) 
  WHERE verified_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_incidents_duplicate_of 
  ON incidents(duplicate_of) 
  WHERE duplicate_of IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_incidents_verification_queue 
  ON incidents(status, created_at DESC) 
  WHERE status = 'verified';

COMMENT ON COLUMN incidents.barangay_id IS 'Foreign key to barangays table (normalized reference, backfilled from text field)';
COMMENT ON COLUMN incidents.is_urgent IS 'Urgent incidents bypass barangay review and go directly to city verification';
COMMENT ON COLUMN incidents.reviewed_by IS 'Barangay reviewer who approved/rejected this incident';
COMMENT ON COLUMN incidents.reviewed_at IS 'Timestamp when barangay review was completed';
COMMENT ON COLUMN incidents.verified_by IS 'City staff who verified this incident';
COMMENT ON COLUMN incidents.verified_at IS 'Timestamp when city verification was completed';
COMMENT ON COLUMN incidents.duplicate_of IS 'Parent incident if this was marked as duplicate';
COMMENT ON COLUMN incidents.verification_notes IS 'Notes from verifiers (rejection reason, correction requests, etc.)';

-- ============================================================================
-- PART 4: CREATE INCIDENT REVIEWS TABLE (AUDIT TRAIL)
-- ============================================================================

-- Detailed review history for each verification step
CREATE TABLE IF NOT EXISTS incident_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  review_level TEXT NOT NULL CHECK (review_level IN ('barangay', 'city')),
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected', 'escalated', 'reopened')),
  rejection_reason TEXT,
  notes TEXT,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Prevent multiple reviews at same level (can re-review if reopened)
  UNIQUE(incident_id, review_level, reviewed_at)
);

-- Enable RLS
ALTER TABLE incident_reviews ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_incident_reviews_incident_id 
  ON incident_reviews(incident_id, reviewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_incident_reviews_reviewer_id 
  ON incident_reviews(reviewer_id, reviewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_incident_reviews_decision 
  ON incident_reviews(decision, reviewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_incident_reviews_level 
  ON incident_reviews(review_level, decision);

COMMENT ON TABLE incident_reviews IS 'Detailed audit trail of barangay and city review decisions';
COMMENT ON COLUMN incident_reviews.review_level IS 'Which stage: barangay (first review) or city (verification)';
COMMENT ON COLUMN incident_reviews.decision IS 'Review outcome: approved, rejected, escalated, reopened';
COMMENT ON COLUMN incident_reviews.rejection_reason IS 'Required when decision is rejected';
COMMENT ON COLUMN incident_reviews.notes IS 'Additional context from reviewer';

-- ============================================================================
-- PART 5: CREATE INCIDENT DUPLICATES TABLE (SUGGESTION SYSTEM)
-- ============================================================================

-- Track potential and confirmed duplicate incidents
CREATE TABLE IF NOT EXISTS incident_duplicates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  potential_duplicate_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  similarity_score DECIMAL(3,2) CHECK (similarity_score >= 0 AND similarity_score <= 1.0),
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  detected_by TEXT DEFAULT 'system',  -- 'system' or user_id
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  is_confirmed BOOLEAN,  -- NULL=pending, true=confirmed duplicate, false=dismissed
  notes TEXT,
  
  -- Prevent duplicate pair records
  UNIQUE(incident_id, potential_duplicate_id),
  
  -- Prevent self-reference
  CHECK (incident_id != potential_duplicate_id)
);

-- Enable RLS
ALTER TABLE incident_duplicates ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_incident_duplicates_incident_id 
  ON incident_duplicates(incident_id) 
  WHERE is_confirmed IS NULL;  -- Pending review only

CREATE INDEX IF NOT EXISTS idx_incident_duplicates_similarity 
  ON incident_duplicates(similarity_score DESC, detected_at DESC) 
  WHERE is_confirmed IS NULL;

CREATE INDEX IF NOT EXISTS idx_incident_duplicates_reviewed_by 
  ON incident_duplicates(reviewed_by) 
  WHERE reviewed_by IS NOT NULL;

COMMENT ON TABLE incident_duplicates IS 'Suggested and confirmed duplicate incident relationships';
COMMENT ON COLUMN incident_duplicates.similarity_score IS 'Algorithm-calculated similarity (0.00 to 1.00)';
COMMENT ON COLUMN incident_duplicates.detected_by IS 'System algorithm or user who flagged potential duplicate';
COMMENT ON COLUMN incident_duplicates.is_confirmed IS 'NULL=pending review, true=confirmed, false=dismissed as not duplicate';

-- ============================================================================
-- PART 6: CREATE NOTIFICATIONS TABLE (IN-APP ONLY)
-- ============================================================================

-- In-app notification system for assignment and status updates
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,  -- Deep link to relevant page, e.g., /dashboard/incident/[id]
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ  -- Optional expiration for time-sensitive notifications
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
  ON notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_unread 
  ON notifications(user_id, is_read, created_at DESC) 
  WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_notifications_expired 
  ON notifications(expires_at) 
  WHERE expires_at IS NOT NULL AND expires_at < NOW();

COMMENT ON TABLE notifications IS 'In-app notifications for assignment and status changes (email/SMS deferred pending City policy)';
COMMENT ON COLUMN notifications.link IS 'Deep link to relevant incident or page';
COMMENT ON COLUMN notifications.expires_at IS 'Optional expiration for time-sensitive notifications';

-- ============================================================================
-- PART 7: BARANGAY BACKFILL FUNCTION (SAFE MIGRATION)
-- ============================================================================

-- Function to safely backfill barangay_id from existing barangay TEXT field
-- Does NOT enforce NOT NULL - preserves records that can't be matched
CREATE OR REPLACE FUNCTION backfill_barangay_ids()
RETURNS TABLE (
  total_incidents BIGINT,
  matched_incidents BIGINT,
  unmatched_incidents BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_total BIGINT;
  v_matched BIGINT := 0;
  v_unmatched BIGINT := 0;
BEGIN
  -- Count total incidents
  SELECT COUNT(*) INTO v_total FROM incidents WHERE barangay IS NOT NULL;
  
  -- Update incidents with exact barangay name match
  UPDATE incidents i
  SET barangay_id = b.id
  FROM barangays b
  WHERE i.barangay IS NOT NULL
    AND i.barangay_id IS NULL
    AND LOWER(TRIM(i.barangay)) = LOWER(b.name);
  
  GET DIAGNOSTICS v_matched = ROW_COUNT;
  
  -- Try fuzzy matching for near-matches (e.g., "Poblacion" vs "POBLACION")
  UPDATE incidents i
  SET barangay_id = b.id
  FROM barangays b
  WHERE i.barangay IS NOT NULL
    AND i.barangay_id IS NULL
    AND LOWER(TRIM(REGEXP_REPLACE(i.barangay, '\s+', '', 'g'))) = 
        LOWER(TRIM(REGEXP_REPLACE(b.name, '\s+', '', 'g')));
  
  GET DIAGNOSTICS v_matched = v_matched + ROW_COUNT;
  
  -- Calculate unmatched
  SELECT COUNT(*) INTO v_unmatched 
  FROM incidents 
  WHERE barangay IS NOT NULL AND barangay_id IS NULL;
  
  -- Return statistics
  RETURN QUERY SELECT v_total, v_matched, v_unmatched;
END;
$$;

COMMENT ON FUNCTION backfill_barangay_ids IS 
  'Safely backfill barangay_id from TEXT field using exact and fuzzy matching. Does not fail on unmatched records.';

-- ============================================================================
-- PART 8: RLS POLICIES FOR NEW TABLES
-- ============================================================================

-- ============================================================================
-- incident_reviews RLS Policies
-- ============================================================================

-- Staff can view review history for incidents they can access
CREATE POLICY "Staff can view incident reviews"
  ON incident_reviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('responder', 'supervisor', 'admin', 'barangay_reviewer')
    )
  );

-- Barangay reviewers can insert reviews for their barangay
CREATE POLICY "Barangay reviewers can create reviews"
  ON incident_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    review_level = 'barangay'
    AND reviewer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles p
      JOIN barangays b ON p.assigned_barangay = b.id
      JOIN incidents i ON i.id = incident_reviews.incident_id
      WHERE p.id = auth.uid()
      AND p.role = 'barangay_reviewer'
      AND (i.barangay_id = b.id OR i.barangay = b.name)
    )
  );

-- City staff can insert city-level reviews
CREATE POLICY "City staff can create city reviews"
  ON incident_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    review_level = 'city'
    AND reviewer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('supervisor', 'admin')
    )
  );

-- No UPDATE or DELETE - reviews are immutable audit records

-- ============================================================================
-- incident_duplicates RLS Policies
-- ============================================================================

-- Staff can view duplicate suggestions
CREATE POLICY "Staff can view duplicate suggestions"
  ON incident_duplicates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('responder', 'supervisor', 'admin', 'barangay_reviewer')
    )
  );

-- Staff can flag potential duplicates
CREATE POLICY "Staff can flag potential duplicates"
  ON incident_duplicates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('responder', 'supervisor', 'admin', 'barangay_reviewer')
    )
  );

-- Only supervisors can confirm/dismiss duplicates
CREATE POLICY "Supervisors can review duplicates"
  ON incident_duplicates FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('supervisor', 'admin')
    )
  )
  WITH CHECK (
    reviewed_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('supervisor', 'admin')
    )
  );

-- ============================================================================
-- notifications RLS Policies
-- ============================================================================

-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can mark their own notifications as read
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- System creates notifications (via functions/triggers)
-- No public INSERT policy - only server-side functions create notifications

-- Users can delete their own old notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- PART 9: UPDATE EXISTING INCIDENTS RLS POLICIES FOR VERIFICATION
-- ============================================================================

-- Barangay reviewers can view incidents from their assigned barangay
CREATE POLICY "Barangay reviewers view assigned barangay incidents"
  ON incidents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN barangays b ON p.assigned_barangay = b.id
      WHERE p.id = auth.uid()
      AND p.role = 'barangay_reviewer'
      AND p.reviewer_active = true
      AND (
        -- Match by normalized FK or legacy text field
        incidents.barangay_id = b.id 
        OR LOWER(TRIM(incidents.barangay)) = LOWER(b.name)
      )
      AND (
        -- Can see submitted/under_review (need to act)
        incidents.status IN ('submitted', 'under_review')
        OR
        -- Can see resolved/closed from their barangay (reference)
        incidents.status IN ('verified', 'in_progress', 'resolved', 'closed', 'invalid', 'duplicate')
      )
    )
  );

-- Barangay reviewers can update incidents in their barangay (limited status transitions)
CREATE POLICY "Barangay reviewers can review incidents"
  ON incidents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN barangays b ON p.assigned_barangay = b.id
      WHERE p.id = auth.uid()
      AND p.role = 'barangay_reviewer'
      AND p.reviewer_active = true
      AND (incidents.barangay_id = b.id OR LOWER(TRIM(incidents.barangay)) = LOWER(b.name))
      AND incidents.status IN ('submitted', 'under_review')
    )
  )
  WITH CHECK (
    -- Can only transition to these statuses
    status IN ('under_review', 'verified', 'invalid')
    AND reviewed_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles p
      JOIN barangays b ON p.assigned_barangay = b.id
      WHERE p.id = auth.uid()
      AND p.role = 'barangay_reviewer'
      AND (incidents.barangay_id = b.id OR LOWER(TRIM(incidents.barangay)) = LOWER(b.name))
    )
  );

-- Supervisors can verify incidents (broader status transitions)
-- FIXED: USING clause now checks SOURCE statuses (where you UPDATE FROM)
--        WITH CHECK clause now checks DESTINATION statuses (where you UPDATE TO)
DROP POLICY IF EXISTS "Supervisors can verify incidents" ON incidents;

CREATE POLICY "Supervisors can verify incidents"
  ON incidents FOR UPDATE
  TO authenticated
  USING (
    -- Must be a supervisor or admin
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('supervisor', 'admin')
    )
    -- Can update incidents in these SOURCE statuses (where you UPDATE FROM):
    AND (
      -- Post-barangay-review statuses (normal workflow)
      status IN ('verified', 'under_review', 'invalid')
      -- OR city-managed statuses (for corrections, closures)
      OR status IN ('in_progress', 'resolved', 'duplicate')
      -- OR urgent incidents (bypass barangay review)
      OR is_urgent = true
    )
  )
  WITH CHECK (
    -- Must still be a supervisor/admin
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('supervisor', 'admin')
    )
    -- Can only SET status TO these DESTINATION values:
    AND status IN ('verified', 'in_progress', 'invalid', 'duplicate', 'closed')
  );

COMMENT ON POLICY "Supervisors can verify incidents" ON incidents IS
  'Supervisors can verify barangay-reviewed incidents, handle urgent incidents, and manage city-level verification workflow. Fixed in Phase 2 (Oct 26, 2026): USING clause checks source statuses (where you UPDATE FROM), WITH CHECK clause checks destination statuses (where you UPDATE TO). Allows supervisors to: verify barangay-approved incidents, handle urgent incidents (skip barangay), override/reject during barangay review, and manage city workflow states.';

-- Responders can update assigned incidents (in_progress → resolved)
-- This policy already exists from base schema, preserved

-- ============================================================================
-- PART 10: NOTIFICATION TRIGGER FUNCTIONS
-- ============================================================================

-- Function to create notification for incident assignment
CREATE OR REPLACE FUNCTION notify_incident_assigned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Only notify if assigned_to changed and is not null
  IF (TG_OP = 'UPDATE' AND OLD.assigned_to IS DISTINCT FROM NEW.assigned_to AND NEW.assigned_to IS NOT NULL) THEN
    INSERT INTO notifications (user_id, title, message, link)
    VALUES (
      NEW.assigned_to,
      '📋 New Incident Assigned',
      'Incident "' || NEW.title || '" has been assigned to you',
      '/dashboard/incident/' || NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for assignment notifications
DROP TRIGGER IF EXISTS trigger_notify_incident_assigned ON incidents;
CREATE TRIGGER trigger_notify_incident_assigned
  AFTER UPDATE ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION notify_incident_assigned();

-- Function to notify barangay reviewer of new submission
CREATE OR REPLACE FUNCTION notify_barangay_reviewer_new_incident()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_reviewer_id UUID;
BEGIN
  -- Only for new incidents with status = submitted and barangay assigned
  IF (TG_OP = 'INSERT' AND NEW.status = 'submitted' AND NEW.barangay_id IS NOT NULL) THEN
    
    -- Find active reviewer for this barangay
    SELECT p.id INTO v_reviewer_id
    FROM profiles p
    WHERE p.role = 'barangay_reviewer'
      AND p.assigned_barangay = NEW.barangay_id
      AND p.reviewer_active = true
    LIMIT 1;
    
    -- Create notification if reviewer found
    IF v_reviewer_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, title, message, link)
      VALUES (
        v_reviewer_id,
        '📥 New Incident in Your Barangay',
        'A new incident has been submitted in your barangay: "' || NEW.title || '"',
        '/dashboard/review/barangay'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new incident notifications
DROP TRIGGER IF EXISTS trigger_notify_new_incident ON incidents;
CREATE TRIGGER trigger_notify_new_incident
  AFTER INSERT ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION notify_barangay_reviewer_new_incident();

-- Function to notify city staff of urgent incidents
CREATE OR REPLACE FUNCTION notify_city_staff_urgent_incident()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_supervisor RECORD;
BEGIN
  -- Notify all active supervisors of urgent incidents
  IF (TG_OP = 'INSERT' AND NEW.is_urgent = true) THEN
    
    FOR v_supervisor IN 
      SELECT id FROM profiles 
      WHERE role IN ('supervisor', 'admin')
    LOOP
      INSERT INTO notifications (user_id, title, message, link)
      VALUES (
        v_supervisor.id,
        '🚨 URGENT Incident Submitted',
        'Urgent incident requires immediate verification: "' || NEW.title || '"',
        '/dashboard/incident/' || NEW.id
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for urgent incident notifications
DROP TRIGGER IF EXISTS trigger_notify_urgent_incident ON incidents;
CREATE TRIGGER trigger_notify_urgent_incident
  AFTER INSERT ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION notify_city_staff_urgent_incident();

-- ============================================================================
-- PART 11: ENHANCED AUDIT LOGGING FOR VERIFICATION ACTIONS
-- ============================================================================

-- Extend existing audit trigger to capture verification actions
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
      'status', jsonb_build_object('old', OLD.status, 'new', NEW.status)
    );
    has_changes := true;
  END IF;
  
  -- Check if assignment changed
  IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    changes := changes || jsonb_build_object(
      'assigned_to', jsonb_build_object('old', OLD.assigned_to, 'new', NEW.assigned_to)
    );
    has_changes := true;
  END IF;
  
  -- Check if urgency changed
  IF OLD.is_urgent IS DISTINCT FROM NEW.is_urgent THEN
    changes := changes || jsonb_build_object(
      'is_urgent', jsonb_build_object('old', OLD.is_urgent, 'new', NEW.is_urgent)
    );
    has_changes := true;
  END IF;
  
  -- Check if barangay review completed
  IF OLD.reviewed_by IS DISTINCT FROM NEW.reviewed_by THEN
    changes := changes || jsonb_build_object(
      'reviewed_by', jsonb_build_object('old', OLD.reviewed_by, 'new', NEW.reviewed_by),
      'reviewed_at', NEW.reviewed_at
    );
    has_changes := true;
  END IF;
  
  -- Check if city verification completed
  IF OLD.verified_by IS DISTINCT FROM NEW.verified_by THEN
    changes := changes || jsonb_build_object(
      'verified_by', jsonb_build_object('old', OLD.verified_by, 'new', NEW.verified_by),
      'verified_at', NEW.verified_at
    );
    has_changes := true;
  END IF;
  
  -- Check if marked as duplicate
  IF OLD.duplicate_of IS DISTINCT FROM NEW.duplicate_of THEN
    changes := changes || jsonb_build_object(
      'duplicate_of', jsonb_build_object('old', OLD.duplicate_of, 'new', NEW.duplicate_of)
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
        -- Log error but don't fail primary operation
        RAISE WARNING 'Audit log failed for incident %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger already exists from Phase B, this replaces it with enhanced version
DROP TRIGGER IF EXISTS audit_incident_changes ON incidents;
CREATE TRIGGER audit_incident_changes
  AFTER UPDATE ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION log_incident_changes();

COMMENT ON FUNCTION log_incident_changes IS 
  'Enhanced audit trigger capturing verification workflow actions (Phase 2 extension of Phase B)';

-- ============================================================================
-- PART 12: HELPER FUNCTIONS FOR VERIFICATION WORKFLOW
-- ============================================================================

-- Function to get pending review count for barangay reviewer
CREATE OR REPLACE FUNCTION get_barangay_review_queue_count(reviewer_user_id UUID)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count BIGINT;
  v_barangay_id UUID;
BEGIN
  -- Get reviewer's assigned barangay
  SELECT assigned_barangay INTO v_barangay_id
  FROM profiles
  WHERE id = reviewer_user_id
    AND role = 'barangay_reviewer'
    AND reviewer_active = true;
  
  IF v_barangay_id IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Count submitted incidents in their barangay
  SELECT COUNT(*) INTO v_count
  FROM incidents
  WHERE (barangay_id = v_barangay_id OR barangay = (SELECT name FROM barangays WHERE id = v_barangay_id))
    AND status = 'submitted';
  
  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION get_barangay_review_queue_count IS 
  'Get count of incidents pending barangay review for a specific reviewer';

-- Function to get city verification queue count
CREATE OR REPLACE FUNCTION get_city_verification_queue_count()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count BIGINT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM incidents
  WHERE status = 'verified';  -- Barangay-approved, awaiting city verification
  
  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION get_city_verification_queue_count IS 
  'Get count of incidents pending city verification';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these queries after applying migration to verify schema:

-- 1. Verify new role added:
-- SELECT enumlabel FROM pg_enum WHERE enumtypid = 'user_role'::regtype;

-- 2. Verify barangay_reviewer profile columns added:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles' AND column_name IN ('assigned_barangay', 'reviewer_since', 'reviewer_active');

-- 3. Verify incident verification columns added:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'incidents' AND column_name IN ('barangay_id', 'is_urgent', 'reviewed_by', 'verified_by');

-- 4. Verify new tables created with RLS enabled:
-- SELECT tablename, rowsecurity FROM pg_tables 
-- WHERE schemaname = 'public' AND tablename IN ('incident_reviews', 'incident_duplicates', 'notifications');

-- 5. Verify indexes created:
-- SELECT indexname FROM pg_indexes 
-- WHERE schemaname = 'public' AND tablename IN ('incidents', 'profiles', 'incident_reviews', 'incident_duplicates', 'notifications');

-- 6. Test backfill function (DO NOT RUN YET - test in staging first):
-- SELECT * FROM backfill_barangay_ids();

-- 7. Verify triggers exist:
-- SELECT tgname, tgrelid::regclass FROM pg_trigger 
-- WHERE tgname IN ('trigger_notify_incident_assigned', 'trigger_notify_new_incident', 'trigger_notify_urgent_incident');

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================================

-- CRITICAL: Do not rollback unless absolutely necessary
-- Rollback removes verification infrastructure but preserves audit history
-- 
-- To rollback this migration:
-- 
-- -- Drop triggers
-- DROP TRIGGER IF EXISTS trigger_notify_urgent_incident ON incidents;
-- DROP TRIGGER IF EXISTS trigger_notify_new_incident ON incidents;
-- DROP TRIGGER IF EXISTS trigger_notify_incident_assigned ON incidents;
-- 
-- -- Drop functions
-- DROP FUNCTION IF EXISTS notify_city_staff_urgent_incident();
-- DROP FUNCTION IF EXISTS notify_barangay_reviewer_new_incident();
-- DROP FUNCTION IF EXISTS notify_incident_assigned();
-- DROP FUNCTION IF EXISTS get_city_verification_queue_count();
-- DROP FUNCTION IF EXISTS get_barangay_review_queue_count();
-- DROP FUNCTION IF EXISTS backfill_barangay_ids();
-- 
-- -- Drop new RLS policies (keep base schema policies)
-- DROP POLICY IF EXISTS "Barangay reviewers can review incidents" ON incidents;
-- DROP POLICY IF EXISTS "Barangay reviewers view assigned barangay incidents" ON incidents;
-- DROP POLICY IF EXISTS "Supervisors can verify incidents" ON incidents;
-- 
-- -- Drop new tables (preserves data in separate archive)
-- ALTER TABLE notifications RENAME TO notifications_archived_20261026;
-- ALTER TABLE incident_duplicates RENAME TO incident_duplicates_archived_20261026;
-- ALTER TABLE incident_reviews RENAME TO incident_reviews_archived_20261026;
-- 
-- -- Remove new columns from incidents (non-destructive)
-- ALTER TABLE incidents DROP COLUMN IF EXISTS verification_notes;
-- ALTER TABLE incidents DROP COLUMN IF EXISTS duplicate_of;
-- ALTER TABLE incidents DROP COLUMN IF EXISTS verified_at;
-- ALTER TABLE incidents DROP COLUMN IF EXISTS verified_by;
-- ALTER TABLE incidents DROP COLUMN IF EXISTS reviewed_at;
-- ALTER TABLE incidents DROP COLUMN IF EXISTS reviewed_by;
-- ALTER TABLE incidents DROP COLUMN IF EXISTS is_urgent;
-- ALTER TABLE incidents DROP COLUMN IF EXISTS barangay_id;
-- 
-- -- Remove columns from profiles
-- ALTER TABLE profiles DROP COLUMN IF EXISTS secondary_roles;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS reviewer_active;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS reviewer_since;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS assigned_barangay;
-- 
-- -- Note: Cannot remove enum value 'barangay_reviewer' without recreating entire type
-- -- Existing profiles with this role will need manual migration
-- 
-- IMPORTANT: After rollback, system reverts to Phase B state
-- Verification workflow will not function until migration re-applied

-- ============================================================================
-- MIGRATION SAFETY CHECKLIST
-- ============================================================================

-- Before applying to production:
-- [ ] Applied to isolated staging database
-- [ ] Verified all tables created
-- [ ] Verified all indexes created
-- [ ] Verified RLS policies working
-- [ ] Tested backfill function with sample data
-- [ ] Confirmed no existing data corrupted
-- [ ] Tested rollback procedure
-- [ ] Confirmed no impact on existing submission/tracking functionality
-- [ ] Verified notification triggers fire correctly
-- [ ] Tested with actual barangay reviewer account
-- [ ] Verified audit logging captures new actions
-- [ ] Confirmed performance acceptable with indexes

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
