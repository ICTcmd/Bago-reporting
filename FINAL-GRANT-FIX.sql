-- ============================================================================
-- FINAL FIX: Grant Table-Level Permissions to anon and authenticated
-- ============================================================================

-- The issue is that even with RLS policies allowing INSERT,
-- the anon and authenticated roles don't have table-level INSERT grant

-- 1. Grant table-level permissions
GRANT INSERT ON incidents TO anon, authenticated;
GRANT SELECT ON incidents TO anon, authenticated;
GRANT UPDATE ON incidents TO authenticated;
GRANT DELETE ON incidents TO authenticated;

-- 2. Grant USAGE on sequence (for auto-increment IDs if any)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 3. Verify grants
SELECT 
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'incidents'
ORDER BY grantee, privilege_type;

-- 4. Test INSERT with RLS ON
SET ROLE anon;

INSERT INTO incidents (
  category, severity, title, description, address_text, barangay, reporter_name, reporter_contact
) VALUES (
  'flood', 'medium', 'Test after GRANT', 'Testing', 'Test', 'Poblacion', 'Test', '0917-000-0000'
) RETURNING reference_number, id;

RESET ROLE;
