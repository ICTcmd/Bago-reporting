# BAGO SAFE - PHASE B SECURITY TESTS

## Test Environment Setup

**CRITICAL:** Do NOT run these tests against production database.

### Test Environments
1. **Local Development** - Use local Supabase instance or test project
2. **Staging** - Dedicated staging project on Supabase
3. **Production** - Only after successful staging tests

---

## TEST SUITE 1: RLS POLICY VERIFICATION

### Test 1.1: Anonymous Users Cannot Query Incidents Directly
**Purpose:** Verify that unauthenticated users cannot bypass the tracking function

**SQL Test (via Supabase SQL Editor):**
```sql
-- Set role to anonymous (simulates unauthenticated request)
SET ROLE anon;

-- Attempt to query incidents table directly
SELECT * FROM incidents LIMIT 10;
-- EXPECTED: 0 rows returned

-- Attempt to query by reference number
SELECT * FROM incidents WHERE reference_number = 'BS-6720A73A-D4B3';
-- EXPECTED: 0 rows returned

-- Reset role
RESET ROLE;
```

**Application Test:**
1. Open browser in incognito/private mode
2. Open DevTools Console
3. Execute:
```javascript
const { createClient } = supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Try to query incidents
const { data, error } = await supabase
  .from('incidents')
  .select('*')
  .limit(1)

console.log('Data:', data)  // EXPECTED: null or []
console.log('Error:', error) // EXPECTED: null or empty
console.log('Count:', data?.length) // EXPECTED: 0
```

**Pass Criteria:** Anonymous users get 0 rows, no data leaked

---

### Test 1.2: Public Tracking Function Works Correctly
**Purpose:** Verify tracking function returns only approved fields

**SQL Test:**
```sql
-- Test with valid reference number (replace with actual test data)
SELECT * FROM track_incident_by_reference('BS-6720A73A-D4B3');
-- EXPECTED: Returns 1 row with ONLY these fields:
-- reference_number, status, category, severity, title, description,
-- address_text, barangay, created_at, updated_at

-- Test with invalid reference
SELECT * FROM track_incident_by_reference('INVALID');
-- EXPECTED: 0 rows

-- Test with malicious input
SELECT * FROM track_incident_by_reference('BS-123''; DROP TABLE incidents; --');
-- EXPECTED: Error or 0 rows, NO SQL injection

-- Test with null
SELECT * FROM track_incident_by_reference(NULL);
-- EXPECTED: Error (Invalid reference number format)

-- Test with empty string
SELECT * FROM track_incident_by_reference('');
-- EXPECTED: Error (Invalid reference number format)
```

**Application Test (Track Page):**
1. Go to https://your-domain.com/track
2. Enter valid reference number
3. Check Network tab > Response
4. Verify ONLY these fields returned:
   - ✅ reference_number
   - ✅ status
   - ✅ category
   - ✅ severity
   - ✅ title
   - ✅ description
   - ✅ address_text
   - ✅ barangay
   - ✅ created_at
   - ✅ updated_at
5. Verify NOT returned:
   - ❌ reporter_name
   - ❌ reporter_contact
   - ❌ reporter_id
   - ❌ assigned_to
   - ❌ location_lat
   - ❌ location_lng
   - ❌ id (incident UUID)

**Pass Criteria:** Only approved fields returned, no PII exposed

---

### Test 1.3: Staff Can View All Incidents
**Purpose:** Verify authenticated staff still have access

**Application Test:**
1. Login as staff user (responder, supervisor, or admin)
2. Go to /dashboard
3. Verify incident list loads
4. Check Network tab > incidents query
5. Verify all incidents visible

**SQL Test (via authenticated staff session):**
```sql
-- This must be run through the application or with staff JWT
SELECT COUNT(*) FROM incidents;
-- EXPECTED: Returns actual count

SELECT * FROM incidents LIMIT 5;
-- EXPECTED: Returns incidents with all fields
```

**Pass Criteria:** Staff can query incidents table directly

---

### Test 1.4: Citizens Cannot Access Staff Dashboard
**Purpose:** Verify role-based access control

**Test Steps:**
1. Create test citizen account (role='citizen')
2. Login with citizen credentials
3. Attempt to access /dashboard
4. EXPECTED: Redirected to /login
5. Check browser console for errors
6. EXPECTED: No sensitive data in console

**Pass Criteria:** Non-staff users cannot access dashboard

---

## TEST SUITE 2: AUDIT LOGGING VERIFICATION

### Test 2.1: Status Changes Are Logged
**Purpose:** Verify audit trigger fires on status change

**Test Steps:**
1. Login as staff user
2. Navigate to an incident
3. Change status (e.g., submitted → under_review)
4. Save changes

**Verification SQL:**
```sql
-- Check audit_logs table
SELECT 
  actor_email,
  action,
  details->>'reference_number' as ref,
  details->>'old_status' as old,
  details->>'new_status' as new,
  created_at
FROM audit_logs
WHERE action = 'incident_status_change'
ORDER BY created_at DESC
LIMIT 5;
```

**Pass Criteria:** 
- New entry in audit_logs
- Correct actor_id and actor_email
- Action = 'incident_status_change'
- Details JSON contains old_status and new_status

---

### Test 2.2: Assignment Changes Are Logged
**Purpose:** Verify assignment tracking works

**Test Steps:**
1. Login as supervisor
2. Assign incident to a staff member
3. Check audit logs

**Verification SQL:**
```sql
SELECT 
  actor_email,
  action,
  details->>'reference_number' as ref,
  details->>'old_assigned_to' as old_assignee,
  details->>'new_assigned_to' as new_assignee,
  created_at
FROM audit_logs
WHERE action = 'incident_assignment_change'
ORDER BY created_at DESC
LIMIT 5;
```

**Pass Criteria:** Assignment change recorded with both old and new values

---

### Test 2.3: Audit Logs Are Append-Only
**Purpose:** Verify audit logs cannot be modified

**Test Steps:**
1. Login as admin
2. Attempt to update audit_logs record (via SQL or API)
3. Attempt to delete audit_logs record

**SQL Test:**
```sql
-- Try to update
UPDATE audit_logs 
SET action = 'tampered' 
WHERE id = (SELECT id FROM audit_logs LIMIT 1);
-- EXPECTED: Permission denied

-- Try to delete
DELETE FROM audit_logs LIMIT 1;
-- EXPECTED: Permission denied
```

**Pass Criteria:** UPDATE and DELETE operations fail with permission error

---

### Test 2.4: Only Supervisors/Admins Can View Audit Logs
**Purpose:** Verify audit log access control

**Test as Responder:**
```sql
-- Set role to responder (or login as responder in app)
SELECT * FROM audit_logs LIMIT 1;
-- EXPECTED: 0 rows (permission denied)
```

**Test as Supervisor:**
```sql
-- Login as supervisor
SELECT COUNT(*) FROM audit_logs;
-- EXPECTED: Returns count (access granted)
```

**Pass Criteria:** Responders cannot view logs, supervisors/admins can

---

## TEST SUITE 3: STORAGE SECURITY

### Test 3.1: Anonymous Users Cannot View Incident Media
**Purpose:** Verify storage bucket remains private

**Test Steps:**
1. Get URL of uploaded incident photo from database
2. Open URL in incognito browser (no auth)
3. EXPECTED: 403 Forbidden or auth required error

**Pass Criteria:** Media not accessible without authentication

---

### Test 3.2: Staff Can View Incident Media
**Purpose:** Verify authorized access works

**Test Steps:**
1. Login as staff
2. Navigate to incident with photos
3. Click to view photo
4. EXPECTED: Photo loads successfully

**Pass Criteria:** Staff can access media via signed URLs

---

## TEST SUITE 4: PRIVACY VERIFICATION

### Test 4.1: Map Popups Don't Expose PII
**Purpose:** Verify map markers don't leak private info

**Test Steps:**
1. Login as staff
2. Go to /dashboard (Map view)
3. Click on incident marker
4. Inspect popup content
5. Verify DOES NOT show:
   - Reporter name
   - Reporter phone/email
   - Exact GPS coordinates (only address shown)

**Pass Criteria:** No PII in map popups

---

### Test 4.2: Track Page Doesn't Expose PII
**Purpose:** Verify public tracking page is safe

**Test Steps:**
1. Go to /track (without login)
2. Enter valid reference number
3. Inspect returned data (DevTools Network tab)
4. Verify DOES NOT contain:
   - reporter_name
   - reporter_contact
   - location_lat/lng
   - assigned_to
   - internal incident ID

**Pass Criteria:** Only public-safe fields visible

---

## TEST SUITE 5: INCIDENT SUBMISSION

### Test 5.1: Public Can Still Submit Incidents
**Purpose:** Verify report form still works after security fixes

**Test Steps:**
1. Go to /report (not logged in)
2. Fill out all required fields
3. Upload a photo (optional)
4. Submit form
5. EXPECTED: Success page with reference number
6. Verify incident created in database

**Pass Criteria:** Incident submission works without authentication

---

### Test 5.2: Submitted Incidents Are Private by Default
**Purpose:** Verify new incidents not publicly queryable

**Test Steps:**
1. Submit new incident via public form
2. Note reference number
3. Try to query it directly via anon role:
```sql
SET ROLE anon;
SELECT * FROM incidents WHERE reference_number = '<new_ref>';
-- EXPECTED: 0 rows
RESET ROLE;
```
4. Try tracking function:
```sql
SELECT * FROM track_incident_by_reference('<new_ref>');
-- EXPECTED: 1 row with limited fields
```

**Pass Criteria:** 
- Direct query returns nothing
- Tracking function returns safe data

---

## TEST SUITE 6: REGRESSION TESTS

### Test 6.1: Staff Dashboard Still Works
**Checklist:**
- [ ] Can login
- [ ] Dashboard loads
- [ ] Map displays incidents
- [ ] Feed view shows incidents
- [ ] Can click incident to view details
- [ ] Profile tab works
- [ ] Sign out works

---

### Test 6.2: All Existing Features Functional
**Checklist:**
- [ ] Homepage loads
- [ ] Navigation works
- [ ] Report form submits
- [ ] Track page finds incidents
- [ ] Map markers clickable
- [ ] No console errors
- [ ] Mobile responsive

---

## TEST SUITE 7: SECURITY EDGE CASES

### Test 7.1: Reference Number Enumeration
**Purpose:** Check if attackers can enumerate reference numbers

**Test:**
```javascript
// Try sequential reference numbers
for (let i = 0; i < 100; i++) {
  const result = await track_incident_by_reference(`BS-${i}`)
  if (result) console.log('Found:', result)
}
```

**Assessment:**
- Are reference numbers predictable?
- Can attacker discover all incidents?
- Consider rate limiting if issue found

---

### Test 7.2: SQL Injection Resistance
**Purpose:** Verify function resists injection

**Test:**
```sql
-- Try various injection patterns
SELECT * FROM track_incident_by_reference('''');
SELECT * FROM track_incident_by_reference('BS-123''; DROP TABLE incidents; --');
SELECT * FROM track_incident_by_reference('BS-123'' OR ''1''=''1');
SELECT * FROM track_incident_by_reference('BS-123'') UNION SELECT * FROM profiles --');
```

**Pass Criteria:** All attempts fail safely, no execution

---

## TEST EXECUTION CHECKLIST

### Pre-Migration (Staging)
- [ ] Backup staging database
- [ ] Run all Test Suite 1 queries (should fail appropriately)
- [ ] Verify current functionality works

### Post-Migration (Staging)
- [ ] Apply migration SQL
- [ ] Verify migration success (no errors)
- [ ] Run TEST SUITE 1: RLS Policies (all tests)
- [ ] Run TEST SUITE 2: Audit Logging (all tests)
- [ ] Run TEST SUITE 3: Storage Security (all tests)
- [ ] Run TEST SUITE 4: Privacy (all tests)
- [ ] Run TEST SUITE 5: Submission (all tests)
- [ ] Run TEST SUITE 6: Regression (all tests)
- [ ] Run TEST SUITE 7: Edge Cases (all tests)

### Pre-Production
- [ ] All staging tests passed
- [ ] Review test results with team
- [ ] Backup production database
- [ ] Schedule maintenance window
- [ ] Prepare rollback plan

### Post-Production
- [ ] Apply migration
- [ ] Run smoke tests (key workflows)
- [ ] Monitor error logs for 24 hours
- [ ] Test random sample of incidents
- [ ] Verify audit logs populating

---

## FAILED TEST REMEDIATION

If any test fails:
1. **DO NOT** proceed to production
2. Document failure details
3. Fix root cause
4. Re-run full test suite
5. Only proceed when ALL tests pass

---

## TEST RESULTS TEMPLATE

```
Test Suite: [Suite Name]
Test: [Test ID]
Date: [Date]
Tester: [Name]
Environment: [Local/Staging/Production]

Result: [PASS/FAIL]
Notes: [Any observations]
Evidence: [Screenshots, logs, SQL output]
```

---

**END OF TEST SUITE**
