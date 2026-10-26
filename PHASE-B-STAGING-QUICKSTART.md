# PHASE B: STAGING TESTS - QUICK START GUIDE

**For:** QA Tester / Database Administrator  
**Time Required:** 4-5 hours  
**Date:** October 24, 2026  
**Status:** Ready to execute

---

## 🚀 BEFORE YOU START

### Prerequisites Checklist
- [ ] Access to Supabase staging project
- [ ] Access to staging database (SQL Editor)
- [ ] Access to staging application URL
- [ ] Test accounts created (admin, supervisor, responder, citizen)
- [ ] At least 2 test incidents in staging database
- [ ] DevTools knowledge (Chrome/Firefox)
- [ ] 4-5 hours allocated (uninterrupted)

### Required Tools
- Web browser (Chrome/Firefox recommended)
- Supabase Dashboard access
- SQL Editor (Supabase built-in)
- Text editor for documenting results
- Network tab in DevTools

---

## 📋 STEP-BY-STEP EXECUTION

### PART 1: Apply Migration (30 minutes)

#### Step 1: Backup Staging Database
```bash
# Via Supabase Dashboard:
# 1. Go to staging project
# 2. Database > Backups
# 3. Click "Create backup"
# 4. Name: "Before Phase B v2 - 2026-10-24"
# 5. Wait for backup to complete
```

#### Step 2: Open Migration File
```bash
# Local file: supabase/migrations/002_security_remediation_v2.sql
# Or get from: PHASE-B-CORRECTIONS-COMPLETE.md
```

#### Step 3: Apply Migration
```sql
-- 1. Open Supabase Dashboard > SQL Editor
-- 2. Create new query
-- 3. Copy ENTIRE contents of 002_security_remediation_v2.sql
-- 4. Paste into SQL Editor
-- 5. Click "Run" (bottom right)
-- 6. Wait for execution (should take 1-2 seconds)
-- 7. Check for errors (green checkmark = success)
```

#### Step 4: Verify Migration Success
```sql
-- Check audit_logs table created
SELECT COUNT(*) FROM audit_logs;
-- EXPECTED: 0 rows (table exists but empty)

-- Check function exists
SELECT proname, proargtypes 
FROM pg_proc 
WHERE proname = 'track_incident_by_reference';
-- EXPECTED: 1 row

-- Check trigger exists
SELECT tgname 
FROM pg_trigger 
WHERE tgname = 'audit_incident_changes';
-- EXPECTED: 1 row
```

**✅ Checkpoint:** Migration applied successfully, no errors

---

### PART 2: Critical Tests (1 hour)

These 7 tests MUST pass before continuing.

#### Test 1.1: Anonymous Cannot Query Incidents
```sql
-- SQL Editor, set role
SET ROLE anon;
SELECT * FROM incidents LIMIT 1;
-- EXPECTED: 0 rows
RESET ROLE;
```
**Result:** PASS ☐ | FAIL ☐  
**Notes:** _________________________

---

#### Test 1.2: Tracking Function Works
```sql
-- Replace with actual reference number from staging
SELECT * FROM track_incident_by_reference('BS-6720A73A-D4B3');

-- EXPECTED FIELDS:
-- reference_number, status, category, severity, title,
-- location_summary, created_at, updated_at

-- NOT EXPECTED:
-- description, address_text, id, reporter_name
```
**Result:** PASS ☐ | FAIL ☐  
**Notes:** _________________________

---

#### Test 1.5: 🆕 Authenticated Non-Staff Cannot Enumerate
```javascript
// Login as citizen (not staff) in staging app
// Open DevTools Console, run:
const { data, error } = await supabase.rpc('track_incident_by_reference', {
  ref_num: 'BS-TEST-1234'
})
console.log('Data:', data)
console.log('Error:', error)
// EXPECTED: Error (permission denied) OR same as anonymous
```
**Result:** PASS ☐ | FAIL ☐  
**Notes:** _________________________

---

#### Test 4.1: 🆕 Description Not Exposed
```sql
-- Get a reference number
SELECT reference_number FROM incidents LIMIT 1;

-- Track it
SELECT * FROM track_incident_by_reference('REF-NUMBER-HERE');

-- Check columns returned (use \x for expanded display)
\x
SELECT * FROM track_incident_by_reference('REF-NUMBER-HERE');
\x

-- VERIFY: "description" column DOES NOT appear in result
```
**Result:** PASS ☐ | FAIL ☐  
**Notes:** _________________________

---

#### Test 4.2: 🆕 Exact Address Not Exposed
```sql
SELECT * FROM track_incident_by_reference('REF-NUMBER-HERE');

-- Check location_summary field
-- EXPECTED: "Barangay Poblacion" (generic)
-- NOT: "123 Rizal Street, corner Bonifacio Ave"
```
**Result:** PASS ☐ | FAIL ☐  
**Notes:** _________________________

---

#### Test 2.1: Status Changes Logged
```sql
-- Pick a test incident
SELECT id, reference_number, status FROM incidents LIMIT 1;

-- Update status
UPDATE incidents 
SET status = 'verified' 
WHERE reference_number = 'REF-FROM-ABOVE';

-- Check audit log created
SELECT 
  actor_email,
  action,
  details->>'reference_number' as ref,
  details->'changes'->>'status' as status_change
FROM audit_logs
ORDER BY created_at DESC
LIMIT 1;

-- EXPECTED: New entry with action='incident_updated'
```
**Result:** PASS ☐ | FAIL ☐  
**Notes:** _________________________

---

#### Test 2.5: 🆕 Single Audit Entry (Not Duplicate)
```sql
-- Pick a test incident
SELECT id, reference_number FROM incidents LIMIT 1;

-- Update BOTH status AND assignment
UPDATE incidents 
SET 
  status = 'in_progress',
  assigned_to = (SELECT id FROM profiles WHERE role = 'responder' LIMIT 1)
WHERE reference_number = 'REF-FROM-ABOVE'
RETURNING id;

-- Count audit entries for this update
SELECT COUNT(*) as entry_count
FROM audit_logs
WHERE resource_id = 'ID-FROM-ABOVE'
AND created_at > NOW() - INTERVAL '10 seconds';

-- EXPECTED: entry_count = 1 (NOT 2)

-- Verify changes captured
SELECT details->'changes' 
FROM audit_logs 
WHERE resource_id = 'ID-FROM-ABOVE'
ORDER BY created_at DESC 
LIMIT 1;

-- EXPECTED: Both 'status' and 'assigned_to' in changes object
```
**Result:** PASS ☐ | FAIL ☐  
**Notes:** _________________________

---

**✅ Checkpoint:** All 7 critical tests passed

**⚠️ If any critical test failed:**
1. STOP immediately
2. Document the failure
3. Contact technical lead
4. DO NOT proceed to remaining tests

---

### PART 3: Remaining Tests (2-3 hours)

If all critical tests passed, proceed with remaining 18 tests from PHASE-B-SECURITY-TESTS.md:

#### Test Suite 1 (Remaining)
- [ ] Test 1.3: Staff can view all incidents
- [ ] Test 1.4: Citizens cannot access dashboard

#### Test Suite 2 (Remaining)
- [ ] Test 2.2: Assignment changes logged
- [ ] Test 2.3: Audit logs are append-only
- [ ] Test 2.4: Only supervisors/admins can view audit logs

#### Test Suite 3 (Storage)
- [ ] Test 3.1: Anonymous users cannot view media
- [ ] Test 3.2: Staff can view media

#### Test Suite 4 (Remaining Privacy)
- [ ] Test 4.3: Map popups don't expose PII
- [ ] Test 4.4: Track page doesn't expose PII

#### Test Suite 5 (Submission)
- [ ] Test 5.1: Public can still submit incidents
- [ ] Test 5.2: Submitted incidents are private by default

#### Test Suite 6 (Regression)
- [ ] Test 6.1: Staff dashboard still works
- [ ] Test 6.2: All existing features functional

#### Test Suite 7 (Edge Cases)
- [ ] Test 7.1: Reference number enumeration resistance
- [ ] Test 7.2: SQL injection resistance

**Document each test result in PHASE-B-SECURITY-TESTS.md**

---

### PART 4: Application Testing (30 minutes)

#### Deploy Application Code to Staging
```bash
# If not already deployed:
git push origin main  # Or staging branch
# Wait for Vercel deployment
# Check deployment logs
```

#### Test Tracking Page
1. Go to https://staging-url.vercel.app/track
2. Enter valid reference number
3. Submit search
4. **Verify display:**
   - ✅ Shows: Status, category, title, location summary
   - ❌ Does NOT show: Description, exact address
   - ✅ Shows privacy note: "Exact address withheld for privacy"
5. Open DevTools > Network tab
6. Inspect RPC call response
7. **Verify response:**
   - ❌ No "description" field
   - ❌ No "address_text" field
   - ✅ Has "location_summary" field

**Result:** PASS ☐ | FAIL ☐

#### Test Staff Dashboard
1. Login as staff user
2. Go to dashboard
3. Click on an incident
4. **Verify:**
   - ✅ Staff can see full description
   - ✅ Staff can see exact address
   - ✅ All functionality works

**Result:** PASS ☐ | FAIL ☐

---

### PART 5: Final Verification (30 minutes)

#### Check Console Errors
```javascript
// Open DevTools Console on each page:
// 1. Homepage
// 2. /report
// 3. /track
// 4. /dashboard (as staff)

// VERIFY: No console errors related to:
// - Missing fields
// - RPC errors
// - Auth errors
```

#### Smoke Test Workflows
- [ ] Submit new incident via /report → Success page with reference
- [ ] Track incident via /track → Shows status (no description)
- [ ] Login as staff → Dashboard loads
- [ ] View incident as staff → Full details visible
- [ ] Update incident status → Success, audit log created

#### Performance Check
- [ ] /track page loads in < 2 seconds
- [ ] Dashboard loads in < 3 seconds
- [ ] No significant slowdown vs. before migration

---

## 📊 TEST RESULTS SUMMARY

### Critical Tests (7)
- Passed: ____ / 7
- Failed: ____ / 7

### All Tests (25)
- Passed: ____ / 25
- Failed: ____ / 25

### Overall Status
- [ ] ✅ ALL TESTS PASSED - Ready for production
- [ ] ⚠️ MINOR ISSUES - Needs fixes, re-test
- [ ] ❌ MAJOR FAILURES - Contact technical lead immediately

---

## 📝 RESULTS DOCUMENTATION TEMPLATE

For each test, document:

```
Test ID: [e.g., Test 1.1]
Test Name: [e.g., Anonymous Cannot Query Incidents]
Date: [2026-10-24]
Tester: [Your Name]
Environment: Staging

Result: [PASS / FAIL]
Expected: [What should happen]
Actual: [What actually happened]
Evidence: [SQL output, screenshot, error message]
Notes: [Any observations]
```

---

## 🚨 FAILURE RESPONSE PROTOCOL

### If Any Test Fails:

1. **Document Everything:**
   - Test ID and name
   - What you did (exact steps)
   - What was expected
   - What actually happened
   - Error messages (exact text)
   - Screenshots (if applicable)

2. **Check Common Issues:**
   - Did migration complete successfully?
   - Are you using correct test data?
   - Are you in correct role (anon/authenticated/staff)?
   - Is staging environment properly configured?

3. **Report to Team:**
   - Send documentation to technical lead
   - Include test results summary
   - Do NOT proceed to production
   - Wait for fix guidance

4. **After Fix:**
   - Re-run FAILED test
   - Re-run ALL tests (to check for regressions)
   - Document re-test results

---

## ✅ COMPLETION CHECKLIST

- [ ] Migration applied successfully
- [ ] All 7 critical tests passed
- [ ] All 25 total tests passed
- [ ] Application code deployed to staging
- [ ] Tracking page tested (no description shown)
- [ ] Staff dashboard tested (full details visible)
- [ ] No console errors
- [ ] Performance acceptable
- [ ] All results documented
- [ ] Test summary prepared for team review

**Estimated Time:** ____ hours (actual)  
**Tests Passed:** ____ / 25  
**Ready for Production:** YES ☐ | NO ☐

---

## 📞 CONTACTS

### For Questions:
- **Migration issues:** Contact Database Administrator
- **Test failures:** Contact Technical Lead  
- **Test procedures unclear:** Review PHASE-B-SECURITY-TESTS.md
- **Application issues:** Contact Developer

### For Emergencies:
- **Staging broken:** Contact Database Administrator (rollback)
- **Cannot complete tests:** Contact Project Manager (reschedule)

---

## 📚 REFERENCE DOCUMENTS

1. **PHASE-B-SECURITY-TESTS.md** - Detailed test procedures
2. **PHASE-B-CORRECTIONS-COMPLETE.md** - What was fixed
3. **002_security_remediation_v2.sql** - Migration SQL
4. **PHASE-B-EXECUTIVE-BRIEFING.md** - Executive overview

---

**Good luck! Remember:**
- Take your time
- Document everything
- If in doubt, ask
- DO NOT proceed to production if ANY test fails

---

*End of Quick Start Guide*
