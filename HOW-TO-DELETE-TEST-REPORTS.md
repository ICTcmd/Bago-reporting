# How to Delete Test Reports

**Problem:** You see test reports in the community dashboard with titles like "test", "Test RLS off", "After GRANT fix"

**Solution:** These are test reports from development. Here's how to delete them.

---

## ✅ EASIEST METHOD: Using Supabase Dashboard

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com
2. Login to your account
3. Select your **Bago Safe** project
4. Click **"SQL Editor"** in the left sidebar

### Step 2: Run the Delete Query
Copy and paste this SQL query:

```sql
-- Delete all reports with "test" in the title
DELETE FROM incidents 
WHERE LOWER(title) LIKE '%test%';
```

### Step 3: Click "Run" Button
- The query will delete all reports with "test" in the title
- You'll see a success message

### Step 4: Verify
Check your community dashboard - test reports should be gone!

**URL:** https://bago-reporting.vercel.app/community

---

## 🎯 ALTERNATIVE: Delete Specific Reports

If you want to delete specific reports by their reference number:

```sql
-- Replace with actual reference numbers from your screenshots
DELETE FROM incidents WHERE reference_number = 'BS-WNQP4B9R-XV0D';
DELETE FROM incidents WHERE reference_number = 'BS-6ADEC81E-26E2';
DELETE FROM incidents WHERE reference_number = 'BS-6ADEC7C9-2E3E';
DELETE FROM incidents WHERE reference_number = 'BS-6ADEC76F-30FA';
```

---

## ⚠️ NUCLEAR OPTION: Delete ALL Reports

**WARNING:** This deletes EVERYTHING. Only use if you want to start completely fresh!

```sql
-- Delete ALL incidents (cannot be undone!)
DELETE FROM incidents;
```

---

## ✨ What You'll See After

### BEFORE:
```
Community Dashboard
📊 Total Reports: 15
⚠️ Active Cases: 15
✅ Resolved: 0

Feed shows:
- "test"
- "After GRANT fix"
- "Test with RLS off"
- "Test RLS off"
```

### AFTER:
```
Community Dashboard
📊 Total Reports: 0
⚠️ Active Cases: 0
✅ Resolved: 0

Feed shows:
"No reports found"
```

---

## 🚀 Start Fresh with Real Reports

After deleting test reports:

1. **Submit a Real Report**
   - Go to https://bago-reporting.vercel.app/report
   - Fill out the form with a real incident
   - Upload a photo
   - Submit

2. **See It in Community Feed**
   - Go to https://bago-reporting.vercel.app/community
   - Your report appears!
   - No more test reports

3. **Share with Public**
   - Tell citizens about the community dashboard
   - Encourage real reporting
   - Watch the feed grow!

---

## 📋 SQL File Included

I created a file called **`DELETE-TEST-REPORTS.sql`** in your project folder with all these queries ready to copy/paste.

---

## 🗺️ BONUS: Emergency Map is Now BIGGER!

**What Changed:**
- Map height: 600px → 700px ✨
- More visible on desktop
- Easier to see all 13 emergency locations
- Already deployed!

**Check it out:**
https://bago-reporting.vercel.app/emergency-map

---

## ❓ FAQ

**Q: Will deleting test reports affect real reports?**
A: No! The query only deletes reports with "test" in the title.

**Q: Can I undo after deleting?**
A: No, deletion is permanent. But you can always submit new reports!

**Q: Should I keep some test reports?**
A: Up to you! Delete them for a clean community feed, or keep them to show the system works.

**Q: Will this affect the database structure?**
A: No, it only deletes data rows, not the table structure.

**Q: Can staff still see deleted reports?**
A: No, once deleted, they're gone from everywhere (community feed, staff dashboard, tracking).

---

## 🎯 Recommended Action

**For Production Launch:**
1. Delete all test reports (clean slate)
2. Submit 1-2 real example reports
3. Announce to DRRMO staff
4. Announce to public
5. Monitor community dashboard

**For Testing:**
1. Keep test reports for now
2. Test all features
3. Delete later before public launch

---

## 🔗 Quick Links

**Supabase Dashboard:**
https://supabase.com/dashboard

**Community Feed:**
https://bago-reporting.vercel.app/community

**Submit Report:**
https://bago-reporting.vercel.app/report

**Emergency Map (BIGGER!):**
https://bago-reporting.vercel.app/emergency-map

---

**Need help?** Just ask! I can walk you through it.

**Status:** 
- ✅ Emergency map made bigger (deployed)
- ✅ SQL cleanup script created
- ⏳ Test reports still in database (your choice to delete)
