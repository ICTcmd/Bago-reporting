-- ============================================================================
-- EMERGENCY FIX: Bypass RLS and Rebuild Policies from Scratch
-- ============================================================================

-- STEP 1: Temporarily disable RLS to test if that's the issue
ALTER TABLE incidents DISABLE ROW LEVEL SECURITY;

-- STEP 2: Test INSERT without RLS
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
  'Test with RLS disabled',
  'Testing',
  'Test address',
  'Poblacion',
  'Test',
  '0917-000-0000'
) RETURNING reference_number, id;

RESET ROLE;

-- If above works, the problem is definitely RLS policies

-- STEP 3: Drop ALL existing policies
DROP POLICY IF EXISTS "Anyone can submit incidents" ON incidents;
DROP POLICY IF EXISTS "Block direct public incident queries" ON incidents;
DROP POLICY IF EXISTS "Staff can view all incidents" ON incidents;
DROP POLICY IF EXISTS "Staff can update incidents" ON incidents;
DROP POLICY IF EXISTS "Only admins can delete incidents" ON incidents;
DROP POLICY IF EXISTS "Public can view incident by reference number" ON incidents;

-- STEP 4: Re-enable RLS
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- STEP 5: Create ONLY the essential policies
-- Policy 1: Allow anonymous/authenticated to INSERT
CREATE POLICY "enable_insert_for_all"
  ON incidents FOR INSERT
  WITH CHECK (true);

-- Policy 2: Block anonymous SELECT (they use tracking function instead)
CREATE POLICY "block_anon_select"
  ON incidents FOR SELECT
  TO anon
  USING (false);

-- Policy 3: Allow staff to SELECT all
CREATE POLICY "enable_select_for_staff"
  ON incidents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('responder', 'supervisor', 'admin')
    )
  );

-- Policy 4: Allow staff to UPDATE
CREATE POLICY "enable_update_for_staff"
  ON incidents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('responder', 'supervisor', 'admin')
    )
  );

-- Policy 5: Allow only admins to DELETE
CREATE POLICY "enable_delete_for_admins"
  ON incidents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- STEP 6: Test INSERT with new policies
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
  'Test with new policies',
  'Testing after rebuild',
  'Test address',
  'Poblacion',
  'Test',
  '0917-000-0000'
) RETURNING reference_number, id;

RESET ROLE;

-- STEP 7: Verify all policies
SELECT 
  policyname,
  cmd,
  roles,
  permissive,
  with_check
FROM pg_policies
WHERE tablename = 'incidents'
ORDER BY cmd, policyname;
