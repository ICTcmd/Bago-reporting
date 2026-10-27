-- ============================================================================
-- COMPLETE FIX: Make Required Fields Optional for Public Submission
-- ============================================================================

-- 1. Make coordinates optional (users may not always have GPS)
ALTER TABLE incidents 
  ALTER COLUMN location_lat DROP NOT NULL;

ALTER TABLE incidents 
  ALTER COLUMN location_lng DROP NOT NULL;

-- 2. Verify the changes
SELECT 
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'incidents'
AND column_name IN ('location_lat', 'location_lng', 'description', 'address_text');

-- 3. Now test INSERT without coordinates
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
  'Test incident after schema fix',
  'Testing without coordinates',
  'Test address',
  'Poblacion',
  'Test Reporter',
  '0917-000-0000'
) RETURNING reference_number, id, category, title;

RESET ROLE;

-- Expected: Should return a reference number like BS-XXXXX-XXXX
