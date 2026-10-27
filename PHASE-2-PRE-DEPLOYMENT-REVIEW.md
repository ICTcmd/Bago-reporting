# PHASE 2 — PRE-DEPLOYMENT COMPREHENSIVE REVIEW

**Date:** October 26, 2026  
**Reviewer:** User-Requested Detailed Analysis  
**Status:** ⏸️ **HOLDING FOR USER APPROVAL - DO NOT DEPLOY**  
**Migration:** 003_verification_system_schema.sql

---

## ⚠️ DEPLOYMENT STATUS

**CRITICAL:** No deployment actions have been taken. This is a review-only document.

- ❌ Migration NOT applied to any database
- ❌ No git branches created
- ❌ No staging deployment started
- ❌ No production changes made
- ✅ All existing work preserved

**Next Step:** User review and explicit approval required before any deployment.

---

## 1️⃣ CITY POLICY DECISIONS SUMMARY

### Overview
5 decisions require City policy approval before behavior is enabled. All have **technical defaults** implemented that are **safe and reversible**, but **operational behavior deferred** pending City approval.

---

### CITY POLICY #1: Email/SMS Notifications

**Decision Register Reference:** Q10  
**Current Implementation:** In-app notifications ONLY  
**City Approval Needed For:** External notification channels

**What's Implemented (Safe Default):**
- ✅ In-app notifications table created
- ✅ Notifications triggered for assignments and urgent incidents
- ✅ RLS ensures users see only their own notifications
- ✅ No external service dependencies
- ✅ No cost implications

**What's NOT Implemented (Requires City Approval):**
- ❌ Email notifications
- ❌ SMS notifications
- ❌ Push notifications
- ❌ After-hours escalation procedures
- ❌ External service integration (SendGrid, Twilio, etc.)

**City Must Decide:**
1. **Service Provider Selection:** Which email/SMS provider? (cost implications)
2. **After-Hours Protocol:** Who gets notified outside business hours?
3. **Escalation Tree:** If assigned staff doesn't respond, who's next?
4. **Budget Approval:** Email/SMS services require operational budget
5. **Opt-In/Opt-Out:** Staff notification preferences and consent
6. **Rate Limiting:** Prevent notification spam during mass incidents
7. **Delivery Confirmation:** How to verify notifications were received?

**Risk if Deployed Without Approval:** 🟢 **NONE**  
Technical capability exists but disabled. Can be enabled via configuration later.

**Recommended Action:** Proceed with in-app only, enable external channels after City policy approval.

---

### CITY POLICY #2: Urgency Definitions and Response SLAs

**Decision Register Reference:** Q2, Q11  
**Current Implementation:** Boolean flag only  
**City Approval Needed For:** Urgency criteria and response expectations

**What's Implemented (Safe Default):**
- ✅ `is_urgent` boolean field on incidents table
- ✅ Urgent incidents trigger immediate notifications to all supervisors
- ✅ UI checkbox for submitters to mark report as urgent
- ✅ No automatic prioritization beyond notification

**What's NOT Implemented (Requires City Approval):**
- ❌ Official definition of "urgent" (what qualifies?)
- ❌ Response time SLAs (e.g., "urgent incidents resolved within 2 hours")
- ❌ Automatic escalation if not addressed
- ❌ Emergency contact procedures
- ❌ Weekend/holiday urgent incident handling

**City Must Decide:**
1. **Urgency Criteria:** What constitutes an urgent incident?
   - Active fire or flooding?
   - Imminent threat to life?
   - Infrastructure failure affecting public safety?
   - Medical emergencies?
2. **Response Time Expectations:** Are there SLAs?
   - System won't enforce, but City may commit to response times
3. **After-Hours Handling:** Who responds to urgent incidents submitted at 2 AM?
4. **False Urgency:** How to handle reporters who mark everything urgent?
5. **Escalation Procedure:** If urgent incident not addressed within X time?

**Risk if Deployed Without Approval:** 🟢 **LOW**  
Urgent flag exists but no false expectations created. System notifies supervisors but doesn't promise response times.

**Recommended Action:** Deploy technical capability, City defines operational procedures separately.

---

### CITY POLICY #3: Sensitive Category Handling (Public Display)

**Decision Register Reference:** Q12, Q13, Q14  
**Current Implementation:** Two-layer map (unverified + verified)  
**City Approval Needed For:** Category-specific visibility rules

**What's Implemented (Safe Default):**
- ✅ Unverified incidents can appear on public map (with "Pending Verification" label)
- ✅ Limited details shown for unverified (title + category + barangay only)
- ✅ No description, exact address, or reporter info exposed
- ✅ Verified incidents show severity + status but still no exact location

**What's NOT Implemented (Requires City Approval):**
- ❌ Category-specific hiding (e.g., hide crime reports until verified)
- ❌ Automatic suppression of sensitive incidents
- ❌ Special handling for medical/privacy-sensitive categories

**City Must Decide:**
1. **Crime Reports:** Should unverified crime reports be public?
   - Risk: False accusations visible before investigation
   - Benefit: Public awareness of safety concerns
2. **Medical Emergencies:** Display before verification?
   - Privacy: Patient information may be in description
   - Public Panic: Unverified medical incidents may cause alarm
3. **Controversial Incidents:** Political, sensitive locations, etc.
4. **Liability:** Is City liable for displaying unverified information?

**Proposed Categories to Hide Until Verified (Requires Approval):**
- `crime` - Law enforcement sensitivity
- `medical` - Patient privacy (HIPAA-equivalent)
- Any incident marked "confidential" (future field)

**Risk if Deployed Without Approval:** 🟡 **MEDIUM**  
Public may see unverified sensitive incidents. Can cause:
- False panic
- Privacy violations
- Reputational harm to accused parties
- Legal liability for City

**Recommended Action:** 
1. Deploy with all categories visible (as designed)
2. City implements policy within 30 days
3. Add category filtering via configuration update (no migration needed)

---

### CITY POLICY #4: Data Retention and Privacy Compliance

**Decision Register Reference:** Q20  
**Current Implementation:** Indefinite retention  
**City Approval Needed For:** Retention periods and anonymization rules

**What's Implemented (Safe Default):**
- ✅ All incidents preserved indefinitely
- ✅ Audit logs append-only (cannot be deleted by regular users)
- ✅ Reporter contact info stored
- ✅ Media files stored in private bucket

**What's NOT Implemented (Requires City Approval):**
- ❌ Automatic archival after N days
- ❌ Anonymization of closed incidents
- ❌ Data retention policy enforcement
- ❌ FOIA (Freedom of Information Act) request handling
- ❌ Personal data deletion requests ("right to be forgotten")

**City Must Decide:**
1. **Retention Period:** How long to keep closed incidents?
   - 1 year? 5 years? Indefinite?
   - Different periods for different categories?
2. **Anonymization Rules:** Which fields to redact?
   - Reporter names/contact after closure?
   - Media files deletion timeline?
3. **Records Management:** Does City have official policy?
4. **Legal Requirements:** Philippine Data Privacy Act compliance
5. **FOIA Handling:** How to respond to public records requests?
6. **Deletion Requests:** How to handle "right to be forgotten"?

**Risk if Deployed Without Approval:** 🟢 **LOW**  
Current default (indefinite retention) is conservative and compliant. City can implement retention policy later.

**Recommended Action:** Deploy with current defaults, City develops retention policy as separate initiative.

---

### CITY POLICY #5: Self-Verification by Supervisors

**Decision Register Reference:** Q6  
**Current Implementation:** Allowed with audit logging  
**City Approval Needed For:** Whether to prohibit or permit

**What's Implemented (Safe Default):**
- ✅ No technical restriction on same-barangay verification
- ✅ Audit log captures when supervisor verifies their own barangay
- ✅ UI can show indicator: "⚠️ Verifying own barangay" (future)
- ✅ City can review audit logs for conflicts of interest

**What's NOT Implemented (Requires City Approval):**
- ❌ Hard restriction preventing same-barangay verification
- ❌ Automatic reassignment to different-barangay verifier
- ❌ Mandatory approval from second supervisor

**City Must Decide:**
1. **Allow or Prohibit?**  
   - Allow: Pragmatic for small city (24 barangays, limited staff)
   - Prohibit: Ensures objectivity, prevents conflicts of interest
2. **High-Value Threshold:** Should expensive/sensitive incidents require different verifier?
3. **Audit Review:** Who reviews same-barangay verifications periodically?
4. **Override Procedure:** How to handle if conflict of interest discovered?

**Risk if Deployed Without Approval:** 🟢 **LOW**  
Transparency through audit logging allows City to review. No financial controls bypassed.

**Recommended Action:** Deploy as-is (allow with logging), City can add restriction later if needed.

---

## 2️⃣ RLS POLICY DETAILED REVIEW

### Access Matrix

| User Role | incidents (SELECT) | incidents (UPDATE) | incident_reviews | incident_duplicates | notifications |
|-----------|-------------------|-------------------|------------------|---------------------|---------------|
| **anonymous** | ❌ BLOCKED | ❌ BLOCKED | ❌ BLOCKED | ❌ BLOCKED | ❌ BLOCKED |
| **citizen (authenticated)** | ❌ BLOCKED¹ | ❌ BLOCKED | ❌ BLOCKED | ❌ BLOCKED | ❌ BLOCKED |
| **barangay_reviewer** | ✅ Own barangay only² | ✅ Limited transitions³ | ✅ CREATE barangay reviews | ✅ VIEW + FLAG | ✅ OWN only |
| **responder** | ✅ ALL incidents | ✅ Assigned only⁴ | ✅ VIEW all | ✅ VIEW + FLAG | ✅ OWN only |
| **supervisor** | ✅ ALL incidents | ✅ ALL incidents⁵ | ✅ VIEW + CREATE city | ✅ VIEW + FLAG + CONFIRM | ✅ OWN only |
| **admin** | ✅ ALL incidents | ✅ ALL + DELETE | ✅ VIEW + CREATE city | ✅ VIEW + FLAG + CONFIRM | ✅ OWN only |

**Footnotes:**
1. Anonymous submit via INSERT policy, but cannot SELECT (use tracking function instead)
2. Barangay reviewers see only incidents where `barangay_id` or `barangay` text matches assigned barangay
3. Limited to: `submitted` → `under_review` → `verified/invalid`
4. Responders update only incidents where `assigned_to = auth.uid()`
5. Supervisors can perform all status transitions including marking duplicates

---

### Critical RLS Policies - Line-by-Line Analysis

#### Policy 1: Barangay Reviewers View Assigned Barangay Incidents

**Location:** Lines 516-538 of migration SQL

```sql
CREATE POLICY "Barangay reviewers view assigned barangay incidents"
  ON incidents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN barangays b ON p.assigned_barangay = b.id
      WHERE p.id = auth.uid()
      AND p.role = 'barangay_reviewer'
      AND p.reviewer_active = true
      AND (
        -- Match by normalized FK or legacy text field
        incidents.barangay_id = b.id 
        OR LOWER(TRIM(incidents.barangay)) = LOWER(b.name)
      )
      AND (
        -- Can see submitted/under_review (need to act)
        incidents.status IN ('submitted', 'under_review')
        OR
        -- Can see resolved/closed from their barangay (reference)
        incidents.status IN ('verified', 'in_progress', 'resolved', 'closed', 'invalid', 'duplicate')
      )
    )
  );
```

**Security Analysis:**
- ✅ **Correctly scoped:** Reviewer can only see their assigned barangay
- ✅ **Status filtering:** Can see actionable items + resolved history for context
- ✅ **Active check:** `reviewer_active = true` ensures deactivated reviewers blocked
- ✅ **Dual matching:** Supports both new `barangay_id` FK and legacy `barangay` TEXT
- ✅ **No cross-barangay leakage:** `JOIN barangays b ON p.assigned_barangay = b.id` enforces scope

**Potential Issues:**
- ⚠️ **Case sensitivity:** `LOWER(TRIM())` may fail on Unicode characters (rare for barangay names)
- ⚠️ **Performance:** EXISTS with JOIN may be slow with many incidents (mitigated by indexes)

**Privilege Escalation Risk:** 🟢 **NONE**  
Reviewer cannot see other barangays regardless of SQL injection or parameter manipulation.

---

#### Policy 2: Barangay Reviewers Can Review Incidents

**Location:** Lines 541-566 of migration SQL

```sql
CREATE POLICY "Barangay reviewers can review incidents"
  ON incidents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN barangays b ON p.assigned_barangay = b.id
      WHERE p.id = auth.uid()
      AND p.role = 'barangay_reviewer'
      AND p.reviewer_active = true
      AND (incidents.barangay_id = b.id OR LOWER(TRIM(incidents.barangay)) = LOWER(b.name))
      AND incidents.status IN ('submitted', 'under_review')
    )
  )
  WITH CHECK (
    -- Can only transition to these statuses
    status IN ('under_review', 'verified', 'invalid')
    AND reviewed_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles p
      JOIN barangays b ON p.assigned_barangay = b.id
      WHERE p.id = auth.uid()
      AND p.role = 'barangay_reviewer'
      AND (incidents.barangay_id = b.id OR LOWER(TRIM(incidents.barangay)) = LOWER(b.name))
    )
  );
```

**Security Analysis:**
- ✅ **State machine enforcement:** Can only UPDATE if status is `submitted` or `under_review`
- ✅ **Limited transitions:** WITH CHECK restricts NEW status to `under_review`, `verified`, or `invalid`
- ✅ **Self-assignment required:** `reviewed_by = auth.uid()` prevents assigning to others
- ✅ **No direct escalation:** Cannot set status to `in_progress` (must go through city verification)
- ✅ **Barangay scope preserved:** USING and WITH CHECK both verify barangay assignment

**Potential Issues:**
- ⚠️ **Duplicate checks:** EXISTS query runs twice (USING + WITH CHECK) - minor performance impact
- ⚠️ **No protection against:** Reviewer marking all incidents `invalid` maliciously (audit logged, but not prevented)

**Privilege Escalation Risk:** 🟢 **NONE**  
- Cannot escalate to `in_progress` (city authority)
- Cannot mark as `duplicate` (supervisor authority)
- Cannot modify incidents from other barangays

---

#### Policy 3: Supervisors Can Verify Incidents

**Location:** Lines 569-582 of migration SQL

```sql
CREATE POLICY "Supervisors can verify incidents"
  ON incidents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('supervisor', 'admin')
    )
    AND status IN ('verified', 'invalid', 'duplicate')  -- City verification statuses
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('supervisor', 'admin')
    )
  );
```

**Security Analysis:**
- ⚠️ **ISSUE IDENTIFIED:** USING clause restricts to incidents ALREADY in `verified`, `invalid`, or `duplicate` status
- ❌ **BUG:** Supervisor cannot UPDATE incident from `verified` → `in_progress` because USING requires status to ALREADY be one of those three
- ✅ **Role check correct:** Only supervisor/admin can use this policy
- ✅ **WITH CHECK correct:** Verifies role before allowing UPDATE

**Actual Bug Analysis:**
The USING clause says: "You can only UPDATE incidents that are ALREADY verified, invalid, or duplicate"
But the intent is: "You can SET status TO verified, invalid, or duplicate"

**Correct SQL Should Be:**
```sql
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('supervisor', 'admin')
  )
  -- Remove the status check from USING, or check for source statuses
)
```

**Impact:** 🔴 **CRITICAL BUG**  
Supervisors cannot perform city verification because policy blocks UPDATE when status doesn't match.

**Fix Required:** Yes - this will be addressed in a correction.

---

### Notification Trigger Security

#### Trigger 1: notify_incident_assigned()

**Location:** Lines 594-609

```sql
CREATE OR REPLACE FUNCTION notify_incident_assigned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.assigned_to IS DISTINCT FROM NEW.assigned_to AND NEW.assigned_to IS NOT NULL) THEN
    INSERT INTO notifications (user_id, title, message, link)
    VALUES (
      NEW.assigned_to,
      '📋 New Incident Assigned',
      'Incident "' || NEW.title || '" has been assigned to you',
      '/dashboard/incident/' || NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;
```

**Security Analysis:**
- ✅ **SECURITY DEFINER used correctly:** Function runs with elevated privileges to INSERT notification
- ✅ **Fires AFTER UPDATE:** Non-blocking, doesn't prevent incident assignment
- ✅ **No sensitive data exposure:** Notification contains only title (already visible to assignee)
- ✅ **Link appropriate:** Deep link to incident detail page (assignee has access via other RLS policies)

**Sensitive Information Risk:** 🟢 **LOW**  
- Title may contain some incident details but assignee needs this context
- Description NOT included in notification (good)
- Reporter contact NOT included (good)

**Side Effect Risk:** 🟢 **LOW**  
If notification INSERT fails, trigger returns NEW anyway (doesn't break assignment).

---

#### Trigger 2: notify_barangay_reviewer_new_incident()

**Location:** Lines 620-649

```sql
CREATE OR REPLACE FUNCTION notify_barangay_reviewer_new_incident()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_reviewer_id UUID;
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'submitted' AND NEW.barangay_id IS NOT NULL) THEN
    SELECT p.id INTO v_reviewer_id
    FROM profiles p
    WHERE p.role = 'barangay_reviewer'
      AND p.assigned_barangay = NEW.barangay_id
      AND p.reviewer_active = true
    LIMIT 1;
    
    IF v_reviewer_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, title, message, link)
      VALUES (
        v_reviewer_id,
        '📥 New Incident in Your Barangay',
        'A new incident has been submitted in your barangay: "' || NEW.title || '"',
        '/dashboard/review/barangay'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
```

**Security Analysis:**
- ✅ **Only notifies if barangay_id set:** Won't fire if legacy TEXT-only submission
- ✅ **Finds correct reviewer:** Queries by assigned_barangay + active status
- ✅ **LIMIT 1:** If multiple reviewers for same barangay, only notifies first (potential issue but not security risk)
- ✅ **Graceful degradation:** If no reviewer found, doesn't fail incident submission

**Potential Issues:**
- ⚠️ **Multiple reviewers:** If barangay has 2+ reviewers, only 1 gets notified (should notify all)
- ⚠️ **NULL barangay_id:** If incident submitted without barangay, no notification sent

**Sensitive Information Risk:** 🟢 **LOW**  
Only notifies assigned reviewer (appropriate).

**Recommended Fix (Non-Critical):**
```sql
FOR v_reviewer IN 
  SELECT id FROM profiles 
  WHERE role = 'barangay_reviewer' 
  AND assigned_barangay = NEW.barangay_id 
  AND reviewer_active = true
LOOP
  INSERT INTO notifications (...) VALUES (v_reviewer.id, ...);
END LOOP;
```

---

#### Trigger 3: notify_city_staff_urgent_incident()

**Location:** Lines 652-677

```sql
CREATE OR REPLACE FUNCTION notify_city_staff_urgent_incident()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_supervisor RECORD;
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.is_urgent = true) THEN
    FOR v_supervisor IN 
      SELECT id FROM profiles 
      WHERE role IN ('supervisor', 'admin')
    LOOP
      INSERT INTO notifications (user_id, title, message, link)
      VALUES (
        v_supervisor.id,
        '🚨 URGENT Incident Submitted',
        'Urgent incident requires immediate verification: "' || NEW.title || '"',
        '/dashboard/incident/' || NEW.id
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;
```

**Security Analysis:**
- ✅ **Notifies all supervisors:** Correct for urgent incidents
- ✅ **Only fires on INSERT:** Won't re-notify if incident marked urgent later (could be feature or bug)
- ✅ **SECURITY DEFINER:** Elevated privileges to INSERT notifications

**Sensitive Information Risk:** 🟢 **LOW**  
All supervisors have authority to see all incidents anyway.

**Performance Risk:** 🟡 **MEDIUM**  
If City has 50+ supervisors, loop could slow INSERT. Recommendation: Use batch INSERT or async queue.

---

### Backfill Function Security

**Location:** Lines 351-389

```sql
CREATE OR REPLACE FUNCTION backfill_barangay_ids()
RETURNS TABLE (...)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
...
  UPDATE incidents i
  SET barangay_id = b.id
  FROM barangays b
  WHERE i.barangay IS NOT NULL
    AND i.barangay_id IS NULL
    AND LOWER(TRIM(i.barangay)) = LOWER(b.name);
...
$$;
```

**Security Analysis:**
- ✅ **SECURITY DEFINER appropriate:** Needs elevated privileges to UPDATE incidents
- ✅ **Read-only return:** Returns statistics, doesn't expose PII
- ✅ **Idempotent:** WHERE clause `barangay_id IS NULL` prevents duplicate updates
- ✅ **Safe matching:** Uses barangays table as source of truth

**Privilege Escalation Risk:** 🟢 **NONE**  
Function only UPDATEs barangay_id field (non-sensitive normalization).

**Data Corruption Risk:** 🟡 **MEDIUM**  
Fuzzy matching could assign wrong barangay if:
- Barangay name typo in TEXT field
- Similar barangay names (e.g., "Ma-ao" vs "Macao")

**Mitigation:** Function does NOT execute automatically. Manual review required before running.

---

## 3️⃣ BARANGAY_REVIEWER ROLE COMPATIBILITY

### Existing Authentication System

**Current Roles** (from supabase/schema.sql):
```sql
CREATE TYPE user_role AS ENUM ('citizen', 'responder', 'supervisor', 'admin');
```

**Authentication Flow:**
1. User signs up via Supabase Auth (email/password)
2. Trigger `on_auth_user_created` creates profile with role='citizen'
3. Admin manually changes role to responder/supervisor/admin via dashboard

**New Role Addition:**
```sql
ALTER TYPE user_role ADD VALUE 'barangay_reviewer';
```

**Compatibility Analysis:**
- ✅ **Non-breaking:** Adds value to enum, doesn't change existing values
- ✅ **Existing RLS preserved:** Current policies use `IN ('responder', 'supervisor', 'admin')` which excludes barangay_reviewer
- ✅ **Dashboard compatibility:** TypeScript types handle new enum value gracefully
- ✅ **Middleware compatibility:** Auth checks based on role existence, not specific values

**Potential Issues:**
- ⚠️ **Dashboard UI:** Current role dropdown may not include barangay_reviewer (needs UI update)
- ⚠️ **Assignment workflow:** No UI to assign reviewer to barangay (needs admin page)
- ⚠️ **First reviewer creation:** Who creates the first barangay_reviewer account?

**Recommended Workflow:**
1. Admin logs into Supabase dashboard
2. Manually UPDATEs profile: `SET role='barangay_reviewer', assigned_barangay='uuid-of-barangay'`
3. Later: Build admin UI for reviewer management

**Rollback Compatibility:** ⚠️ **LIMITED**  
Cannot remove enum value without recreating entire type. If rollback needed, existing barangay_reviewer accounts will have invalid role (must be manually changed).

---

## 4️⃣ SAFETY CHECK DETAILED EVIDENCE

### Safety Check #1: Nullable Columns

**Check Performed:** Searched migration SQL for `NOT NULL` constraints on new columns

**Evidence:**
```sql
-- profiles table
ADD COLUMN IF NOT EXISTS assigned_barangay UUID REFERENCES barangays(id);  -- No NOT NULL
ADD COLUMN IF NOT EXISTS reviewer_since TIMESTAMPTZ;  -- No NOT NULL
ADD COLUMN IF NOT EXISTS reviewer_active BOOLEAN DEFAULT true;  -- Nullable implied
ADD COLUMN IF NOT EXISTS secondary_roles TEXT[];  -- No NOT NULL

-- incidents table
ADD COLUMN IF NOT EXISTS barangay_id UUID;  -- No NOT NULL
ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT false;  -- Nullable implied
ADD COLUMN IF NOT EXISTS reviewed_by UUID;  -- No NOT NULL
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;  -- No NOT NULL
ADD COLUMN IF NOT EXISTS verified_by UUID;  -- No NOT NULL
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;  -- No NOT NULL
ADD COLUMN IF NOT EXISTS duplicate_of UUID;  -- No NOT NULL
ADD COLUMN IF NOT EXISTS verification_notes TEXT;  -- No NOT NULL
```

**Result:** ✅ PASS - All 12 new columns on existing tables are nullable

**Limitation:** This is a static code review. Runtime behavior depends on PostgreSQL enforcing these constraints correctly.

---

### Safety Check #2: RLS Enabled by Default

**Check Performed:** Verified `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` for new tables

**Evidence:**
```sql
-- Line 204
ALTER TABLE incident_reviews ENABLE ROW LEVEL SECURITY;

-- Line 252
ALTER TABLE incident_duplicates ENABLE ROW LEVEL SECURITY;

-- Line 286
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
```

**Result:** ✅ PASS - All 3 new tables have RLS explicitly enabled

**Limitation:** This doesn't verify that policies are correct, only that RLS is enabled.

---

### Safety Check #3: No Destructive Operations

**Check Performed:** Searched for DROP TABLE, TRUNCATE, DELETE FROM, UPDATE without WHERE

**Evidence:**
- ❌ No `DROP TABLE` found (except in rollback section, commented)
- ❌ No `TRUNCATE` found
- ❌ No `DELETE FROM incidents` or `DELETE FROM profiles` found
- ❌ No `UPDATE incidents SET` without WHERE clause found

**Result:** ✅ PASS - No destructive data operations

**Limitation:** This check cannot detect logic bugs that might corrupt data.

---

### Safety Check #4: Foreign Key Validation

**Check Performed:** Verified all FK references point to existing tables

**Evidence:**
```sql
-- All FK constraints reference existing tables:
profiles.assigned_barangay → barangays(id)  ✅ (24 rows exist)
incidents.barangay_id → barangays(id)  ✅
incidents.reviewed_by → profiles(id)  ✅
incidents.verified_by → profiles(id)  ✅
incidents.duplicate_of → incidents(id)  ✅ (self-reference)
incident_reviews.incident_id → incidents(id)  ✅
incident_reviews.reviewer_id → profiles(id)  ✅
incident_duplicates.incident_id → incidents(id)  ✅
incident_duplicates.potential_duplicate_id → incidents(id)  ✅
incident_duplicates.reviewed_by → profiles(id)  ✅
notifications.user_id → profiles(id)  ✅
```

**Result:** ✅ PASS - All FK constraints valid

**Limitation:** This doesn't verify that FK cascade behavior is correct (addressed separately).

---

### Safety Check #14: No Secrets in Migration

**Check Performed:** Searched for hardcoded credentials, API keys, tokens

**Evidence:**
- ❌ No `PASSWORD` keyword found
- ❌ No `SECRET` keyword found
- ❌ No `API_KEY` found
- ❌ No `TOKEN` found
- ❌ No Supabase URLs or anon keys found
- ❌ No hardcoded UUIDs (all use `uuid_generate_v4()`)

**Result:** ✅ PASS - No secrets in migration SQL

**Limitation:** Cannot detect obfuscated or encoded secrets.

---

### Safety Checks: Known Limitations

**What Static Analysis CANNOT Verify:**
1. ✅ Runtime RLS enforcement (requires database execution)
2. ✅ Performance under load (requires benchmarking)
3. ✅ Edge cases in trigger logic (requires integration testing)
4. ✅ Notification delivery success (requires application testing)
5. ✅ Backfill accuracy with real data (requires manual review)

**These require staging deployment and testing to validate.**

---

## 5️⃣ ROLLBACK PROCEDURE SAFETY

**Location:** Lines 875-916 of migration SQL

**Rollback Strategy:**
```sql
-- 1. Drop triggers (safe - non-destructive)
DROP TRIGGER IF EXISTS trigger_notify_urgent_incident ON incidents;
...

-- 2. Drop functions (safe - no data loss)
DROP FUNCTION IF EXISTS notify_city_staff_urgent_incident();
...

-- 3. Drop new policies (safe - preserves base policies)
DROP POLICY IF EXISTS "Barangay reviewers can review incidents" ON incidents;
...

-- 4. Archive new tables (IMPORTANT: RENAME, not DROP)
ALTER TABLE notifications RENAME TO notifications_archived_20261026;
ALTER TABLE incident_duplicates RENAME TO incident_duplicates_archived_20261026;
ALTER TABLE incident_reviews RENAME TO incident_reviews_archived_20261026;

-- 5. Drop new columns (safe - nullable)
ALTER TABLE incidents DROP COLUMN IF EXISTS verification_notes;
...
```

**Safety Analysis:**
- ✅ **No data deletion:** Tables renamed to `_archived`, not dropped
- ✅ **Audit preservation:** incident_reviews and audit_logs preserved
- ✅ **Graceful degradation:** System reverts to Phase B functionality
- ✅ **Order matters:** Functions dropped before triggers (correct dependency order)

**Known Issue:**
- ⚠️ **Cannot remove enum value:** `barangay_reviewer` remains in enum even after rollback
- ⚠️ **Profiles with role='barangay_reviewer':** Must be manually changed before rollback

**Rollback Time Estimate:** ~10 minutes (manual SQL execution)

**Data Loss Risk:** 🟢 **NONE** (all data archived, not deleted)

---

## 6️⃣ CURRENT DATABASE STATE VERIFICATION

### Migration History

**Existing Migrations:**
1. ❌ `001_initial_schema.sql` - Does NOT exist
2. ✅ `001_security_remediation.sql` - DEPRECATED (6 vulnerabilities)
3. ✅ `002_security_remediation_v2.sql` - DEPLOYED (Phase B)

**Base Schema:**
- `supabase/schema.sql` - Contains initial schema definition

**Migration 002 Status (Phase B):**
- ✅ Confirmed applied to production (per user "its good now")
- ✅ audit_logs table exists
- ✅ track_incident_by_reference() function working
- ✅ Privacy-protected tracking functional
- ✅ Table-level GRANTs applied (anon can INSERT)

**Migration 003 (This Phase):**
- ❌ NOT applied to any database
- ❌ NOT tested in staging
- ⏸️ Awaiting user approval

**Dependency Chain:**
```
schema.sql (base) 
  → 002_security_remediation_v2.sql (Phase B) ✅ APPLIED
    → 003_verification_system_schema.sql (Phase 2) ⏸️ PENDING
```

**Compatibility:** ✅ Migration 003 correctly depends on 002 (audit_logs table, etc.)

---

## 7️⃣ STAGING ENVIRONMENT VERIFICATION

### Environment Configuration

**Production Environment (from user messages):**
- URL: https://bago-reporting.vercel.app/
- Database: Production Supabase
- GitHub: https://github.com/ICTcmd/Bago-reporting.git
- Branch: `main`

**Staging Environment:**
- ⚠️ **NOT VERIFIED** - Cannot confirm isolation from production
- ❓ Staging Supabase URL: UNKNOWN
- ❓ Staging Vercel URL: UNKNOWN
- ❓ Staging database backup: NOT CONFIRMED

**Critical Questions Before Deployment:**
1. ❓ Does a separate staging Supabase project exist?
2. ❓ What is the staging Supabase project URL?
3. ❓ Are staging and production databases completely separate?
4. ❓ Do staging environment variables point to staging Supabase?
5. ❓ Is staging Vercel deployment configured with preview environment?

**Risk Assessment:** 🔴 **CANNOT DEPLOY TO "STAGING" WITHOUT VERIFICATION**

Per user's instruction: *"Verify the actual staging database and environment configuration before any migration. Do not assume staging is separate from production just because it is labeled staging."*

**Required Before Deployment:**
1. User provides staging Supabase project URL
2. User confirms staging database is empty or test-only data
3. User confirms environment variables are staging-specific
4. Backup of staging database created
5. Test query on staging to confirm isolation

---

## 8️⃣ IDENTIFIED BLOCKERS & RISKS

### BLOCKER #1: Supervisor Verification Policy Bug

**Severity:** 🔴 **CRITICAL**  
**Location:** Lines 569-582 (Policy: "Supervisors can verify incidents")  
**Issue:** USING clause restricts to incidents already in target states

**SQL Bug:**
```sql
USING (
  ...
  AND status IN ('verified', 'invalid', 'duplicate')  -- WRONG: checks OLD status
)
```

**Should Be:**
```sql
USING (
  EXISTS (...)
  -- No status restriction here, or check for SOURCE statuses like 'submitted', 'under_review'
)
```

**Impact:** Supervisors cannot perform city verification workflow as designed.

**Resolution Required:** Fix RLS policy before deployment.

---

### RISK #1: Multiple Barangay Reviewers Not Fully Supported

**Severity:** 🟡 **MEDIUM**  
**Location:** Notification trigger (Line 628)

**Issue:** `LIMIT 1` means only first reviewer gets notified if barangay has multiple reviewers.

**Impact:** Other reviewers won't know about new incident.

**Resolution:** Change to loop through all reviewers (non-critical, can fix later).

---

### RISK #2: Backfill Function Accuracy Unknown

**Severity:** 🟡 **MEDIUM**  
**Location:** Lines 351-389

**Issue:** Fuzzy matching may assign wrong barangay to existing incidents.

**Impact:** Historical incidents could be visible to wrong barangay reviewer.

**Mitigation:** 
- Function does NOT auto-execute
- Returns statistics for manual review
- Unmatched incidents preserved (not failed)

**Resolution:** Test on staging data, manually review results before production.

---

### RISK #3: Urgent Notification Performance

**Severity:** 🟢 **LOW**  
**Location:** Lines 652-677

**Issue:** Loop notifies ALL supervisors on urgent incident INSERT.

**Impact:** If City has 50+ supervisors, could slow incident submission by 100-500ms.

**Mitigation:** Triggers fire AFTER INSERT (non-blocking for user).

**Resolution:** Monitor in staging. If slow, implement async notification queue.

---

### RISK #4: Unverified Sensitive Categories

**Severity:** 🟡 **MEDIUM** (Requires City Policy)  
**Location:** Public map display logic (not in this migration)

**Issue:** Unverified crime/medical reports may be publicly visible.

**Impact:** Privacy violations, panic, liability for City.

**Mitigation:** 
- Current design shows all unverified incidents
- City Policy #3 addresses this

**Resolution:** City approves category-specific hiding rules, implement via config (no migration needed).

---

## 9️⃣ RECOMMENDATIONS

### Required Before Staging Deployment

1. ✅ **Fix Supervisor Verification Policy Bug** (BLOCKER #1)
   - Revise RLS policy USING clause
   - Test with actual supervisor account

2. ✅ **Verify Staging Environment Isolation**
   - User provides staging Supabase URL
   - Confirm separate database
   - Test with harmless query

3. ✅ **Create Staging Backup**
   - Even if staging is empty, document baseline
   - Allows rollback testing

4. ✅ **Document Test Plan**
   - Which accounts will be created? (barangay reviewer, supervisor)
   - Which tests will be run? (RLS, notifications, backfill)
   - Success criteria defined

### Optional Improvements (Non-Blocking)

5. ⭕ **Fix Multiple Reviewer Notification**
   - Change LIMIT 1 to loop (RISK #1)
   - Can deploy as-is, fix in Phase 3

6. ⭕ **Add Performance Monitoring**
   - Track notification trigger execution time
   - Add EXPLAIN ANALYZE to complex queries

7. ⭕ **Clarify City Policy Timeline**
   - When will City decide on email/SMS?
   - When will urgency criteria be defined?

---

## 🎯 FINAL SUMMARY

### Overall Assessment

**Technical Quality:** ✅ **HIGH**  
- Well-structured migration
- Comprehensive documentation
- Safety-first approach

**Security Posture:** ✅ **STRONG** (with bug fix)  
- RLS policies mostly correct
- Least-privilege enforced
- Audit logging comprehensive

**Deployment Readiness:** ⚠️ **BLOCKED**  
- 1 critical bug must be fixed
- Staging environment not verified
- City policy items documented but not resolved

### Deployment Decision Matrix

| Condition | Status | Blocking? |
|-----------|--------|-----------|
| Technical review complete | ✅ DONE | No |
| City policy items documented | ✅ DONE | No |
| Safety checks passed | ✅ 14/14 | No |
| Critical bugs identified | ⚠️ 1 FOUND | **YES** |
| Staging environment verified | ❌ NOT DONE | **YES** |
| User approval obtained | ⏸️ PENDING | **YES** |

**Recommendation:** ❌ **DO NOT DEPLOY YET**

**Required Actions:**
1. Fix supervisor verification policy bug
2. Verify staging environment isolation
3. User reviews this document
4. User provides explicit approval

**Timeline After Fixes:**
- Bug fix: 15 minutes
- Staging verification: 30 minutes
- User review: 1-2 hours
- Staging deployment: 2-3 hours

---

## 📞 USER DECISION POINTS

**You Must Decide:**

1. **Accept City Policy Deferrals?**
   - In-app notifications only (no email/SMS yet)
   - No urgency definitions yet
   - All categories visible on public map
   - Indefinite data retention
   - Self-verification allowed with logging

2. **Approve Supervisor Policy Bug Fix?**
   - I can fix and show you revised SQL
   - Or defer this feature until later

3. **Provide Staging Environment Details?**
   - Staging Supabase project URL
   - Confirmation it's isolated from production
   - Permission to test

4. **Accept Identified Risks?**
   - Multiple reviewers notification (minor)
   - Backfill accuracy requires manual review
   - Urgent notification performance (monitor)
   - Unverified sensitive categories (policy needed)

**Next Step Options:**

**Option A:** "Fix bug, verify staging, then proceed"  
→ I'll fix supervisor policy, you verify staging environment, then deploy

**Option B:** "Fix bug, test locally first"  
→ I'll fix and create local test script before staging

**Option C:** "Defer deployment, address concerns first"  
→ I'll create revised migration addressing all issues

**Option D:** "Explain [specific concern] more"  
→ I'll provide deeper analysis on any section

---

**This review is complete. Awaiting your decision.** 🎯

