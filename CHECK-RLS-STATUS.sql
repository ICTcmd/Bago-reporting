-- Check if RLS is actually disabled
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  tableowner
FROM pg_tables
WHERE tablename = 'incidents';

-- If rls_enabled = true, RLS is still ON
-- Run this to force disable:
ALTER TABLE incidents DISABLE ROW LEVEL SECURITY;

-- Verify again
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'incidents';

-- Now try INSERT as postgres (not anon) - bypasses ALL RLS
INSERT INTO incidents (
  category, severity, title, description, address_text, barangay, reporter_name, reporter_contact
) VALUES (
  'flood', 'medium', 'Test as postgres', 'Testing', 'Test', 'Poblacion', 'Test', '0917-000-0000'
) RETURNING reference_number, id;
