-- ============================================================================
-- FINAL FIX: Check and Fix INSERT Policy WITH CHECK Condition
-- ============================================================================

-- 1. Check the exact WITH CHECK condition
SELECT 
  policyname,
  cmd,
  roles,
  with_check
FROM pg_policies
WHERE tablename = 'incidents' AND cmd = 'INSERT';

-- If with_check shows anything other than 'true', that's the problem

-- 2. DROP and RECREATE the policy with correct WITH CHECK
DROP POLICY IF EXISTS "Anyone can submit incidents" ON incidents;

CREATE POLICY "Anyone can submit incidents"
  ON incidents FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 3. VERIFY the fix
SELECT 
  policyname,
  cmd,
  roles,
  with_check
FROM pg_policies
WHERE tablename = 'incidents' AND cmd = 'INSERT';

-- Should show with_check = 'true'

-- 4. TEST INSERT
SET ROLE anon;

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
  'Test after fix',
  'Testing',
  'Test address',
  'Poblacion',
  'Test',
  '0917-000-0000'
) RETURNING reference_number, id;

RESET ROLE;
