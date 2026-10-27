-- ============================================================================
-- COMPREHENSIVE POLICY CHECK - Find What's Blocking INSERT
-- ============================================================================

-- 1. Show ALL policies (including RESTRICTIVE ones)
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,  -- PERMISSIVE or RESTRICTIVE
  roles,
  cmd,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies
WHERE tablename = 'incidents'
ORDER BY cmd, permissive DESC, policyname;

-- 2. Check if there's a default deny policy
SELECT 
  policyname,
  cmd,
  permissive,
  with_check
FROM pg_policies
WHERE tablename = 'incidents' 
AND cmd IN ('INSERT', 'ALL')
AND with_check IS NOT NULL;

-- 3. Check table owner (might affect RLS)
SELECT 
  tablename,
  tableowner,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'incidents';

-- 4. Try INSERT as postgres superuser (bypasses RLS)
-- This will tell us if it's definitely an RLS issue
INSERT INTO incidents (
  category,
  severity,
  title,
  description,
  address_text,
  barangay,
  reporter_name,
  reporter_contact
) VALUES (
  'flood',
  'medium',
  'Test as superuser',
  'Testing',
  'Test address',
  'Poblacion',
  'Test',
  '0917-000-0000'
) RETURNING reference_number, id;
