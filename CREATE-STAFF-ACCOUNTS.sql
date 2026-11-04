-- ========================================================================
-- BAGO SAFE: SECURE STAFF ACCOUNT CREATION
-- ========================================================================
-- This script creates staff accounts directly in Supabase
-- For security, staff accounts should ONLY be created by administrators
-- Never expose public signup for staff accounts
-- ========================================================================

-- ========================================================================
-- IMPORTANT SECURITY NOTES:
-- ========================================================================
-- 1. Run this script ONLY from Supabase Dashboard SQL Editor
-- 2. Change the passwords immediately after first login
-- 3. Never commit actual passwords to version control
-- 4. Use strong passwords (min 8 chars, mixed case, numbers, symbols)
-- 5. Accounts are automatically logged and auditable
-- ========================================================================

-- ========================================================================
-- STEP 1: Create Admin Account
-- ========================================================================
-- The main administrator with full system access
-- Replace with actual admin details

-- Create admin user in auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@bagocity.gov.ph',  -- CHANGE THIS
  crypt('AdminPass2026!', gen_salt('bf')),  -- CHANGE THIS PASSWORD
  NOW(),
  NULL,
  NULL,
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"DRRMO Administrator"}',  -- CHANGE THIS
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Create admin profile
-- This will be auto-created by trigger, but we update the role
UPDATE profiles
SET role = 'admin',
    full_name = 'DRRMO Administrator',  -- CHANGE THIS
    phone_number = '+63 917 123 4567'  -- CHANGE THIS (optional)
WHERE email = 'admin@bagocity.gov.ph';

-- ========================================================================
-- STEP 2: Create Supervisor Account
-- ========================================================================
-- Supervisors can manage responders and create announcements

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'supervisor@bagocity.gov.ph',  -- CHANGE THIS
  crypt('SupervisorPass2026!', gen_salt('bf')),  -- CHANGE THIS PASSWORD
  NOW(),
  NULL,
  NULL,
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"DRRMO Supervisor"}',  -- CHANGE THIS
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

UPDATE profiles
SET role = 'supervisor',
    full_name = 'DRRMO Supervisor',  -- CHANGE THIS
    phone_number = '+63 917 234 5678'  -- CHANGE THIS (optional)
WHERE email = 'supervisor@bagocity.gov.ph';

-- ========================================================================
-- STEP 3: Create Responder Accounts
-- ========================================================================
-- Front-line staff who handle and respond to incidents

-- Responder 1
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'responder1@bagocity.gov.ph',  -- CHANGE THIS
  crypt('Responder1Pass2026!', gen_salt('bf')),  -- CHANGE THIS PASSWORD
  NOW(),
  NULL,
  NULL,
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Responder One"}',  -- CHANGE THIS
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

UPDATE profiles
SET role = 'responder',
    full_name = 'Responder One',  -- CHANGE THIS
    phone_number = '+63 917 345 6789'  -- CHANGE THIS (optional)
WHERE email = 'responder1@bagocity.gov.ph';

-- Responder 2
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'responder2@bagocity.gov.ph',  -- CHANGE THIS
  crypt('Responder2Pass2026!', gen_salt('bf')),  -- CHANGE THIS PASSWORD
  NOW(),
  NULL,
  NULL,
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Responder Two"}',  -- CHANGE THIS
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

UPDATE profiles
SET role = 'responder',
    full_name = 'Responder Two',  -- CHANGE THIS
    phone_number = '+63 917 456 7890'  -- CHANGE THIS (optional)
WHERE email = 'responder2@bagocity.gov.ph';

-- ========================================================================
-- VERIFICATION QUERIES
-- ========================================================================
-- Run these to verify accounts were created successfully

-- View all staff accounts
SELECT 
  p.email,
  p.full_name,
  p.role,
  p.phone_number,
  p.created_at,
  CASE 
    WHEN u.email_confirmed_at IS NOT NULL THEN 'Confirmed'
    ELSE 'Not Confirmed'
  END as status
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.role IN ('admin', 'supervisor', 'responder')
ORDER BY 
  CASE p.role
    WHEN 'admin' THEN 1
    WHEN 'supervisor' THEN 2
    WHEN 'responder' THEN 3
  END,
  p.created_at;

-- Count staff by role
SELECT 
  role,
  COUNT(*) as total
FROM profiles
WHERE role IN ('admin', 'supervisor', 'responder')
GROUP BY role
ORDER BY 
  CASE role
    WHEN 'admin' THEN 1
    WHEN 'supervisor' THEN 2
    WHEN 'responder' THEN 3
  END;

-- ========================================================================
-- PASSWORD RESET INSTRUCTIONS
-- ========================================================================
-- To reset a staff member's password, run this query:
/*
UPDATE auth.users
SET 
  encrypted_password = crypt('NewPassword123!', gen_salt('bf')),
  updated_at = NOW()
WHERE email = 'staff@bagocity.gov.ph';
*/

-- ========================================================================
-- DELETE STAFF ACCOUNT (USE WITH CAUTION)
-- ========================================================================
-- To remove a staff account permanently:
/*
DELETE FROM auth.users
WHERE email = 'staff@bagocity.gov.ph';
-- Profile will be auto-deleted via CASCADE
*/

-- ========================================================================
-- ROLE CHANGE INSTRUCTIONS
-- ========================================================================
-- To promote/demote a staff member:
/*
UPDATE profiles
SET role = 'supervisor',  -- Options: 'responder', 'supervisor', 'admin'
    updated_at = NOW()
WHERE email = 'staff@bagocity.gov.ph';
*/

-- ========================================================================
-- SECURITY BEST PRACTICES
-- ========================================================================
-- 1. ✅ Change all default passwords immediately
-- 2. ✅ Use strong passwords (min 8 chars, mixed case, numbers, symbols)
-- 3. ✅ Never share passwords via email or chat
-- 4. ✅ Use password manager for secure storage
-- 5. ✅ Rotate passwords every 90 days
-- 6. ✅ Remove access immediately when staff leaves
-- 7. ✅ Review access logs regularly
-- 8. ✅ Enable 2FA when available
-- 9. ✅ Use official government email addresses only
-- 10. ✅ Document all account changes

-- ========================================================================
-- AUDIT LOG QUERY
-- ========================================================================
-- View recent login activity
/*
SELECT 
  p.email,
  p.full_name,
  p.role,
  u.last_sign_in_at,
  u.created_at as account_created
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.role IN ('admin', 'supervisor', 'responder')
ORDER BY u.last_sign_in_at DESC NULLS LAST;
*/

-- ========================================================================
-- END OF SCRIPT
-- ========================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Staff accounts created successfully!';
  RAISE NOTICE '⚠️  IMPORTANT: Change all default passwords immediately!';
  RAISE NOTICE '📧 Notify staff members of their login credentials securely';
  RAISE NOTICE '🔒 All login attempts are logged and monitored';
END $$;
