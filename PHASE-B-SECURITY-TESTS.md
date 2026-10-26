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

### Test 1.5: Authenticated Non-Staff Cannot Query Function 🆕
**Purpose:** Verify authenticated citizens have same restrictions as anonymous

**SQL Test:**
```sql
-- This test must be run with authenticated citizen JWT token
-- Login as citizen user in application, then test via DevTools:
const { data, error } = await supabase.rpc('track_incident_by_reference', { 
  ref_num: 'BS-6720A73A-D4B3' 
})
console.log('Data:', data)
console.log('Error:', error)
-- EXPECTED: Either permission denied OR same behavior as anonymous
```

**Alternative Test (Via Application):**
1. Create citizen account (role='citizen')
2. Login as citizen
3. Open DevTools Console
4. Try to call tracking function directly
5. EXPECTED: Function either:
   - Returns error (permission denied), OR
   - Works same as anonymous (safe fields only)

**Pass Criteria:** 
- Authenticated citizens cannot enumerate incidents
- Function grants are properly restricted
- No privileged access for non-staff authenticated users

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

### Test 2.5: Single Audit Entry for Multi-Field Update 🆕
**Purpose:** Verify no duplicate audit logs when both status and assignment change

**SQL Test:**
```sql
-- Create test incident or use existing one
-- Note the incident ID for verification

-- Update both status AND assignment in single UPDATE
UPDATE incidents 
SET 
  status = 'verified', 
  assigned_to = 'staff-user-uuid-here'
WHERE reference_number = 'TEST-REF-NUMBER'
RETURNING id;

-- Wait 1 second for trigger to complete

-- Check audit_logs - should be ONLY 1 entry
SELECT 
  COUNT(*) as entry_count,
  action,
  details
FROM audit_logs
WHERE resource_id = 'incident-id-from-above'
AND created_at > NOW() - INTERVAL '10 seconds'
GROUP BY action, details;

-- EXPECTED: 
-- entry_count = 1 (NOT 2)
-- action = 'incident_updated'
-- details should contain BOTH status and assigned_to changes
```

**Verification Details JSON:**
```json
{
  "reference_number": "TEST-REF",
  "changes": {
    "status": {
      "old": "submitted",
      "new": "verified"
    },
    "assigned_to": {
      "old": null,
      "new": "staff-uuid"
    }
  },
  "actor_role": "supervisor"
}
```

**Pass Criteria:** 
- Only 1 audit entry created (not 2)
- Single entry contains ALL changes
- Changes JSON shows both fields
- No duplicate or misleading log entries

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

### Test 4.1: Description Not Exposed in Tracking 🆕
**Purpose:** Verify tracking function does NOT return description field (may contain PII)

**SQL Test:**
```sql
-- Insert test incident with PII in description
INSERT INTO incidents (
  category, severity, title, description, address_text, barangay,
  reporter_name, reporter_contact
) VALUES (
  'crime', 'medium',
  'Test Incident',
  'Please call me at 0917-123-4567, my name is Maria Cruz', -- PII
  '123 Rizal Street',
  'Poblacion',
  'Test Reporter',
  '0917-000-0000'
) RETURNING reference_number;

-- Note the reference number

-- Query via tracking function
SELECT * FROM track_incident_by_reference('REF-NUMBER-HERE');

-- EXPECTED FIELDS RETURNED:
-- ✅ reference_number
-- ✅ status
-- ✅ category
-- ✅ severity
-- ✅ title
-- ✅ location_summary (barangay only)
-- ✅ created_at
-- ✅ updated_at

-- EXPECTED FIELDS NOT RETURNED:
-- ❌ description (contains PII)
-- ❌ address_text (exact address)
-- ❌ reporter_name
-- ❌ reporter_contact
-- ❌ id
```

**Application Test:**
1. Go to /track page (not logged in)
2. Enter test incident reference number
3. Open DevTools > Network tab
4. Inspect RPC response
5. Verify "description" field is NOT in response

**Pass Criteria:** 
- Description field completely absent from response
- No way to retrieve description via public function
- Staff can still see description in dashboard

---

### Test 4.2: Exact Address Not Exposed 🆕
**Purpose:** Verify tracking function returns only barangay, not exact address

**SQL Test:**
```sql
-- Use incident with specific address
SELECT * FROM track_incident_by_reference('VALID-REF-NUMBER');

-- Check location_summary field
-- EXPECTED FORMAT: "Barangay Poblacion" or "Barangay Balingasag"
-- NOT EXPECTED: "123 Rizal Street, corner Bonifacio Ave, Poblacion"
```

**Application Test:**
1. Submit incident with detailed address:
   - Address: "123 Rizal Street, corner Bonifacio Avenue, near SM Mall"
   - Barangay: "Poblacion"
2. Note reference number
3. Track incident on /track page
4. Verify location shows: "Barangay Poblacion" (generic)
5. Verify location does NOT show: exact street address

**Pass Criteria:**
- Only barangay-level location shown
- Exact street address not exposed
- Cannot identify reporter's precise location

---

### Test 4.3: Map Popups Don't Expose PII
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

### Test 4.4: Track Page Doesn't Expose PII
**Purpose:** Verify public tracking page is safe

**Test Steps:**
1. Go to /track (without login)
2. Enter valid reference number
3. Inspect returned data (DevTools Network tab)
4. Verify DOES NOT contain:
   - description (may have PII)
   - reporter_name
   - reporter_contact
   - location_lat/lng
   - assigned_to
   - internal incident ID
   - exact address_text

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

**Total Tests: 25** (21 original + 4 new)
- Test 1.5: Authenticated non-staff cannot query function 🆕
- Test 2.5: Single audit entry for multi-field update 🆕
- Test 4.1: Description not exposed in tracking 🆕
- Test 4.2: Exact address not exposed 🆕

### Pre-Migration (Staging)
- [ ] Backup staging database
- [ ] Run all Test Suite 1 queries (should fail appropriately)
- [ ] Verify current functionality works

### Post-Migration (Staging)
- [ ] Apply migration SQL (002_security_remediation_v2.sql)
- [ ] Verify migration success (no errors)
- [ ] Run TEST SUITE 1: RLS Policies (5 tests including new 1.5)
- [ ] Run TEST SUITE 2: Audit Logging (5 tests including new 2.5)
- [ ] Run TEST SUITE 3: Storage Security (2 tests)
- [ ] Run TEST SUITE 4: Privacy (4 tests including new 4.1 and 4.2)
- [ ] Run TEST SUITE 5: Submission (2 tests)
- [ ] Run TEST SUITE 6: Regression (2 tests)
- [ ] Run TEST SUITE 7: Edge Cases (2 tests)

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
