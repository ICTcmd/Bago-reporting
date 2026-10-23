# 🧪 Bago Safe - Testing Guide

## Production Testing (October 22, 2026)

### 🌐 Live URLs
- **Production:** https://bago-reporting.vercel.app
- **GitHub:** https://github.com/ICTcmd/Bago-reporting
- **Supabase:** (Check your Supabase dashboard)

---

## ✅ What to Test Now

### 1. Homepage
**URL:** https://bago-reporting.vercel.app

**Expected:**
- ✅ Page loads without errors
- ✅ Navigation links work
- ✅ "Report Incident" button visible
- ✅ "Staff Login" link visible
- ✅ Responsive on mobile

---

### 2. Staff Login
**URL:** https://bago-reporting.vercel.app/login

**Expected:**
- ✅ Login form displays
- ✅ Email and password fields work
- ✅ "Sign In" button functional
- ✅ Error messages for wrong credentials

**Test Credentials:**
Use the staff account you created in Supabase:
```
Email: [your staff email]
Password: [your staff password]
```

**If you need to create a staff account:**
1. Go to Supabase Dashboard
2. Open SQL Editor
3. Run:
```sql
-- First, sign up through the app or use Supabase Auth UI
-- Then update the profile:
UPDATE profiles 
SET role = 'staff', full_name = 'Test Staff'
WHERE email = 'your-email@example.com';
```

---

### 3. Dashboard - Map View
**URL:** https://bago-reporting.vercel.app/dashboard (after login)

**Expected:**
- ✅ Map loads with Bago City center (10.5380, 122.8424)
- ✅ Map controls (zoom in/out, pan) work
- ✅ Legend shows severity colors (bottom left)
- ✅ Active incident counter (top right)
- ✅ Bottom navigation visible (Map | Feed | Profile)
- ✅ Floating "+" button (bottom right)

**If No Incidents Exist Yet:**
- Map will show but no markers
- Counter will show "0"
- This is normal! We haven't created test data yet.

---

### 4. Dashboard - Feed View
**Click the "Feed" tab in bottom navigation**

**Expected:**
- ✅ "Incident Feed" header
- ✅ Incident count display
- ✅ If no incidents: "No incidents reported yet" message
- ✅ If incidents exist: Cards with:
  - Severity badge (color-coded)
  - Status badge
  - Category label
  - Title and description
  - Address and barangay
  - Reference number
  - Timestamp

---

### 5. Dashboard - Profile View
**Click the "Profile" tab in bottom navigation**

**Expected:**
- ✅ User avatar circle with icon
- ✅ Full name displayed
- ✅ Email displayed
- ✅ Role badge (STAFF/ADMIN)
- ✅ Account information card
- ✅ "Sign Out" button works

---

### 6. Responsive Design
**Test on different screen sizes:**

**Mobile (< 768px):**
- ✅ Bottom navigation visible
- ✅ Floating action button accessible
- ✅ Map fills screen properly
- ✅ Cards stack vertically in feed
- ✅ Profile view centered

**Tablet (768px - 1024px):**
- ✅ Layout adjusts appropriately
- ✅ Cards in feed use available width

**Desktop (> 1024px):**
- ✅ Content not too wide (max-width respected)
- ✅ Bottom nav centered with max-width

---

## 🐛 Common Issues & Solutions

### Issue 1: Map Not Loading
**Symptoms:** Blank white space instead of map

**Possible Causes:**
1. Leaflet CSS not loading
2. JavaScript error blocking map render
3. Network timeout

**Solution:**
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests
4. If you see CORS errors, check Vercel environment variables

---

### Issue 2: "Not Authenticated" After Login
**Symptoms:** Redirected back to login after successful login

**Possible Causes:**
1. Supabase URL/Key mismatch
2. Cookie not being set
3. Middleware blocking access

**Solution:**
1. Check Vercel environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Verify these match your Supabase project
3. Redeploy after fixing

---

### Issue 3: Database Connection Error
**Symptoms:** "Failed to load incidents" or similar error

**Possible Causes:**
1. Environment variables not set in Vercel
2. RLS policies blocking access
3. Schema not applied to database

**Solution:**
1. Verify environment variables in Vercel
2. Check Supabase Dashboard → Table Editor
3. Confirm tables exist: incidents, profiles, etc.
4. Run schema.sql if tables are missing

---

### Issue 4: Build Errors on Vercel
**Symptoms:** Deployment failed with TypeScript errors

**Recent Fix Applied:**
- Downgraded from Next.js 16.4.2 to 15.1.6
- If you see middleware errors, check middleware.ts syntax

**Solution:**
1. Check Vercel deployment logs
2. Look for specific error messages
3. Common fixes:
   - Remove unused imports
   - Fix TypeScript type errors
   - Check for missing dependencies

---

## 📊 Testing Checklist

### Pre-Launch Checklist
- [ ] Homepage loads correctly
- [ ] Login page works
- [ ] Staff can successfully log in
- [ ] Dashboard displays after login
- [ ] Map component renders
- [ ] All three tabs work (Map | Feed | Profile)
- [ ] Sign out redirects to homepage
- [ ] Mobile responsive (test on phone)
- [ ] No console errors in DevTools
- [ ] Environment variables confirmed in Vercel

### Post-Login Checklist
- [ ] User's name displays correctly
- [ ] User's email displays correctly
- [ ] Role badge shows correct role (STAFF/ADMIN)
- [ ] Bottom navigation tabs switch views
- [ ] Floating action button visible
- [ ] Profile information accurate

### With Test Data (After Creating Sample Incidents)
- [ ] Incident markers appear on map
- [ ] Markers have correct colors by severity
- [ ] Clicking marker shows popup
- [ ] Incident cards display in feed
- [ ] Status badges show correct colors
- [ ] Reference numbers are formatted correctly
- [ ] Timestamps display in local time
- [ ] Active incident counter updates

---

## 🧪 Creating Test Data

### Method 1: Manual SQL Insert
```sql
-- Insert test incident
INSERT INTO incidents (
  reference_number,
  title,
  description,
  category,
  severity,
  status,
  location_lat,
  location_lng,
  address_text,
  barangay,
  reporter_name,
  reporter_phone,
  reporter_email
) VALUES (
  'INC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-0001',
  'Test: Street Light Not Working',
  'The street light at the corner of Main St and 1st Ave has been out for 3 days.',
  'infrastructure',
  'low',
  'submitted',
  10.5380,
  122.8424,
  'Main St & 1st Ave, Bago City',
  'Barangay 1',
  'Juan Dela Cruz',
  '09171234567',
  'juan@example.com'
);
```

### Method 2: Use Public Report Form
1. Go to: https://bago-reporting.vercel.app/report
2. Fill out the incident report form
3. Submit the report
4. Check if it appears in dashboard

---

## 📱 Mobile Testing Steps

### Using Real Device
1. Open phone browser
2. Navigate to: https://bago-reporting.vercel.app/login
3. Login with staff credentials
4. Test all tabs and interactions
5. Check if touch gestures work on map
6. Verify floating button doesn't overlap content

### Using DevTools Device Emulation
1. Open Chrome DevTools (F12)
2. Click "Toggle Device Toolbar" (Ctrl+Shift+M)
3. Select device: iPhone 12 Pro, Samsung Galaxy S20, etc.
4. Test portrait and landscape modes
5. Check different screen sizes

---

## 🔍 What to Look For

### Visual Issues
- [ ] Text is readable (not too small)
- [ ] Colors have good contrast
- [ ] Buttons are easily clickable (not too small)
- [ ] No overlapping elements
- [ ] Images load correctly
- [ ] Icons display properly (Lucide icons)

### Functional Issues
- [ ] All buttons respond to clicks
- [ ] Navigation works smoothly
- [ ] No infinite loading states
- [ ] Error messages display when appropriate
- [ ] Success messages display when appropriate
- [ ] Forms validate input correctly

### Performance Issues
- [ ] Page loads in < 3 seconds
- [ ] Map renders in < 2 seconds
- [ ] No lag when switching tabs
- [ ] Smooth scrolling in feed view
- [ ] Images load progressively (no flash)

---

## 📝 Reporting Issues

### When You Find a Bug
Please provide:
1. **What you were doing:** "I clicked the Map tab"
2. **What happened:** "Page went blank"
3. **What you expected:** "Map should show"
4. **Browser & Device:** "Chrome on iPhone 12"
5. **Screenshot/Video:** (if possible)
6. **Console Errors:** Open DevTools → Console → Screenshot errors

### Where to Report
- GitHub Issues: https://github.com/ICTcmd/Bago-reporting/issues
- Or just tell me directly!

---

## ✅ Success Criteria

### Minimum Viable Product (MVP)
This deployment is considered successful if:
- ✅ Staff can log in without errors
- ✅ Dashboard loads and displays correctly
- ✅ All three tabs (Map/Feed/Profile) work
- ✅ No critical JavaScript errors
- ✅ Works on mobile devices (responsive)
- ✅ Can sign out successfully

### Ready for Enhancement
After MVP validation, we can proceed to:
- 🎯 Build incident detail page
- 🎯 Add status update functionality
- 🎯 Implement filtering and search

---

## 🎉 Next Steps After Testing

1. **If everything works:**
   - Start building incident detail page
   - Add status update system
   - Create test incidents for demo

2. **If issues found:**
   - Document issues clearly
   - Prioritize by severity
   - Fix critical bugs first
   - Redeploy and retest

---

**Remember:** This is a working prototype! Finding issues is expected and helpful. Report anything that seems off, no matter how small.

**Current Status:** 🟢 Deployed and awaiting your testing feedback!
