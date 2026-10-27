-- ============================================================================
-- EMERGENCY FIX: Allow Public Incident Submission
-- Issue: Phase B migration blocked INSERT but didn't preserve public submission
-- ============================================================================

-- 1. CHECK CURRENT INSERT POLICIES
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'incidents' AND cmd = 'INSERT';

-- If no INSERT policy exists or if it's blocking anonymous, run this fix:

-- 2. DROP OLD INSERT POLICY (IF EXISTS)
DROP POLICY IF EXISTS "Anyone can submit incidents" ON incidents;

-- 3. CREATE NEW PUBLIC INSERT POLICY
CREATE POLICY "Anyone can submit incidents"
  ON incidents FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- This allows:
-- - Anonymous users (public) to submit incidents
-- - Authenticated users to submit incidents
-- - No restrictions on what data they can insert (handled by app validation)

COMMENT ON POLICY "Anyone can submit incidents" ON incidents IS 
  'Allows public incident submission. App validates data before insert.';

-- 4. VERIFY THE FIX
SELECT 
  policyname,
  cmd,
  roles,
  with_check
FROM pg_policies
WHERE tablename = 'incidents' AND cmd = 'INSERT';

-- Expected: Should show "Anyone can submit incidents" with WITH CHECK (true)
