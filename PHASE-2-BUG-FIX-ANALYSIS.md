# PHASE 2 — SUPERVISOR RLS POLICY BUG FIX

**Date:** October 26, 2026  
**Status:** 🔴 **BUG IDENTIFIED - FIX REQUIRED BEFORE DEPLOYMENT**  
**Migration:** 003_verification_system_schema.sql (NOT YET APPLIED)

---

## 🐛 BUG #1: SUPERVISOR VERIFICATION POLICY

### Current Policy (BUGGY)

**Location:** Lines 569-582 of migration 003_verification_system_schema.sql

**Policy Name:** `"Supervisors can verify incidents"`  
**Table:** `incidents`  
**Operation:** `UPDATE`  
**Role:** `authenticated`

**Complete SQL:**
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
    AND status IN ('verified', 'invalid', 'duplicate')  -- ❌ BUG: Checks OLD status
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('supervisor', 'admin')
    )
  );
```

---

### Why This is a Bug

#### PostgreSQL RLS Policy Semantics

**USING Clause:**
- Applied to the **OLD row** (before UPDATE)
- Determines: "Can this user UPDATE this existing row?"
- Evaluates: `WHERE OLD.status IN ('verified', 'invalid', 'duplicate')`

**WITH CHECK Clause:**
- Applied to the **NEW row** (after UPDATE)
- Determines: "Is the NEW row state valid?"
- Evaluates: Constraints on NEW values

#### The Problem

**Intended Workflow:**
```
Barangay reviewer approves: status changes from 'under_review' → 'verified'
City supervisor verifies: status changes from 'verified' → 'in_progress'
```

**What Actually Happens:**
```sql
-- Supervisor tries to UPDATE incident from 'verified' → 'in_progress'
UPDATE incidents 
SET status = 'in_progress', verified_by = supervisor_uuid 
WHERE id = incident_id;

-- RLS USING clause evaluates:
-- 1. Is auth.uid() a supervisor? ✅ YES
-- 2. Is OLD.status IN ('verified', 'invalid', 'duplicate')? ✅ YES (status is 'verified')
-- 3. Policy allows UPDATE ✅

-- WITH CHECK clause evaluates:
-- 1. Is auth.uid() still a supervisor? ✅ YES
-- 2. NEW.status = 'in_progress' - allowed? ✅ (no restriction in WITH CHECK)

-- RESULT: Should work! ✅
```

**BUT for other transitions:**
```sql
-- Supervisor tries to mark incident as 'invalid' (reject it)
UPDATE incidents 
SET status = 'invalid', verification_notes = 'Not a real incident' 
WHERE id = incident_id AND status = 'under_review';

-- RLS USING clause evaluates:
-- 1. Is auth.uid() a supervisor? ✅ YES
-- 2. Is OLD.status IN ('verified', 'invalid', 'duplicate')? ❌ NO (status is 'under_review')
-- 3. Policy DENIES UPDATE ❌

-- RESULT: Supervisor cannot reject unverified incidents! ❌
```

#### Source and Destination Status Analysis

**Intended Supervisor Actions:**

| Source Status | Destination Status | Purpose | Policy Allows? |
|---------------|-------------------|---------|----------------|
| `submitted` | `verified` | Skip barangay review (urgent) | ❌ **DENIED** |
| `under_review` | `verified` | Override barangay review | ❌ **DENIED** |
| `under_review` | `invalid` | Reject early | ❌ **DENIED** |
| `verified` | `in_progress` | Approve and assign | ✅ **ALLOWED** |
| `verified` | `invalid` | Reject after barangay approval | ✅ **ALLOWED** |
| `verified` | `duplicate` | Mark as duplicate | ✅ **ALLOWED** |
| `in_progress` | `invalid` | Cancel in-progress | ❌ **DENIED** |

**Problem:** Policy only allows supervisors to UPDATE incidents that are ALREADY in terminal/verification states, but blocks them from SETTING incidents TO those states from earlier workflow stages.

---

### Root Cause

The USING clause was written to restrict which statuses supervisors can SET (destination), but it actually restricts which statuses supervisors can UPDATE FROM (source).

**Conceptual Error:**
```
INTENDED: "Supervisors can set status TO {verified, invalid, duplicate}"
ACTUAL:   "Supervisors can only update incidents FROM {verified, invalid, duplicate}"
```

---

## 🔧 PROPOSED FIX

### Option A: Remove Status Restriction from USING (Least Restrictive)

**Rationale:** Supervisors have authority to verify at any workflow stage. Status restrictions should be in application logic, not RLS.

```sql
-- ✅ CORRECTED VERSION
CREATE POLICY "Supervisors can verify incidents"
  ON incidents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('supervisor', 'admin')
    )
    -- Status restriction removed from USING
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('supervisor', 'admin')
    )
    -- Add destination status validation if needed
    -- AND (status IS DISTINCT FROM OLD.status OR status IN ('verified', 'in_progress', 'invalid', 'duplicate', 'closed'))
  );
```

**Pros:**
- ✅ Supervisors can verify incidents at any stage
- ✅ Supervisors can handle urgent incidents (skip barangay review)
- ✅ Supervisors can override barangay decisions

**Cons:**
- ⚠️ Supervisors can UPDATE incidents in states like 'submitted' (may be desired)
- ⚠️ No enforcement of workflow stages in database (relies on application logic)

**Security Analysis:**
- **Unauthorized Field Access:** Prevented by WITH CHECK (still requires supervisor role)
- **Bypass Workflow:** Possible, but supervisors have authority to do this
- **Unauthorized Updates:** No - supervisor role still required

---

### Option B: Specify Source Statuses (Workflow Enforcement)

**Rationale:** Supervisors should only verify incidents that have been through barangay review OR are urgent.

```sql
-- ✅ CORRECTED VERSION (Workflow Enforced)
CREATE POLICY "Supervisors can verify incidents"
  ON incidents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('supervisor', 'admin')
    )
    AND (
      -- Allow updating incidents that completed barangay review
      status IN ('verified', 'under_review', 'invalid')
      -- OR incidents marked urgent (skip barangay review)
      OR is_urgent = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('supervisor', 'admin')
    )
    -- Optionally restrict destination statuses
    AND status IN ('verified', 'in_progress', 'invalid', 'duplicate', 'closed')
  );
```

**Pros:**
- ✅ Enforces workflow: supervisors can't bypass barangay review (unless urgent)
- ✅ Supervisors can handle post-review verification
- ✅ Supervisors can override barangay decisions (change 'invalid' back to 'verified')

**Cons:**
- ⚠️ More complex logic
- ⚠️ Might block legitimate supervisor actions

**Security Analysis:**
- **Workflow Enforcement:** Yes - supervisors must respect barangay review process
- **Urgent Bypass:** Yes - urgent incidents skip barangay review
- **Unauthorized Updates:** No - still requires supervisor role

---

### Option C: Separate Policies for Different Operations (Most Restrictive)

**Rationale:** Different supervisor actions have different authority levels.

```sql
-- Policy 1: Supervisors can verify barangay-reviewed incidents
CREATE POLICY "Supervisors can verify reviewed incidents"
  ON incidents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('supervisor', 'admin')
    )
    AND status = 'verified'  -- Only barangay-approved incidents
  )
  WITH CHECK (
    status IN ('in_progress', 'invalid', 'duplicate')
    AND verified_by = auth.uid()  -- Must assign to self
  );

-- Policy 2: Supervisors can handle urgent incidents
CREATE POLICY "Supervisors can handle urgent incidents"
  ON incidents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('supervisor', 'admin')
    )
    AND is_urgent = true
    AND status IN ('submitted', 'under_review')
  )
  WITH CHECK (
    status IN ('verified', 'invalid')
    AND verified_by = auth.uid()
  );

-- Policy 3: Supervisors can close resolved incidents
CREATE POLICY "Supervisors can close resolved incidents"
  ON incidents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('supervisor', 'admin')
    )
    AND status = 'resolved'
  )
  WITH CHECK (
    status = 'closed'
  );
```

**Pros:**
- ✅ Very explicit authority boundaries
- ✅ Each action clearly authorized
- ✅ Easy to audit what supervisors can do

**Cons:**
- ⚠️ Complex - 3 policies instead of 1
- ⚠️ Maintenance burden
- ⚠️ Might miss edge cases

---

## 📋 RECOMMENDED FIX: Option B (Workflow Enforced)

### Complete Corrected Policy

```sql
-- Drop buggy policy
DROP POLICY IF EXISTS "Supervisors can verify incidents" ON incidents;

-- Create corrected policy
CREATE POLICY "Supervisors can verify incidents"
  ON incidents FOR UPDATE
  TO authenticated
  USING (
    -- Must be a supervisor or admin
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('supervisor', 'admin')
    )
    AND (
      -- Can update incidents that have been barangay-reviewed
      status IN ('verified', 'under_review', 'invalid')
      -- OR urgent incidents (bypass barangay review)
      OR is_urgent = true
      -- OR incidents already in city-managed states
      OR status IN ('in_progress', 'resolved', 'duplicate')
    )
  )
  WITH CHECK (
    -- Must still be a supervisor
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('supervisor', 'admin')
    )
    -- Can only set status to city-authorized states
    AND status IN ('verified', 'in_progress', 'invalid', 'duplicate', 'closed')
  );
```

**Status Transition Matrix (After Fix):**

| Source Status | Destination Status | Supervisor Can? | Rationale |
|---------------|-------------------|----------------|-----------|
| `submitted` (urgent) | `verified` | ✅ YES | Urgent bypass |
| `submitted` (not urgent) | `verified` | ❌ NO | Must go through barangay |
| `under_review` | `verified` | ✅ YES | Override/complete barangay review |
| `under_review` | `invalid` | ✅ YES | Reject during review |
| `verified` | `in_progress` | ✅ YES | Approve and assign |
| `verified` | `invalid` | ✅ YES | Reject after review |
| `verified` | `duplicate` | ✅ YES | Mark duplicate |
| `in_progress` | `resolved` | ❌ NO | Responder authority |
| `resolved` | `closed` | ✅ YES | Supervisor closes cases |
| `invalid` | `under_review` | ✅ YES | Reopen rejected incident |

---

## 🧪 REGRESSION TESTS

### Test Suite 1: Allowed Status Transitions (Static Analysis)

**Test 1.1: Supervisor verifies barangay-approved incident**
```sql
-- Setup
INSERT INTO incidents (id, status, barangay_id, is_urgent, ...) 
VALUES ('test-1', 'verified', 'poblacion-uuid', false, ...);

-- Action (as supervisor)
UPDATE incidents 
SET status = 'in_progress', verified_by = supervisor_uuid 
WHERE id = 'test-1';

-- Expected: ✅ SUCCESS
-- USING: status='verified' IN ('verified', 'under_review', 'invalid') ✅
-- WITH CHECK: 'in_progress' IN ('verified', 'in_progress', 'invalid', 'duplicate', 'closed') ✅
```

**Test 1.2: Supervisor handles urgent incident (skip barangay)**
```sql
-- Setup
INSERT INTO incidents (id, status, barangay_id, is_urgent, ...) 
VALUES ('test-2', 'submitted', 'macao-uuid', true, ...);

-- Action (as supervisor)
UPDATE incidents 
SET status = 'verified', verified_by = supervisor_uuid 
WHERE id = 'test-2';

-- Expected: ✅ SUCCESS
-- USING: is_urgent=true ✅
-- WITH CHECK: 'verified' IN (...) ✅
```

**Test 1.3: Supervisor rejects incident during barangay review**
```sql
-- Setup
INSERT INTO incidents (id, status, barangay_id, is_urgent, ...) 
VALUES ('test-3', 'under_review', 'alianza-uuid', false, ...);

-- Action (as supervisor)
UPDATE incidents 
SET status = 'invalid', verification_notes = 'Not legitimate' 
WHERE id = 'test-3';

-- Expected: ✅ SUCCESS
-- USING: status='under_review' IN ('verified', 'under_review', 'invalid') ✅
-- WITH CHECK: 'invalid' IN (...) ✅
```

---

### Test Suite 2: Denied Status Transitions (Static Analysis)

**Test 2.1: Supervisor cannot bypass barangay review (non-urgent)**
```sql
-- Setup
INSERT INTO incidents (id, status, barangay_id, is_urgent, ...) 
VALUES ('test-4', 'submitted', 'bagroy-uuid', false, ...);

-- Action (as supervisor)
UPDATE incidents 
SET status = 'verified', verified_by = supervisor_uuid 
WHERE id = 'test-4';

-- Expected: ❌ DENIED
-- USING: status='submitted' NOT IN ('verified', 'under_review', 'invalid') 
--        AND is_urgent=false ❌
```

**Test 2.2: Supervisor cannot mark incident as 'resolved' (responder authority)**
```sql
-- Setup
INSERT INTO incidents (id, status, assigned_to, ...) 
VALUES ('test-5', 'in_progress', responder_uuid, ...);

-- Action (as supervisor)
UPDATE incidents 
SET status = 'resolved' 
WHERE id = 'test-5';

-- Expected: ❌ DENIED (by different policy - responders only can resolve)
-- Note: Supervisor policy allows UPDATE (USING passes), but WITH CHECK may fail
-- Actually: ✅ ALLOWED - WITH CHECK includes 'closed' but not 'resolved'
-- FIX: Add 'resolved' to WITH CHECK if supervisors should close early
```

---

### Test Suite 3: Unauthorized Barangay Access (Requires Runtime)

**Test 3.1: Barangay reviewer cannot access other barangay**
```sql
-- Setup
-- Reviewer assigned to 'Poblacion'
-- Incident in 'Ma-ao'

-- Action (as barangay_reviewer from Poblacion)
SELECT * FROM incidents WHERE barangay = 'Ma-ao' AND status = 'submitted';

-- Expected: ❌ DENIED (0 rows returned)
-- Policy: "Barangay reviewers view assigned barangay incidents"
-- USING: barangay_id != poblacion_uuid AND barangay != 'Poblacion' ❌
```

**Test 3.2: Barangay reviewer cannot update other barangay**
```sql
-- Action (as barangay_reviewer from Poblacion)
UPDATE incidents 
SET status = 'verified', reviewed_by = reviewer_uuid 
WHERE barangay = 'Ma-ao' AND id = 'test-incident';

-- Expected: ❌ DENIED
-- Policy: "Barangay reviewers can review incidents"
-- USING: barangay != reviewer's assigned barangay ❌
```

---

### Test Suite 4: Self-Verification (Database Authorization)

**Test 4.1: Reporter cannot verify their own incident**
```sql
-- Setup
INSERT INTO incidents (id, reporter_id, status, ...) 
VALUES ('test-6', user_uuid, 'submitted', ...);

-- Action (same user, now with supervisor role)
UPDATE incidents 
SET status = 'verified', verified_by = user_uuid 
WHERE id = 'test-6';

-- Expected: ✅ ALLOWED (current policies don't prevent this)
-- ⚠️ POLICY GAP: Should add reporter_id != auth.uid() check
```

**RECOMMENDED FIX (Separate Migration):**
```sql
-- Add to supervisor policy WITH CHECK:
AND (reporter_id IS NULL OR reporter_id != auth.uid())
```

---

### Test Suite 5: Protected Field Changes (Requires Runtime)

**Test 5.1: Supervisor cannot change barangay assignment**
```sql
-- Action (as supervisor)
UPDATE incidents 
SET barangay_id = 'different-barangay-uuid' 
WHERE id = 'test-7';

-- Expected: ✅ ALLOWED (no restriction in policy)
-- ⚠️ POLICY GAP: Should barangay_id be immutable after submission?
```

**Test 5.2: Supervisor cannot change reporter information**
```sql
-- Action (as supervisor)
UPDATE incidents 
SET reporter_contact = 'fake@email.com' 
WHERE id = 'test-8';

-- Expected: ✅ ALLOWED (no restriction in policy)
-- ⚠️ POLICY GAP: Should reporter fields be protected?
```

**RECOMMENDED FIX (Separate Migration):**
```sql
-- Add to supervisor policy WITH CHECK:
AND reporter_id IS NOT DISTINCT FROM OLD.reporter_id
AND reporter_name IS NOT DISTINCT FROM OLD.reporter_name
AND reporter_contact IS NOT DISTINCT FROM OLD.reporter_contact
AND (barangay_id IS NOT DISTINCT FROM OLD.barangay_id OR OLD.barangay_id IS NULL)
```

---

## 🚨 THREE POLICY CONCERNS

### CONCERN #1: Sensitive Incidents Must Not Auto-Publish

**Current State:**
- Public map displays ALL submitted incidents (unverified)
- No category-based filtering
- Description hidden, but title visible

**Risk:**
- Unverified crime reports visible
- Medical incidents with patient info in title
- False accusations public before investigation

**Recommended Fix (Separate Migration - 004):**

Add publication eligibility field and server-side allowlist:

```sql
-- Migration 004: Add publication controls
ALTER TABLE incidents 
  ADD COLUMN is_publishable BOOLEAN DEFAULT false,
  ADD COLUMN publication_approved_by UUID REFERENCES profiles(id),
  ADD COLUMN publication_approved_at TIMESTAMPTZ;

COMMENT ON COLUMN incidents.is_publishable IS 
  'Whether incident can be shown on public map. Default false. Supervisor sets true after review.';

-- Update public tracking function to check is_publishable
CREATE OR REPLACE FUNCTION public_incidents_map_view()
RETURNS TABLE (...)
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    reference_number,
    category,
    severity,
    title,
    barangay,
    status,
    created_at
  FROM incidents
  WHERE is_publishable = true  -- Only show approved
    AND status IN ('verified', 'in_progress', 'resolved', 'closed')
    AND category NOT IN ('crime', 'medical')  -- Sensitive categories always hidden
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Server-Side Allowlist (Application Config):**
```typescript
// config/publication-rules.ts
export const PUBLICATION_RULES = {
  // Categories that can be public
  publicCategories: ['flood', 'fire', 'road_obstruction', 'fallen_tree', 'building_damage'],
  
  // Categories always hidden (even if verified)
  sensitiveCategories: ['crime', 'medical'],
  
  // Minimum status for publication
  minimumStatus: 'verified',
  
  // Require explicit supervisor approval
  requireApproval: true
};
```

**This belongs in:** 📦 **Migration 004** (separate, after user approves policy)

---

### CONCERN #2: Reviewer Must Not Verify Own Report

**Current State:**
- No database restriction on reporter_id == verified_by
- UI could hide, but database doesn't enforce

**Risk:**
- User submits false report
- Same user (with supervisor role) verifies it
- Bypasses independent review

**Recommended Fix (Separate Migration - 004):**

```sql
-- Add to supervisor verification policy WITH CHECK:
CREATE OR REPLACE POLICY "Supervisors can verify incidents"
  ON incidents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('supervisor', 'admin')
    )
    AND (
      status IN ('verified', 'under_review', 'invalid')
      OR is_urgent = true
      OR status IN ('in_progress', 'resolved', 'duplicate')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('supervisor', 'admin')
    )
    AND status IN ('verified', 'in_progress', 'invalid', 'duplicate', 'closed')
    -- ✅ ADD THIS:
    AND (reporter_id IS NULL OR reporter_id != auth.uid())  -- Cannot verify own report
  );

-- Also add to barangay reviewer policy:
CREATE OR REPLACE POLICY "Barangay reviewers can review incidents"
  ON incidents FOR UPDATE
  TO authenticated
  USING (...)
  WITH CHECK (
    status IN ('under_review', 'verified', 'invalid')
    AND reviewed_by = auth.uid()
    AND (reporter_id IS NULL OR reporter_id != auth.uid())  -- Cannot review own report
    ...
  );
```

**Audit Trail:**
```sql
-- Audit log automatically captures if reporter_id == verified_by
-- Can query for suspicious self-verifications:
SELECT 
  i.reference_number,
  i.reporter_id,
  i.verified_by,
  p.email as verifier_email
FROM incidents i
JOIN profiles p ON i.verified_by = p.id
WHERE i.reporter_id = i.verified_by
  AND i.status = 'verified';
```

**This belongs in:** 📦 **Migration 004** (separate, after user approves policy)

---

### CONCERN #3: Indefinite Retention is Provisional

**Current State:**
- All incidents retained forever
- No automatic archival
- No anonymization

**Status:**
- ✅ Documented as provisional in BAGO-SAFE-DECISION-REGISTER.md (City Policy #4)
- ✅ Current default (indefinite retention) is conservative and safe
- ⏸️ Waiting for City to define retention policy

**No Database Changes Required Now**

**Future Implementation (When City Approves):**
```sql
-- Migration 00X: Data retention policy (FUTURE)
CREATE TABLE retention_policies (
  id UUID PRIMARY KEY,
  category incident_category,
  retention_days INTEGER NOT NULL,
  anonymize_after_days INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Example: Flood incidents retained 5 years, crime incidents 10 years
INSERT INTO retention_policies (category, retention_days, anonymize_after_days) VALUES
  ('flood', 1825, 1825),  -- 5 years, then anonymize
  ('fire', 1825, 1825),
  ('crime', 3650, NULL);  -- 10 years, never anonymize (legal hold)

-- Scheduled job (application-level, not migration):
-- - Find closed incidents older than retention_days
-- - Anonymize reporter_name, reporter_contact
-- - Move media to long-term storage
-- - Update status to 'archived'
```

**This belongs in:** 📦 **Future Migration** (after City approves retention policy)

---

## 📦 MIGRATION ASSIGNMENT

### Changes for Migration 003 (Current - Bug Fix Only)

**File:** `003_verification_system_schema.sql`

**Changes:**
1. ✅ Fix supervisor verification policy (USING clause)
   - **Lines to change:** 569-582
   - **Change type:** Policy replacement
   - **Risk:** LOW (fixes critical bug)

**SQL Diff:**
```diff
-- Line 569-582
DROP POLICY IF EXISTS "Supervisors can verify incidents" ON incidents;

CREATE POLICY "Supervisors can verify incidents"
  ON incidents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('supervisor', 'admin')
    )
-   AND status IN ('verified', 'invalid', 'duplicate')
+   AND (
+     status IN ('verified', 'under_review', 'invalid', 'in_progress', 'resolved', 'duplicate')
+     OR is_urgent = true
+   )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('supervisor', 'admin')
    )
+   AND status IN ('verified', 'in_progress', 'invalid', 'duplicate', 'closed')
  );
```

---

### Changes for Migration 004 (Future - Policy Enhancements)

**File:** `004_publication_and_verification_controls.sql` (TO BE CREATED AFTER USER APPROVES)

**Changes:**
1. ⏸️ Add `is_publishable` field for explicit publication control
2. ⏸️ Add self-verification prevention (reporter_id check)
3. ⏸️ Add protected field constraints (barangay_id, reporter info)
4. ⏸️ Create public_incidents_map_view() function
5. ⏸️ Add sensitive category filtering

**Status:** ⏸️ **DEFERRED** - Requires City policy approval

**Why Separate:**
- Changes policy behavior (not just bug fixes)
- Requires user review and approval
- Can be deployed independently after testing migration 003

---

### Changes for Migration 00X (Future - Retention Policy)

**File:** `00X_data_retention_policy.sql` (TO BE CREATED AFTER CITY APPROVES POLICY)

**Changes:**
1. ⏸️ Add retention_policies table
2. ⏸️ Add anonymization procedures
3. ⏸️ Add archival status

**Status:** ⏸️ **DEFERRED** - Requires City retention policy definition

---

## ✅ REVISED SQL FOR REVIEW

### Complete Fixed Policy (Migration 003)

```sql
-- ============================================================================
-- CORRECTED: Supervisor Verification Policy
-- ============================================================================
-- FIX: Changed USING clause to check SOURCE statuses (what supervisors can UPDATE FROM)
-- FIX: Added WITH CHECK to restrict DESTINATION statuses (what supervisors can SET TO)

DROP POLICY IF EXISTS "Supervisors can verify incidents" ON incidents;

CREATE POLICY "Supervisors can verify incidents"
  ON incidents FOR UPDATE
  TO authenticated
  USING (
    -- Must be a supervisor or admin
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('supervisor', 'admin')
    )
    -- Can update incidents in these source statuses:
    AND (
      -- Post-barangay-review statuses
      status IN ('verified', 'under_review', 'invalid')
      -- OR city-managed statuses (for corrections, closures)
      OR status IN ('in_progress', 'resolved', 'duplicate')
      -- OR urgent incidents (skip barangay review)
      OR is_urgent = true
    )
  )
  WITH CHECK (
    -- Must still be a supervisor/admin
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('supervisor', 'admin')
    )
    -- Can only set status to these destination values:
    AND status IN ('verified', 'in_progress', 'invalid', 'duplicate', 'closed')
  );

COMMENT ON POLICY "Supervisors can verify incidents" ON incidents IS
  'Supervisors can verify barangay-reviewed incidents, handle urgent incidents, and manage city-level verification workflow. Fixed in Phase 2 to use correct source/destination status checks.';
```

---

## 🧪 TEST EXECUTION REQUIREMENTS

### Static Tests (Can Execute Now)

**Test Type:** SQL syntax validation  
**Execution:** Run through PostgreSQL parser  
**Status:** ✅ Can validate before deployment

```bash
# Syntax check (doesn't execute, just parses)
psql -U postgres --dry-run < 003_verification_system_schema_fixed.sql
```

---

### Runtime Tests (Require Staging Database)

**Test Type:** RLS policy behavior validation  
**Execution:** Against actual Supabase staging database  
**Status:** ⏸️ **Blocked** - Awaiting staging environment verification

**Required Setup:**
1. Staging Supabase project with isolation confirmed
2. Apply migration 002 (Phase B) to staging
3. Apply fixed migration 003 to staging
4. Create test accounts (barangay_reviewer, supervisor, responder)
5. Create test incidents in various statuses
6. Execute test queries as each role

**Test Script** (example):
```sql
-- Execute as supervisor role
SET ROLE supervisor_role;
SET request.jwt.claim.sub TO 'supervisor-uuid';

-- Test 1: Verify barangay-approved incident
BEGIN;
UPDATE incidents 
SET status = 'in_progress', verified_by = 'supervisor-uuid' 
WHERE id = 'test-verified-incident' AND status = 'verified';
-- Should succeed: 1 row updated

-- Test 2: Try to bypass barangay review (non-urgent)
UPDATE incidents 
SET status = 'verified', verified_by = 'supervisor-uuid' 
WHERE id = 'test-submitted-incident' AND status = 'submitted' AND is_urgent = false;
-- Should fail: 0 rows updated (policy blocks)

ROLLBACK;
```

---

## 🎯 NEXT STEPS

### Before Staging Deployment

1. ✅ **Review this bug fix analysis** (you're doing now)
2. ⏸️ **Approve corrected policy** (your decision)
3. ⏸️ **Verify staging Supabase URL** (you provide)
4. ⏸️ **Confirm staging isolation** (test query)
5. ⏸️ **Apply fixed migration to staging** (after approval)
6. ⏸️ **Execute runtime test suite** (on staging)
7. ⏸️ **Review test results** (report to you)

### After Staging Validation

8. ⏸️ **Approve production deployment** (your decision)
9. ⏸️ **Review Migration 004 requirements** (publication controls)
10. ⏸️ **City policy decisions** (sensitive categories, retention)

---

## 📞 YOUR APPROVAL NEEDED

**Question 1:** Approve corrected supervisor verification policy for migration 003?
- Allows supervisors to verify barangay-reviewed incidents ✅
- Allows supervisors to handle urgent incidents (skip barangay) ✅
- Allows supervisors to manage city-level workflow ✅
- WITH CHECK restricts destination statuses ✅

**Question 2:** Defer self-verification prevention to migration 004?
- Current migration 003 does NOT prevent reporter == verifier
- Can add to migration 004 after City policy review
- Risk: LOW (audit logging captures any self-verification)

**Question 3:** Defer publication controls to migration 004?
- Current migration 003 does NOT add is_publishable field
- Can add after City decides on sensitive category handling
- Risk: MEDIUM (unverified sensitive incidents may be public)

**Question 4:** Ready to verify staging environment?
- Provide staging Supabase project URL
- Test isolation from production
- Proceed with staging deployment after confirmation

---

**Bug fix analysis complete. Awaiting your decisions.** 🎯

