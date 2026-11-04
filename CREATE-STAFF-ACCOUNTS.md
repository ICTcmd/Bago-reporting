# Creating Staff Accounts for Bago Safe
## DRRMO Staff Login Setup Guide

**Date:** October 30, 2026  
**App:** Bago Safe - https://bago-reporting.vercel.app

---

## 🎯 STAFF LOGIN SYSTEM STATUS

✅ **Login page exists** at `/login`  
✅ **Dashboard exists** at `/dashboard`  
✅ **Database schema ready** with staff roles  
✅ **Authentication working** via Supabase  
✅ **Row Level Security enabled**  

**What's needed:** Create staff user accounts in Supabase

---

## 👥 STAFF ROLES IN BAGO SAFE

The system has 4 user roles:

| Role | Permissions | Who Should Have This |
|------|-------------|---------------------|
| **admin** | Full access, can delete, manage staff | DRRMO Chief, IT Admin |
| **supervisor** | Manage incidents, create announcements | DRRMO Supervisors |
| **responder** | View/update incidents, add notes | Field responders, operators |
| **citizen** | Submit incidents, track reports | General public |

---

## 🔑 HOW TO CREATE STAFF ACCOUNTS

### Option 1: Via Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - https://supabase.com/dashboard
   - Select your Bago Safe project

2. **Create User Account**
   - Go to **Authentication** → **Users**
   - Click **"Add user"** or **"Invite user"**
   - Fill in:
     - **Email:** staff member's email (e.g., `juan.delacruz@bagocity.gov.ph`)
     - **Password:** Create a secure password
     - **Auto-confirm email:** ✅ Check this (so they can login immediately)

3. **Set Staff Role**
   - After creating the user, you'll see their user ID
   - Copy the **User ID** (UUID)
   - Go to **Table Editor** → **profiles**
   - Find the new profile row (should auto-create)
   - Click to edit the row
   - Change **role** from `citizen` to:
     - `admin` (for DRRMO Chief)
     - `supervisor` (for DRRMO Supervisors)
     - `responder` (for field staff)
   - Click **Save**

4. **Give Credentials to Staff**
   - Email: [their email]
   - Password: [the password you set]
   - Login URL: https://bago-reporting.vercel.app/login

---

### Option 2: Via SQL (Faster for Multiple Staff)

Run this SQL in **Supabase SQL Editor**:

```sql
-- Example: Create an admin account
-- Replace with actual staff email and password

-- First, the user is created in auth.users (do this via Dashboard or Auth API)
-- Then update their profile role:

UPDATE profiles 
SET role = 'admin'
WHERE email = 'drrmo.chief@bagocity.gov.ph';

-- Create multiple staff at once:
UPDATE profiles SET role = 'supervisor' WHERE email IN (
  'supervisor1@bagocity.gov.ph',
  'supervisor2@bagocity.gov.ph'
);

UPDATE profiles SET role = 'responder' WHERE email IN (
  'responder1@bagocity.gov.ph',
  'responder2@bagocity.gov.ph',
  'responder3@bagocity.gov.ph'
);
```

**Note:** You must first create the auth user via Dashboard, THEN update their role via SQL.

---

## 📋 RECOMMENDED STAFF ACCOUNTS TO CREATE

### For Testing/Demo:

1. **Admin Account**
   - Email: `admin@bagocity.gov.ph`
   - Role: `admin`
   - For: DRRMO Chief or IT Admin

2. **Supervisor Account**
   - Email: `supervisor@bagocity.gov.ph`
   - Role: `supervisor`
   - For: Incident manager

3. **Responder Account**
   - Email: `responder@bagocity.gov.ph`
   - Role: `responder`
   - For: Field officer testing

### For Production:

Create accounts for actual DRRMO staff:
- DRRMO Chief (admin)
- Operations Manager (supervisor)
- Desk Officers (responder)
- Field Responders (responder)

---

## 🧪 TESTING STAFF LOGIN

### Test Admin Login:

1. Go to: https://bago-reporting.vercel.app/login
2. Enter admin credentials
3. Should redirect to `/dashboard`
4. Verify you can:
   - ✅ View all incidents on map
   - ✅ See incident list
   - ✅ Click incidents to view details
   - ✅ Update incident status
   - ✅ View your profile

### What Staff Can Do:

**Admin:**
- View all incidents
- Update incident status
- Delete incidents
- Assign incidents to responders
- View all staff profiles
- Create/edit announcements

**Supervisor:**
- View all incidents
- Update incident status
- Assign incidents
- Create announcements

**Responder:**
- View assigned incidents
- Update incident status
- Add notes and updates

---

## 🔐 SECURITY NOTES

1. **Use Strong Passwords**
   - Minimum 12 characters
   - Mix of letters, numbers, symbols
   - Don't share passwords

2. **Use Official Email Addresses**
   - Preferably: `@bagocity.gov.ph`
   - Or: official DRRMO email addresses

3. **Row Level Security is Active**
   - Staff can only access what their role allows
   - Citizens cannot see staff-only data
   - All actions are logged

4. **Change Default Passwords**
   - Staff should change password after first login
   - (We'll add password change feature later)

---

## 🚨 CURRENT STAFF LOGIN FLOW

1. Staff opens: https://bago-reporting.vercel.app
2. Clicks **"Staff Login"** button
3. Enters email and password
4. System checks:
   - ✅ Valid credentials?
   - ✅ User has staff role?
5. Redirects to Dashboard
6. Dashboard loads:
   - Map view with all incidents
   - Feed view with incident list
   - Profile view with user info

---

## ❌ TROUBLESHOOTING

### "Invalid email or password"
**Solution:** 
- Check email spelling
- Verify password is correct
- Check if user exists in Supabase → Authentication → Users

### "Access Denied" or blank dashboard
**Solution:**
- Check user's role in Table Editor → profiles
- Must be `responder`, `supervisor`, or `admin`
- Not `citizen`

### Profile shows "Guest User"
**Solution:**
- User might not have a profile row
- Check Table Editor → profiles
- If missing, run:
```sql
INSERT INTO profiles (id, email, role)
VALUES (
  '[user-id-from-auth]',
  'staff@email.com',
  'responder'
);
```

### Can't see incidents on map
**Solution:**
- Check if incidents exist (should have test data)
- Check browser console for errors
- Verify user role is set correctly

---

## 📊 CHECKING CURRENT USERS

### View All Users and Roles:

```sql
SELECT 
  p.email,
  p.full_name,
  p.role,
  p.created_at,
  u.last_sign_in_at
FROM profiles p
LEFT JOIN auth.users u ON u.id = p.id
ORDER BY p.created_at DESC;
```

### Count Users by Role:

```sql
SELECT role, COUNT(*) as count
FROM profiles
GROUP BY role
ORDER BY role;
```

---

## ✅ QUICK START CHECKLIST

To get staff login working:

- [ ] Database schema is deployed (schema.sql ran)
- [ ] Created at least 1 admin account
- [ ] Created at least 1 responder account  
- [ ] Set their roles correctly in profiles table
- [ ] Tested login at /login
- [ ] Verified dashboard loads
- [ ] Can see incidents on map
- [ ] Staff can update incident status

---

## 🎯 NEXT STEPS

After staff accounts are created:

1. **Test Full Workflow:**
   - Citizen submits incident
   - Staff receives it in dashboard
   - Staff updates status
   - Citizen can track via reference number

2. **Add More Staff** as needed

3. **Optional Enhancements:**
   - Email notifications for new incidents
   - SMS alerts for critical incidents
   - Staff activity logs
   - Bulk incident management

---

## 📞 SUPPORT

**For issues with:**
- Creating accounts → Check Supabase dashboard
- Login not working → Check browser console
- Dashboard errors → Check database permissions

**Current Status:** 
- ✅ System is ready for staff accounts
- ⏳ Waiting for accounts to be created
- 🚀 Ready to use once accounts exist

---

**Last Updated:** October 30, 2026  
**System:** Bago Safe v1.0  
**Environment:** Production (bago-reporting.vercel.app)
