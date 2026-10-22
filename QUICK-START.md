# 🚀 Quick Start Guide - Bago Safe

Get Bago Safe running in 10 minutes!

---

## ✅ Checklist

- [ ] Node.js installed (v18.17+)
- [ ] Supabase account created
- [ ] Dependencies installed
- [ ] Database schema applied
- [ ] Environment variables configured
- [ ] Development server running

---

## Step-by-Step

### 1. Install Dependencies (2 minutes)

```bash
cd "c:\Users\OJTBEEG\Desktop\bago city reporting app\bago-safe"
npm install
```

### 2. Create Supabase Project (3 minutes)

1. Go to https://supabase.com/dashboard
2. Click **New Project**
3. Fill in:
   - **Name:** bago-safe
   - **Database Password:** (save this!)
   - **Region:** Southeast Asia (Singapore)
4. Click **Create new project**
5. Wait 2-3 minutes for setup

### 3. Apply Database Schema (2 minutes)

1. In Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click **New query**
3. Open `supabase/schema.sql` from this project
4. Copy ALL content (Ctrl+A, Ctrl+C)
5. Paste into SQL Editor
6. Click **Run** (or F5)
7. ✅ You should see "Success. No rows returned"

### 4. Create Storage Bucket (1 minute)

1. In Supabase dashboard, click **Storage** (left sidebar)
2. Click **Create a new bucket**
3. Name: `incident-media`
4. Public bucket: **OFF** (keep it private)
5. Click **Create bucket**

### 5. Configure Environment (2 minutes)

1. In Supabase dashboard, click **Project Settings** (gear icon, bottom left)
2. Click **API** tab
3. Copy the values:

```bash
# Copy .env.local.example to .env.local
copy .env.local.example .env.local

# Edit .env.local with your values:
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (⚠️ secret!)
```

### 6. Run Development Server (30 seconds)

```bash
npm run dev
```

Open http://localhost:3000 🎉

---

## 🧪 Test the System

### Test 1: Submit a Report

1. Go to http://localhost:3000
2. Click **Submit Report**
3. Fill out the form:
   - Type: Flood
   - Severity: Medium
   - Title: "Test incident"
   - Description: "Testing the system"
   - Location: "Poblacion, Bago City"
   - Contact: your email
4. Click **Submit Report**
5. ✅ You should see a reference number (BS-XXXXX-XXXX)

### Test 2: Track the Report

1. Go to home → Click **Track Status**
2. Enter your reference number
3. Click **Search**
4. ✅ You should see your report details with status "Submitted"

### Test 3: Create Staff Account

In Supabase dashboard:

1. Click **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Email: `staff@test.com`
4. Password: `Test123!@#`
5. Click **Create user**
6. Click **Database** → **Table Editor** → **profiles**
7. Find the user row, click **Edit**
8. Change `role` from `citizen` to `responder`
9. Click **Save**

### Test 4: Staff Login

1. Go to http://localhost:3000 → Click **Staff Login**
2. Email: `staff@test.com`
3. Password: `Test123!@#`
4. Click **Sign In**
5. ✅ You should see the dashboard with your test report

---

## 🎯 Next Steps

### 1. Customize Contact Information

Edit `.env.local`:
```env
NEXT_PUBLIC_EMERGENCY_HOTLINE=911
NEXT_PUBLIC_DRRMO_CONTACT=+63-XXX-XXX-XXXX
```

### 2. Add Real Staff Accounts

Use the same process as Test 3 above, but with real email addresses.

### 3. Deploy to Production

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

Add the same environment variables in Vercel dashboard.

---

## ❓ Common Issues

### Issue: "Can't connect to database"
**Solution:** Check `.env.local` has correct `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Issue: "Report not found" after submission
**Solution:** Verify database schema was applied correctly. Re-run `supabase/schema.sql`

### Issue: Photos not uploading
**Solution:** Verify `incident-media` storage bucket exists and is private

### Issue: Can't login as staff
**Solution:** Check `profiles` table has user with `role` = 'responder', 'supervisor', or 'admin'

---

## 📞 Need Help?

1. Check the full **README.md** for detailed documentation
2. Review **supabase/schema.sql** for database structure
3. Check browser console (F12) for errors
4. Check Supabase logs (Dashboard → Logs)

---

## ✅ System is Ready When:

- ✅ Home page loads
- ✅ Can submit a report
- ✅ Can track a report
- ✅ Staff can login
- ✅ Dashboard shows statistics

**You're all set! 🎉**
