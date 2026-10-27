-- ============================================================================
-- COMPREHENSIVE RLS POLICY DEBUG FOR INCIDENTS TABLE
-- ============================================================================

-- 1. CHECK ALL POLICIES ON INCIDENTS TABLE
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'incidents'
ORDER BY cmd, policyname;

-- 2. CHECK IF RLS IS ENABLED
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'incidents';

-- 3. TEST INSERT AS ANONYMOUS USER
SET ROLE anon;

-- Try to insert a test record
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
  'flooding',
  'medium',
  'Test incident',
  'Test description',
  'Test address',
  'Poblacion',
  'Test Reporter',
  '0917-000-0000'
) RETURNING reference_number, id;

-- If above fails, check the error message

RESET ROLE;

-- 4. CHECK WHAT EXACTLY IS BLOCKING
-- If the insert failed, this will show any restrictive policies
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  with_check
FROM pg_policies
WHERE tablename = 'incidents' 
AND cmd IN ('INSERT', 'ALL')
AND NOT permissive; -- Look for RESTRICTIVE policies

