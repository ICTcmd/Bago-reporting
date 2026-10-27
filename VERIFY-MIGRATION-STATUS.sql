-- ============================================================================
-- PHASE B: MIGRATION VERIFICATION QUERIES
-- Run these in Supabase SQL Editor to check what's already applied
-- ============================================================================

-- 1. CHECK IF AUDIT_LOGS TABLE EXISTS
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'audit_logs'
) as audit_logs_exists;
-- EXPECTED: true if migration applied


-- 2. CHECK IF TRACKING FUNCTION EXISTS
SELECT EXISTS (
  SELECT FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  AND p.proname = 'track_incident_by_reference'
) as tracking_function_exists;
-- EXPECTED: true if migration applied


-- 3. CHECK IF OLD PUBLIC SELECT POLICY EXISTS (SHOULD BE DROPPED)
SELECT EXISTS (
  SELECT FROM pg_policies
  WHERE tablename = 'incidents'
  AND policyname = 'Public can view incident by reference number'
) as old_policy_exists;
-- EXPECTED: false (should be dropped by migration)


-- 4. CHECK IF NEW BLOCKING POLICY EXISTS
SELECT EXISTS (
  SELECT FROM pg_policies
  WHERE tablename = 'incidents'
  AND policyname = 'Block direct public incident queries'
) as new_blocking_policy_exists;
-- EXPECTED: true if migration applied


-- 5. CHECK IF AUDIT TRIGGER EXISTS
SELECT EXISTS (
  SELECT FROM pg_trigger
  WHERE tgname = 'audit_incident_changes'
) as audit_trigger_exists;
-- EXPECTED: true if migration applied


-- 6. CHECK AUDIT_LOGS POLICIES
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'audit_logs'
ORDER BY policyname;
-- EXPECTED: 2 policies (SELECT and INSERT)


-- 7. COUNT ROWS IN AUDIT_LOGS (SHOULD BE EMPTY INITIALLY)
SELECT COUNT(*) as audit_log_count FROM audit_logs;
-- EXPECTED: 0 (empty table after migration)


-- 8. TEST TRACKING FUNCTION (WITH FAKE REFERENCE)
SELECT * FROM track_incident_by_reference('BS-TEST-FAKE');
-- EXPECTED: 0 rows (reference doesn't exist, but function should work)


-- ============================================================================
-- SUMMARY QUERY - RUN THIS FIRST
-- ============================================================================

SELECT 
  'audit_logs table' as check_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'audit_logs'
  ) as status
UNION ALL
SELECT 
  'tracking function',
  EXISTS (
    SELECT FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'track_incident_by_reference'
  )
UNION ALL
SELECT 
  'old policy removed',
  NOT EXISTS (
    SELECT FROM pg_policies
    WHERE tablename = 'incidents' 
    AND policyname = 'Public can view incident by reference number'
  )
UNION ALL
SELECT 
  'new blocking policy',
  EXISTS (
    SELECT FROM pg_policies
    WHERE tablename = 'incidents' 
    AND policyname = 'Block direct public incident queries'
  )
UNION ALL
SELECT 
  'audit trigger',
  EXISTS (
    SELECT FROM pg_trigger
    WHERE tgname = 'audit_incident_changes'
  );

-- If all show 'true', migration is complete! ✅
-- If any show 'false', migration needs to be run (or re-run)
