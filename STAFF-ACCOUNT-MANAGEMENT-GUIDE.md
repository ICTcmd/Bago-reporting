# 🔐 Bago Safe: Staff Account Management Guide

## Table of Contents
1. [Security Overview](#security-overview)
2. [Why No Public Signup?](#why-no-public-signup)
3. [Creating Staff Accounts](#creating-staff-accounts)
4. [Default Login Credentials](#default-login-credentials)
5. [Managing Accounts](#managing-accounts)
6. [Security Best Practices](#security-best-practices)

---

## 🛡️ Security Overview

**Bago Safe uses a SECURE account creation system for staff members.**

### Key Security Features:
- ✅ **No public staff signup page** - Prevents unauthorized access attempts
- ✅ **Admin-only account creation** - Only system administrators can create staff accounts
- ✅ **Direct database insertion** - Accounts created via secure SQL scripts
- ✅ **Role-based access control** - Different permission levels (Admin, Supervisor, Responder)
- ✅ **Audit logging** - All login attempts tracked
- ✅ **Email verification** - Accounts pre-verified for immediate use

---

## 🚫 Why No Public Signup?

### Security Reasons:
1. **Prevent fake accounts** - Malicious users cannot create staff accounts
2. **Control access** - Only authorized DRRMO personnel get accounts
3. **Compliance** - Meets government security requirements
4. **Accountability** - Every account tied to verified personnel
5. **Reduce spam** - No automated bot registrations

### The Right Way:
- Staff accounts are created by administrators using secure SQL scripts
- Each account is tied to official government email addresses
- All accounts documented and approved by DRRMO management

---

## 🔧 Creating Staff Accounts

### Step 1: Access Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**

### Step 2: Run the Creation Script
1. Open the file: `CREATE-STAFF-ACCOUNTS.sql`
2. **IMPORTANT:** Edit the script to add actual staff information:
   - Replace `admin@bagocity.gov.ph` with real email
   - Replace `AdminPass2026!` with strong password
   - Replace `DRRMO Administrator` with actual name
   - Replace phone numbers with real numbers

3. Copy the edited script
4. Paste into Supabase SQL Editor
5. Click **Run** (or press Ctrl+Enter)

### Step 3: Verify Creation
Run this verification query:
```sql
SELECT 
  p.email,
  p.full_name,
  p.role,
  p.created_at
FROM profiles p
WHERE p.role IN ('admin', 'supervisor', 'responder')
ORDER BY p.created_at DESC;
```

You should see all newly created accounts listed.

---

## 👤 Default Login Credentials

### ⚠️ IMPORTANT: Change These Immediately!

The SQL script includes default credentials that **MUST BE CHANGED** after first login.

### Role Structure:

#### 🔴 **Admin** (Full Access)
- Can do everything in the system
- Create/delete accounts
- Manage all incidents
- View all reports and analytics
- Create announcements
- Assign staff to incidents

**Default Email:** `admin@bagocity.gov.ph`  
**Default Password:** `AdminPass2026!`

#### 🟡 **Supervisor** (Management Access)
- View all incidents
- Assign responders
- Create announcements
- Generate reports
- Cannot create/delete accounts

**Default Email:** `supervisor@bagocity.gov.ph`  
**Default Password:** `SupervisorPass2026!`

#### 🟢 **Responder** (Field Access)
- View assigned incidents
- Update incident status
- Add notes and photos
- Mark incidents resolved
- Cannot access admin features

**Default Email:** `responder1@bagocity.gov.ph`  
**Default Password:** `Responder1Pass2026!`

---

## ⚙️ Managing Accounts

### Change Password
```sql
UPDATE auth.users
SET 
  encrypted_password = crypt('NewStrongPassword123!', gen_salt('bf')),
  updated_at = NOW()
WHERE email = 'staff@bagocity.gov.ph';
```

### Change Role (Promote/Demote)
```sql
UPDATE profiles
SET 
  role = 'supervisor',  -- Options: 'responder', 'supervisor', 'admin'
  updated_at = NOW()
WHERE email = 'staff@bagocity.gov.ph';
```

### Update Staff Information
```sql
UPDATE profiles
SET 
  full_name = 'New Name',
  phone_number = '+63 917 123 4567',
  updated_at = NOW()
WHERE email = 'staff@bagocity.gov.ph';
```

### Disable Account (Soft Delete)
```sql
-- Mark account as inactive by changing to citizen role
UPDATE profiles
SET 
  role = 'citizen',
  updated_at = NOW()
WHERE email = 'staff@bagocity.gov.ph';
```

### Delete Account (Permanent)
```sql
-- ⚠️ USE WITH EXTREME CAUTION - THIS IS PERMANENT
DELETE FROM auth.users
WHERE email = 'staff@bagocity.gov.ph';
-- Profile will be automatically deleted via CASCADE
```

### View Login Activity
```sql
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
```

---

## 🔒 Security Best Practices

### Password Requirements:
- ✅ Minimum 8 characters
- ✅ Mix of uppercase and lowercase
- ✅ Include numbers
- ✅ Include special characters (!@#$%^&*)
- ✅ No common words or patterns
- ✅ Unique for each account

### Good Password Examples:
- `Bag0C!ty#2026`
- `Drrm0$ecure!`
- `BagoSaf3@2026`

### Bad Password Examples:
- ❌ `password123`
- ❌ `bagocity`
- ❌ `12345678`
- ❌ `admin`

### Account Security Checklist:
- [ ] Change all default passwords immediately
- [ ] Use official government email addresses only
- [ ] Document all staff accounts in secure location
- [ ] Review access logs weekly
- [ ] Remove access when staff leaves
- [ ] Rotate passwords every 90 days
- [ ] Never share passwords via email/chat
- [ ] Use password manager for storage
- [ ] Enable 2FA when available
- [ ] Report suspicious login attempts

### Distribution of Credentials:
1. **Never via email** - Email can be intercepted
2. **Never via chat** - Chat apps are not secure
3. **In person** - Best method, hand over printed sheet
4. **Secure portal** - Use encrypted password sharing tool
5. **Phone call** - For password reset only
6. **Sealed envelope** - Physical security for important accounts

### When Staff Leaves:
1. **Immediate action required:**
   - Disable account within 24 hours
   - Change any shared passwords
   - Review their access logs
   - Document their departure
   - Reassign their incidents

2. **Run this query:**
```sql
-- Mark as inactive
UPDATE profiles
SET role = 'citizen', updated_at = NOW()
WHERE email = 'departed.staff@bagocity.gov.ph';

-- Or delete permanently after 30 days
DELETE FROM auth.users
WHERE email = 'departed.staff@bagocity.gov.ph';
```

---

## 📊 Account Statistics

### View All Staff Accounts:
```sql
SELECT 
  role,
  COUNT(*) as total,
  COUNT(CASE WHEN last_sign_in_at > NOW() - INTERVAL '30 days' THEN 1 END) as active_last_30_days
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE role IN ('admin', 'supervisor', 'responder')
GROUP BY role;
```

---

## 🆘 Troubleshooting

### "Can't log in with new account"
- ✅ Check email is correct (no typos)
- ✅ Check password is correct (case-sensitive)
- ✅ Verify account was created (run verification query)
- ✅ Check if account is confirmed (`email_confirmed_at` not null)

### "Unauthorized access" error
- ✅ Check user role is correct (not 'citizen')
- ✅ Verify RLS policies are enabled
- ✅ Check if user profile was created (run verification query)

### "Need to reset password"
- ✅ Use password reset SQL query above
- ✅ Notify staff member of new password
- ✅ Ask them to change it on first login

---

## 📞 Support

For help with account management:
1. Check this guide first
2. Review Supabase documentation
3. Contact your database administrator
4. Email: IT support team

---

## ✅ Quick Setup Checklist

For new Bago Safe installation:

- [ ] 1. Edit `CREATE-STAFF-ACCOUNTS.sql` with real staff info
- [ ] 2. Run script in Supabase SQL Editor
- [ ] 3. Verify accounts created successfully
- [ ] 4. Test login with admin account
- [ ] 5. Change default passwords
- [ ] 6. Create responder accounts for field staff
- [ ] 7. Document all accounts securely
- [ ] 8. Distribute credentials to staff (in person)
- [ ] 9. Train staff on login process
- [ ] 10. Set up regular password rotation schedule

---

**Last Updated:** November 4, 2026  
**Version:** 1.0  
**Maintained by:** Bago City DRRMO IT Team
