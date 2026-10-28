-- DELETE TEST REPORTS FROM DATABASE
-- Run this SQL query in Supabase SQL Editor to remove test reports

-- OPTION 1: Delete reports with "test" in the title (case-insensitive)
-- This will delete reports like "test", "Test RLS off", "Test with RLS off", etc.

DELETE FROM incidents 
WHERE LOWER(title) LIKE '%test%';

-- OPTION 2: Delete specific reports by reference number
-- Uncomment and replace with actual reference numbers you want to delete

-- DELETE FROM incidents WHERE reference_number = 'BS-WNQP4B9R-XV0D';
-- DELETE FROM incidents WHERE reference_number = 'BS-6ADEC81E-26E2';
-- DELETE FROM incidents WHERE reference_number = 'BS-6ADEC7C9-2E3E';
-- DELETE FROM incidents WHERE reference_number = 'BS-6ADEC76F-30FA';

-- OPTION 3: Delete ALL reports (DANGER - only if you want to start fresh)
-- Uncomment to delete everything

-- DELETE FROM incidents;

-- OPTION 4: Delete reports created on a specific date
-- Uncomment and adjust date

-- DELETE FROM incidents WHERE DATE(created_at) = '2026-10-26';

-- VERIFICATION QUERIES (run these BEFORE and AFTER deleting)

-- Count total incidents
SELECT COUNT(*) as total_incidents FROM incidents;

-- Show incidents with "test" in title
SELECT reference_number, title, created_at FROM incidents 
WHERE LOWER(title) LIKE '%test%'
ORDER BY created_at DESC;

-- Show all incidents
SELECT reference_number, title, barangay, status, created_at FROM incidents
ORDER BY created_at DESC
LIMIT 20;
