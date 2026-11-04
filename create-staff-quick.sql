-- Quick Staff Role Update Script
-- Run this AFTER creating users via Supabase Dashboard → Authentication → Add User

-- ============================================
-- STEP 1: First create users via Supabase Dashboard:
-- - Go to Authentication → Users → Add user
-- - Enter email and password
-- - Check "Auto-confirm email"
-- - Click Save
-- ============================================

-- ============================================
-- STEP 2: Then run the appropriate query below to set their role
-- Replace the email with the actual staff email
-- ============================================

-- Create ADMIN account (DRRMO Chief, IT Admin)
UPDATE profiles 
SET 
  role = 'admin',
  full_name = 'DRRMO Administrator'
WHERE email = 'admin@bagocity.gov.ph';

-- Create SUPERVISOR account (Operations Manager)
UPDATE profiles 
SET 
  role = 'supervisor',
  full_name = 'DRRMO Supervisor'
WHERE email = 'supervisor@bagocity.gov.ph';

-- Create RESPONDER account (Field Officers, Desk Staff)
UPDATE profiles 
SET 
  role = 'responder',
  full_name = 'DRRMO Responder'
WHERE email = 'responder@bagocity.gov.ph';

-- ============================================
-- BULK UPDATE: Set multiple staff at once
-- ============================================

-- Set multiple supervisors:
UPDATE profiles SET role = 'supervisor' 
WHERE email IN (
  'supervisor1@bagocity.gov.ph',
  'supervisor2@bagocity.gov.ph'
);

-- Set multiple responders:
UPDATE profiles SET role = 'responder' 
WHERE email IN (
  'responder1@bagocity.gov.ph',
  'responder2@bagocity.gov.ph',
  'responder3@bagocity.gov.ph',
  'officer1@bagocity.gov.ph',
  'officer2@bagocity.gov.ph'
);

-- ============================================
-- VERIFY: Check all staff accounts
-- ============================================

SELECT 
  email,
  full_name,
  role,
  created_at
FROM profiles
WHERE role IN ('admin', 'supervisor', 'responder')
ORDER BY role, email;

-- ============================================
-- COUNT: See how many staff by role
-- ============================================

SELECT 
  role,
  COUNT(*) as total_users
FROM profiles
GROUP BY role
ORDER BY 
  CASE role
    WHEN 'admin' THEN 1
    WHEN 'supervisor' THEN 2
    WHEN 'responder' THEN 3
    WHEN 'citizen' THEN 4
  END;
