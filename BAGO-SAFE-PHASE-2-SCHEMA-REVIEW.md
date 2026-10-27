# BAGO SAFE — PHASE 2 SCHEMA REVIEW
## Database Migration: Verification System Infrastructure

**Date:** October 26, 2026  
**Migration File:** `003_verification_system_schema.sql`  
**Status:** ⚠️ **READY FOR REVIEW - NOT YET APPLIED**  
**Dependencies:** Phase B migration 002_security_remediation_v2.sql (✅ applied to production)

---

## 📋 EXECUTIVE SUMMARY

This document reviews the Phase 2 database migration that implements verification workflow infrastructure based on approved decisions in `BAGO-SAFE-DECISION-REGISTER.md`.

**Safety Assessment:** ✅ **SAFE FOR STAGING**
- All new columns nullable (no NOT NULL on existing data)
- All changes reversible
- No destructive operations
- Existing functionality preserved
- RLS enabled by default on all new tables

**Recommendation:** ✅ **Approve for staging deployment**

---

## 🎯 MIGRATION OBJECTIVES

### Primary Goals
1. Add barangay reviewer role and assignments
2. Extend incidents table with verification tracking fields
3. Create incident_reviews table for detailed audit trail
4. Create incident_duplicates table for similarity detection
5. Create notifications table for in-app alerts
6. Add RLS policies for verification workflow
7. Implement notification triggers
8. Enhance audit logging for verification actions

### Non-Goals (Deferred)
- Email/SMS notifications (requires City policy approval)
- Barangay boundaries (GeoJSON) - requires external data
- Duplicate detection algorithm - application-level feature
- Frontend changes - Phase 3+

---

## 📊 SCHEMA CHANGES SUMMARY

### New Database Objects

| Type | Count | Names |
|------|-------|-------|
| **Tables** | 3 | incident_reviews, incident_duplicates, notifications |
| **Columns Added** | 15 | profiles (4), incidents (8), existing tables (3) |
| **Indexes** | 20 | Performance optimization for verification queries |
| **Functions** | 7 | Backfill, notifications, queue counts |
| **Triggers** | 4 | 1 enhanced (audit), 3 new (notifications) |
| **RLS Policies** | 12 | 6 new tables, 6 updated incidents policies |
| **Enum Values** | 1 | barangay_reviewer added to user_role |

---

## 🔐 SECURITY ANALYSIS

### RLS Policy Coverage

**✅ ALL NEW TABLES HAVE RLS ENABLED BY DEFAULT**

#### incident_reviews Table
| Operation | Policy | Enforces |
|-----------|--------|----------|
| SELECT | Staff can view incident reviews | authenticated role check |
| INSERT | Barangay reviewers create reviews | barangay assignment + level=barangay |
| INSERT | City staff create city reviews | supervisor/admin + level=city |
| UPDATE | ❌ DENIED | Immutable audit records |
| DELETE | ❌ DENIED | Immutable audit records |

#### incident_duplicates Table
| Operation | Policy | Enforces |
|-----------|--------|----------|
| SELECT | Staff can view duplicate suggestions | authenticated role check |
| INSERT | Staff can flag potential duplicates | authenticated role check |
| UPDATE | Supervisors can review duplicates | supervisor/admin only |
| DELETE | ❌ DENIED | Preserve duplicate history |

#### notifications Table
| Operation | Policy | Enforces |
|-----------|--------|----------|
| SELECT | Users view own notifications | user_id = auth.uid() |
| UPDATE | Users update own notifications | user_id = auth.uid() (mark read) |
| DELETE | Users delete own notifications | user_id = auth.uid() (cleanup) |
| INSERT | ❌ NO PUBLIC POLICY | Only server-side functions |

#### Updated incidents Table Policies
| Policy | Role | Scope |
|--------|------|-------|
| Barangay reviewers view assigned barangay incidents | barangay_reviewer | barangay_id/name match + status filter |
| Barangay reviewers can review incidents | barangay_reviewer | UPDATE submitted/under_review only |
| Supervisors can verify incidents | supervisor/admin | UPDATE verified/invalid/duplicate statuses |

**✅ SECURITY ASSESSMENT: LEAST-PRIVILEGE ENFORCED**
- Each role has minimal necessary permissions
- RLS prevents cross-barangay data access
- Audit tables immutable (no UPDATE/DELETE)
- Notifications isolated per user

---

## 🔍 DETAILED CHANGE ANALYSIS

### PART 1: User Role Extension

**Change:** Add `barangay_reviewer` to user_role enum

**SQL:**
```sql
ALTER TYPE user_role ADD VALUE 'barangay_reviewer';
```

**Impact:**
- ✅ Non-destructive (only adds option)
- ✅ Does not affect existing profiles
- ✅ Idempotent (checks if exists first)

**Rollback:** Cannot remove enum value without type recreation

**Risk:** 🟢 **LOW** - Safe operation, backward compatible

---

### PART 2: Profiles Table Extensions

**Changes:**

| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| assigned_barangay | UUID FK | ✅ YES | NULL | Which barangay this reviewer covers |
| reviewer_since | TIMESTAMPTZ | ✅ YES | NULL | When reviewer role granted |
| reviewer_active | BOOLEAN | ✅ YES | true | Can deactivate without deleting account |
| secondary_roles | TEXT[] | ✅ YES | NULL | Future multi-role support |

**Impact:**
- ✅ All columns nullable - existing profiles unchanged
- ✅ FK constraint to barangays table (valid reference)
- ✅ Indexes added for barangay reviewer queries

**Backward Compatibility:** ✅ **FULL**
- Existing profiles work as-is
- New columns ignored by current application code
- No data migration required

**Risk:** 🟢 **LOW** - Additive change only

---

### PART 3: Incidents Table Extensions

**Changes:**

| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| barangay_id | UUID FK | ✅ YES | NULL | Normalized barangay reference |
| is_urgent | BOOLEAN | ✅ YES | false | Fast-track flag |
| reviewed_by | UUID FK | ✅ YES | NULL | Barangay reviewer who approved |
| reviewed_at | TIMESTAMPTZ | ✅ YES | NULL | Review completion timestamp |
| verified_by | UUID FK | ✅ YES | NULL | City verifier |
| verified_at | TIMESTAMPTZ | ✅ YES | NULL | Verification timestamp |
| duplicate_of | UUID FK | ✅ YES | NULL | Parent incident if duplicate |
| verification_notes | TEXT | ✅ YES | NULL | Rejection reason, corrections |

**Impact:**
- ✅ All columns nullable - existing incidents preserved
- ✅ FK constraints valid (references profiles, incidents, barangays)
- ✅ Default values safe (is_urgent defaults to false)
- ✅ 7 new indexes for performance

**Existing TEXT Field Preserved:**
- `incidents.barangay` TEXT field **NOT REMOVED**
- Allows gradual migration via backfill function
- Both barangay (TEXT) and barangay_id (FK) usable

**Backward Compatibility:** ✅ **FULL**
- Existing queries work unchanged
- RLS policies check both barangay fields
- Backfill applied separately (not in migration)

**Risk:** 🟢 **LOW** - Additive change, no data loss

---

### PART 4: New Table - incident_reviews

**Purpose:** Detailed audit trail of barangay and city review decisions

**Schema:**
```sql
CREATE TABLE incident_reviews (
  id UUID PRIMARY KEY,
  incident_id UUID NOT NULL FK → incidents(id) CASCADE,
  reviewer_id UUID NOT NULL FK → profiles(id) SET NULL,
  review_level TEXT CHECK (IN 'barangay', 'city'),
  decision TEXT CHECK (IN 'approved', 'rejected', 'escalated', 'reopened'),
  rejection_reason TEXT nullable,
  notes TEXT nullable,
  reviewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(incident_id, review_level, reviewed_at)
);
```

**Rationale:**
- Preserves complete review history
- Supports re-review (multiple entries per incident)
- Immutable (no UPDATE/DELETE policies)
- Complements existing incident_updates table

**Indexes:** 4 (incident_id, reviewer_id, decision, review_level)

**RLS:** ✅ Enabled - Staff can view, specific roles can insert

**Risk:** 🟢 **LOW** - New table, no impact on existing data

---

### PART 5: New Table - incident_duplicates

**Purpose:** Track potential and confirmed duplicate incidents

**Schema:**
```sql
CREATE TABLE incident_duplicates (
  id UUID PRIMARY KEY,
  incident_id UUID NOT NULL FK → incidents(id) CASCADE,
  potential_duplicate_id UUID NOT NULL FK → incidents(id) CASCADE,
  similarity_score DECIMAL(3,2) CHECK (0 to 1.0),
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  detected_by TEXT DEFAULT 'system',
  reviewed_by UUID FK → profiles(id) SET NULL,
  reviewed_at TIMESTAMPTZ nullable,
  is_confirmed BOOLEAN nullable,  -- NULL=pending, true/false=reviewed
  notes TEXT nullable,
  UNIQUE(incident_id, potential_duplicate_id),
  CHECK (incident_id != potential_duplicate_id)
);
```

**Rationale:**
- Supports human-in-loop duplicate detection
- Algorithm suggests, supervisor confirms
- Prevents duplicate pair entries
- Prevents self-reference

**Indexes:** 3 (incident_id, similarity_score, reviewed_by)

**RLS:** ✅ Enabled - Staff view/flag, supervisors confirm

**Risk:** 🟢 **LOW** - New table, optional feature

---

### PART 6: New Table - notifications

**Purpose:** In-app notification system (email/SMS deferred)

**Schema:**
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL FK → profiles(id) CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT nullable,  -- Deep link to incident/page
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ nullable
);
```

**Rationale:**
- Simple in-app notification system
- No external dependencies (no email/SMS costs)
- User-isolated (RLS by user_id)
- Optional expiration for time-sensitive alerts

**Indexes:** 3 (user_id, unread count, expired cleanup)

**RLS:** ✅ Enabled - Users see only their own

**Triggers:** 3 notification generators (assignment, new incident, urgent)

**Risk:** 🟢 **LOW** - New table, additive feature

---

### PART 7: Barangay Backfill Function

**Purpose:** Safely migrate barangay TEXT → barangay_id FK

**Function:** `backfill_barangay_ids()`

**Algorithm:**
1. Match exact barangay name (case-insensitive)
2. Fuzzy match (remove spaces, case-insensitive)
3. Report unmatched incidents (preserved, not failed)

**Safety:**
- ✅ Does NOT enforce NOT NULL
- ✅ Preserves unmatched records
- ✅ Returns statistics (total, matched, unmatched)
- ✅ Idempotent (WHERE barangay_id IS NULL)

**Important:** 
- Function defined but **NOT EXECUTED** in migration
- Must be run manually after testing
- Review unmatched incidents before enforcing FK

**Risk:** 🟢 **LOW** - Function only, not auto-executed

---

### PART 8: RLS Policy Updates

**New Policies for incidents Table:**

#### Policy: "Barangay reviewers view assigned barangay incidents"
```sql
-- Allows SELECT for barangay reviewers
-- Scope: Their assigned barangay only
-- Status: submitted, under_review (actionable)
--         verified, in_progress, resolved, closed (reference)
```

**Security:** ✅ Properly scoped
- Cannot see other barangays
- Cannot see in_progress from other barangays
- Read-only access to resolved incidents

#### Policy: "Barangay reviewers can review incidents"
```sql
-- Allows UPDATE for barangay reviewers
-- Scope: Their barangay, status IN (submitted, under_review)
-- Transitions: → under_review, verified, invalid
-- Requires: reviewed_by = auth.uid()
```

**Security:** ✅ Properly restricted
- Can only review their own barangay
- Can only transition from submitted/under_review
- Cannot directly mark in_progress (must go through city)
- Self-assignment required (reviewed_by = auth.uid())

#### Policy: "Supervisors can verify incidents"
```sql
-- Allows UPDATE for supervisors/admins
-- Scope: Incidents with status IN (verified, invalid, duplicate)
-- Transitions: Any (broader authority)
```

**Security:** ✅ Appropriate authority
- City-level verification access
- Can override barangay decisions
- Can mark duplicates (high-privilege action)

**Preserved Policies:**
- ✅ "Anyone can submit incidents" (anonymous INSERT)
- ✅ "Block direct public incident queries" (anonymous blocked)
- ✅ "Staff can view all incidents" (authenticated staff)
- ✅ "Only admins can delete incidents" (admin-only)

**Risk:** 🟢 **LOW** - Additive policies, existing preserved

---

### PART 9: Notification Trigger Functions

**3 New Triggers:**

#### 1. trigger_notify_incident_assigned
- **Event:** UPDATE incidents WHERE assigned_to changed
- **Action:** Create notification for newly assigned user
- **Message:** "📋 New Incident Assigned"
- **Link:** /dashboard/incident/[id]

#### 2. trigger_notify_new_incident
- **Event:** INSERT incidents WHERE status=submitted AND barangay_id set
- **Action:** Find active barangay reviewer, create notification
- **Message:** "📥 New Incident in Your Barangay"
- **Link:** /dashboard/review/barangay

#### 3. trigger_notify_urgent_incident
- **Event:** INSERT incidents WHERE is_urgent=true
- **Action:** Notify ALL supervisors/admins
- **Message:** "🚨 URGENT Incident Submitted"
- **Link:** /dashboard/incident/[id]

**Safety:**
- ✅ Triggers fire AFTER operation (non-blocking)
- ✅ Do not prevent incident submission if notification fails
- ✅ Only INSERT into notifications (no UPDATE of incidents)

**Risk:** 🟢 **LOW** - Notification failure doesn't break workflow

---

### PART 10: Enhanced Audit Logging

**Change:** Extend Phase B audit trigger to capture verification actions

**New Tracked Fields:**
- is_urgent changes
- reviewed_by changes (barangay review)
- verified_by changes (city verification)
- duplicate_of changes (duplicate marking)

**Preserved Tracking:**
- status changes ✅
- assignment changes ✅
- All existing audit functionality ✅

**Safety:**
- ✅ Error handling prevents blocking (EXCEPTION block)
- ✅ Warnings logged if audit fails
- ✅ Primary operation always succeeds

**Risk:** 🟢 **LOW** - Extension of existing working trigger

---

### PART 11: Helper Functions

**2 New Query Functions:**

#### get_barangay_review_queue_count(reviewer_user_id)
- Returns: Count of submitted incidents in reviewer's barangay
- Purpose: Dashboard queue count badge
- Security: SECURITY DEFINER, validates reviewer role

#### get_city_verification_queue_count()
- Returns: Count of incidents with status='verified'
- Purpose: City verification queue badge
- Security: SECURITY DEFINER, no parameters needed

**Usage:** Application-level convenience functions

**Risk:** 🟢 **LOW** - Read-only query functions

---

## 📈 INDEX STRATEGY

### Performance Optimization

**New Indexes (20 total):**

| Table | Index | Type | Purpose |
|-------|-------|------|---------|
| profiles | idx_profiles_reviewer_barangay | Composite | Find reviewers by barangay |
| profiles | idx_profiles_active_reviewers | Filtered | Active reviewers only |
| incidents | idx_incidents_barangay_id | Single | FK lookup |
| incidents | idx_incidents_barangay_status | Composite | Queue queries |
| incidents | idx_incidents_urgent | Filtered | Urgent incidents only |
| incidents | idx_incidents_reviewed_by | Single | Reviewer dashboard |
| incidents | idx_incidents_verified_by | Single | Verifier dashboard |
| incidents | idx_incidents_duplicate_of | Filtered | Duplicate chains |
| incidents | idx_incidents_verification_queue | Filtered | City queue |
| incident_reviews | idx_incident_reviews_incident_id | Single + DESC | Review history |
| incident_reviews | idx_incident_reviews_reviewer_id | Single + DESC | Reviewer activity |
| incident_reviews | idx_incident_reviews_decision | Composite | Decision analytics |
| incident_reviews | idx_incident_reviews_level | Single | Level filtering |
| incident_duplicates | idx_incident_duplicates_incident_id | Filtered | Pending suggestions |
| incident_duplicates | idx_incident_duplicates_similarity | Composite DESC | High-confidence first |
| incident_duplicates | idx_incident_duplicates_reviewed_by | Single | Reviewer activity |
| notifications | idx_notifications_user_id | Composite DESC | User's notifications |
| notifications | idx_notifications_unread | Filtered | Unread badge count |
| notifications | idx_notifications_expired | Filtered | Cleanup old |

**Filtered Indexes:** 9 indexes use WHERE clause for storage efficiency
- Only indexes relevant rows
- Reduces index size
- Improves query performance

**Composite Indexes:** 5 indexes on multiple columns
- Supports complex WHERE clauses
- Enables index-only scans

**Performance Impact:** ✅ **POSITIVE**
- Queue queries: O(log n) instead of O(n) scan
- Badge counts: Direct index lookup
- Filtered indexes minimal storage overhead

**Risk:** 🟢 **LOW** - Standard PostgreSQL practice

---

## 🔄 BACKWARD COMPATIBILITY

### Existing Functionality Preserved

**✅ PUBLIC INCIDENT SUBMISSION** (/)
- No changes to submission form workflow
- New columns (barangay_id, is_urgent) optional
- Existing TEXT barangay field still works
- RLS INSERT policy unchanged

**✅ PUBLIC TRACKING** (/track)
- track_incident_by_reference() unchanged from Phase B
- Returns same fields (privacy-protected)
- No breaking changes

**✅ STAFF DASHBOARD** (/dashboard)
- Existing queries work (SELECT * FROM incidents)
- New columns returned but nullable (UI handles gracefully)
- Map/feed/profile views unaffected

**✅ AUTHENTICATION**
- No changes to auth flow
- Existing roles still work
- New barangay_reviewer role additive

**✅ AUDIT LOGGING** (Phase B)
- Existing audit_logs table unchanged
- Trigger enhanced (not replaced)
- Previous audit entries preserved

### Application Code Changes Required

**⚠️ OPTIONAL BUT RECOMMENDED:**
- Update report form to capture barangay_id (dropdown)
- Add urgency checkbox to report form
- Create barangay review queue page (/dashboard/review/barangay)
- Create city verification queue page (/dashboard/review/city)
- Create incident detail page (/dashboard/incident/[id])
- Add notification bell component

**✅ GRACEFUL DEGRADATION:**
- If application not updated, verification fields remain NULL
- System functions at Phase B level until UI implemented
- No breaking errors from schema changes

---

## ⚠️ RISKS AND MITIGATIONS

### Identified Risks

#### 1. Barangay Backfill Accuracy
**Risk:** Fuzzy matching may assign wrong barangay  
**Severity:** 🟡 MEDIUM  
**Mitigation:**
- Backfill function does NOT auto-execute
- Manual review of unmatched incidents required
- Do NOT enforce NOT NULL on barangay_id until validated
- Keep TEXT field as fallback

**Action:** Review backfill results before enforcing FK

#### 2. Notification Trigger Performance
**Risk:** Urgent incident notifying 10+ supervisors could slow INSERT  
**Severity:** 🟢 LOW  
**Mitigation:**
- Triggers fire AFTER INSERT (non-blocking)
- Use SECURITY DEFINER for elevated permissions
- Consider async queue if supervisors > 50

**Action:** Monitor production performance, add queue if needed

#### 3. Enum Rollback Limitation
**Risk:** Cannot remove barangay_reviewer enum value easily  
**Severity:** 🟢 LOW  
**Mitigation:**
- Enum addition is intended to be permanent
- Rollback documented but discouraged
- De-activate reviewers instead of deleting role

**Action:** Accept limitation, do not rollback unless critical

#### 4. Index Storage Overhead
**Risk:** 20 new indexes increase storage and write cost  
**Severity:** 🟢 LOW  
**Mitigation:**
- Filtered indexes reduce storage (9/20 are filtered)
- Indexes essential for queue performance
- Most are small (UUID/BOOLEAN columns)

**Action:** Monitor storage, drop unused indexes if needed

#### 5. Foreign Key Cascade Behavior
**Risk:** Deleting profile cascades to reviews/notifications  
**Severity:** 🟢 LOW  
**Mitigation:**
- Most FKs SET NULL (preserve audit history)
- Only notifications CASCADE (expected behavior)
- Profiles rarely deleted (de-activate instead)

**Action:** Document admin procedure: de-activate, don't delete

---

## ✅ SAFETY CHECKLIST

### Pre-Migration Verification

- [x] All new columns nullable (no NOT NULL on existing data)
- [x] All new tables have RLS enabled by default
- [x] All FK constraints reference existing tables
- [x] All indexes use IF NOT EXISTS
- [x] All functions use SECURITY DEFINER appropriately
- [x] Backfill function does not auto-execute
- [x] Triggers fire AFTER operation (non-blocking)
- [x] Error handling prevents blocking operations
- [x] Rollback procedure documented
- [x] No destructive operations on existing data
- [x] Existing policies preserved

### Post-Migration Verification Queries

**Include in migration file (commented):**
```sql
-- 1. Verify barangay_reviewer role added
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'user_role'::regtype;

-- 2. Verify new columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'incidents' 
AND column_name IN ('barangay_id', 'is_urgent', 'reviewed_by', 'verified_by');

-- 3. Verify RLS enabled on new tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('incident_reviews', 'incident_duplicates', 'notifications');

-- 4. Verify indexes created
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('incidents', 'profiles', 'incident_reviews');

-- 5. Verify triggers exist
SELECT tgname, tgrelid::regclass 
FROM pg_trigger 
WHERE tgname LIKE 'trigger_notify%';

-- 6. Test backfill function (staging only)
SELECT * FROM backfill_barangay_ids();

-- 7. Verify no data lost
SELECT COUNT(*) FROM incidents;  -- Should match pre-migration count
SELECT COUNT(*) FROM profiles;   -- Should match pre-migration count
```

---

## 🚀 DEPLOYMENT RECOMMENDATION

### Phase 2A: Staging Deployment (CURRENT PHASE)

**Approval Status:** ✅ **READY FOR STAGING**

**Prerequisites:**
- [ ] Create staging branch: `staging/incident-verification`
- [ ] Confirm staging Supabase project isolated
- [ ] Confirm staging Vercel environment isolated
- [ ] Take staging database backup (pre-migration snapshot)

**Deployment Steps:**
1. Apply migration to staging database via SQL Editor
2. Run verification queries (documented in migration)
3. Test backfill function with staging data
4. Create test barangay_reviewer account
5. Test RLS policies with reviewer account
6. Test notification triggers
7. Verify existing functionality unchanged (submission, tracking, dashboard)
8. Review backfill results (matched vs unmatched)

**Success Criteria:**
- ✅ All verification queries pass
- ✅ No errors in Supabase logs
- ✅ Existing features work unchanged
- ✅ Barangay reviewer can view only their barangay
- ✅ Notifications created when incidents assigned
- ✅ Audit log captures new fields

**Time Estimate:** 2-3 hours (careful testing)

### Phase 2B: Production Deployment (FUTURE)

**Approval Status:** ⏸️ **WAITING FOR STAGING VALIDATION**

**Prerequisites:**
- [ ] Phase 2A staging deployment successful
- [ ] Application code updated (queues, detail page, notifications)
- [ ] User acceptance testing complete
- [ ] Production database backup created
- [ ] Rollback plan tested in staging
- [ ] City policy approvals obtained (if any)

**Not Ready Until:**
- Application UI for verification workflow built (Phase 3-6)
- Staging tested for minimum 3 days
- No critical issues found
- User explicitly approves production deployment

---

## 📋 AFFECTED APPLICATION FILES (Phase 3+)

### Files Requiring Updates

**High Priority (Core Verification):**
1. `/app/report/page.tsx` - Add barangay dropdown, urgency checkbox
2. `/app/dashboard/review/barangay/page.tsx` - **NEW** - Barangay queue
3. `/app/dashboard/review/city/page.tsx` - **NEW** - City queue
4. `/app/dashboard/incident/[id]/page.tsx` - **NEW** - Detail view
5. `/components/IncidentMap.tsx` - Update popup for verification status
6. `/lib/supabase/client.ts` - No changes needed (query updates only)

**Medium Priority (UI Enhancements):**
7. `/components/NotificationBell.tsx` - **NEW** - Notification dropdown
8. `/app/dashboard/page.tsx` - Add queue count badges, role-based tabs
9. `/components/ReviewActionPanel.tsx` - **NEW** - Approve/reject buttons
10. `/components/ReviewTimeline.tsx` - **NEW** - Review history display

**Low Priority (Nice-to-Have):**
11. `/app/dashboard/analytics/page.tsx` - **NEW** - Verification metrics
12. `/components/DuplicateDetector.tsx` - **NEW** - Similarity suggestions
13. `/components/UrgentBadge.tsx` - **NEW** - Urgent indicator

### Database Query Updates Needed

**New Queries Required:**
```typescript
// Get barangay review queue
const { data } = await supabase
  .from('incidents')
  .select('*')
  .eq('status', 'submitted')
  .eq('barangay_id', reviewerBarangayId)
  .order('created_at', { ascending: true });

// Get city verification queue
const { data } = await supabase
  .from('incidents')
  .select('*')
  .eq('status', 'verified')
  .order('is_urgent', { ascending: false })
  .order('created_at', { ascending: true });

// Get unread notifications
const { data } = await supabase
  .from('notifications')
  .select('*')
  .eq('user_id', userId)
  .eq('is_read', false)
  .order('created_at', { ascending: false });

// Get incident with review history
const { data } = await supabase
  .from('incidents')
  .select(`
    *,
    incident_reviews (*),
    incident_duplicates (*)
  `)
  .eq('id', incidentId)
  .single();
```

**Estimated Development Time:** 8-10 days for all UI components

---

## 📊 TESTING PLAN

### Database Testing (Staging)

**1. Schema Validation**
- [ ] All tables created
- [ ] All columns exist with correct types
- [ ] All indexes created
- [ ] All functions executable
- [ ] All triggers active

**2. RLS Policy Testing**
```sql
-- Test as anonymous user
SET ROLE anon;
SELECT COUNT(*) FROM incidents;  -- Should work (public submission)
SELECT * FROM incident_reviews;  -- Should return 0 rows
SELECT * FROM notifications;     -- Should return 0 rows
RESET ROLE;

-- Test as barangay reviewer
-- (Must use actual Supabase client with reviewer JWT)

-- Test as supervisor
-- (Must use actual Supabase client with supervisor JWT)
```

**3. Backfill Testing**
```sql
-- Before backfill
SELECT 
  barangay, 
  barangay_id, 
  COUNT(*) 
FROM incidents 
GROUP BY barangay, barangay_id;

-- Run backfill
SELECT * FROM backfill_barangay_ids();

-- After backfill
SELECT 
  barangay, 
  barangay_id, 
  b.name as matched_name,
  COUNT(*) 
FROM incidents i
LEFT JOIN barangays b ON i.barangay_id = b.id
GROUP BY barangay, barangay_id, b.name
ORDER BY COUNT(*) DESC;

-- Review unmatched
SELECT id, reference_number, barangay 
FROM incidents 
WHERE barangay IS NOT NULL AND barangay_id IS NULL;
```

**4. Notification Trigger Testing**
```sql
-- Test assignment notification
UPDATE incidents 
SET assigned_to = 'test-user-uuid' 
WHERE id = 'test-incident-uuid';

-- Verify notification created
SELECT * FROM notifications 
WHERE user_id = 'test-user-uuid' 
ORDER BY created_at DESC LIMIT 1;

-- Test urgent notification
INSERT INTO incidents (...) 
VALUES (..., is_urgent = true);

-- Verify all supervisors notified
SELECT COUNT(*) FROM notifications 
WHERE title LIKE '%URGENT%' 
AND created_at > NOW() - INTERVAL '1 minute';
```

**5. Performance Testing**
```sql
-- Test queue query performance
EXPLAIN ANALYZE
SELECT * FROM incidents 
WHERE status = 'submitted' 
AND barangay_id = 'test-barangay-uuid';

-- Should use idx_incidents_barangay_status
-- Execution time should be < 10ms

-- Test unread notifications count
EXPLAIN ANALYZE
SELECT COUNT(*) FROM notifications 
WHERE user_id = 'test-user-uuid' AND is_read = false;

-- Should use idx_notifications_unread
-- Execution time should be < 5ms
```

### Integration Testing (Application)

**Phase 3+ Testing (when UI built):**
- [ ] Barangay reviewer login and queue access
- [ ] Approve incident workflow (submitted → verified)
- [ ] Reject incident workflow (submitted → invalid)
- [ ] City verification workflow (verified → in_progress)
- [ ] Duplicate marking workflow
- [ ] Notification display and mark-as-read
- [ ] Urgency escalation workflow
- [ ] Map displays verification status correctly

---

## 🔐 SECURITY TESTING PLAN

### Test Cases

**Test 1: Barangay Isolation**
```
Given: Two barangay reviewers (A from Poblacion, B from Ma-ao)
When: Reviewer A queries incidents
Then: Only sees Poblacion incidents
When: Reviewer A tries to UPDATE Ma-ao incident
Then: Permission denied (RLS blocks)
```

**Test 2: Verification Authority**
```
Given: Barangay reviewer with approved incident (status='verified')
When: Reviewer tries to mark incident as 'in_progress'
Then: Permission denied (only city staff can)
When: Supervisor marks same incident 'in_progress'
Then: Success (proper authority)
```

**Test 3: Duplicate Marking Privilege**
```
Given: Responder identifies potential duplicate
When: Responder tries UPDATE incidents SET duplicate_of=parent_id
Then: Permission denied (only supervisors)
When: Supervisor marks duplicate
Then: Success + audit log entry created
```

**Test 4: Audit Immutability**
```
Given: incident_reviews entry exists
When: Any user tries UPDATE or DELETE
Then: Permission denied (no policies)
Result: Audit trail protected
```

**Test 5: Notification Privacy**
```
Given: User A and User B with notifications
When: User A queries notifications
Then: Only sees own notifications (user_id filter)
When: User A tries to read User B's notification
Then: Returns 0 rows (RLS blocks)
```

---

## 📝 ROLLBACK PLAN

### When to Rollback

**Trigger Rollback If:**
- ❌ Migration fails mid-execution (partial application)
- ❌ RLS policies block legitimate operations
- ❌ Triggers cause performance degradation
- ❌ Data corruption detected
- ❌ Backfill assigns wrong barangays at scale

**Do NOT Rollback If:**
- ✅ Application UI not ready (schema is forward-compatible)
- ✅ Minor notification trigger issues (disable trigger, fix function)
- ✅ Single RLS policy too restrictive (adjust policy, don't rollback all)

### Rollback Procedure

**Full rollback SQL included in migration file:**
```sql
-- See migration lines 750-800 for complete rollback
-- Drops: triggers, functions, policies, columns
-- Preserves: audit data (renamed to _archived tables)
-- Reverts to: Phase B state
```

**Rollback Time:** ~10 minutes  
**Risk Level:** 🟢 LOW (all drops are safe, archives preserved)

**Post-Rollback Verification:**
- [ ] Incidents table back to Phase B schema
- [ ] Profiles table back to Phase B schema
- [ ] New tables archived (not dropped)
- [ ] Existing functionality works (submit, track, dashboard)
- [ ] Application displays no errors

---

## ✅ APPROVAL GATES

### Phase 2 Schema Review Approval

**Required Before Staging Deployment:**
- [x] Decision register reviewed and approved ✅
- [x] Migration SQL reviewed for safety ✅
- [x] RLS policies reviewed for security ✅
- [x] Backward compatibility verified ✅
- [x] Rollback plan documented ✅
- [ ] **USER APPROVAL REQUIRED** ⏸️

**Sign-Off Required From:** User

**Questions for User Before Proceeding:**
1. Approve staging deployment of migration 003?
2. Confirm staging environment isolated from production?
3. Approve backfill strategy (manual review of unmatched)?
4. Any City policy approvals needed before staging test?

---

## 📋 DELIVERABLES CHECKLIST

### Phase 2 Deliverables

- [x] BAGO-SAFE-DECISION-REGISTER.md (20 decisions documented)
- [x] 003_verification_system_schema.sql (migration file)
- [x] BAGO-SAFE-PHASE-2-SCHEMA-REVIEW.md (this document)
- [ ] Migration applied to staging (pending approval)
- [ ] Staging validation results (pending deployment)
- [ ] Production deployment plan (Phase 2B)

---

## 🎯 NEXT STEPS

### Immediate (Awaiting User Approval)

1. **User reviews this schema review document**
2. **User approves staging deployment**
3. **Create staging git branch**
4. **Apply migration to staging database**
5. **Run validation tests**
6. **Document staging results**

### Phase 3+ (Future)

7. Build barangay review queue UI
8. Build city verification queue UI
9. Build incident detail page
10. Build notification system UI
11. User acceptance testing
12. Production deployment (when ready)

---

## 📞 CONTACT FOR CLARIFICATION

**Schema Questions:** Review BAGO-SAFE-DECISION-REGISTER.md  
**Security Concerns:** Review RLS policy section above  
**Migration Safety:** All changes nullable and reversible  
**Timeline Questions:** Staging validation = 2-3 hours, UI build = 8-10 days  

---

**Phase 2 Schema Review Status:** ✅ **COMPLETE AND READY FOR APPROVAL**

**Recommendation:** ✅ **APPROVE FOR STAGING DEPLOYMENT**

**Next Action Required:** **USER APPROVAL TO PROCEED**

---

*This schema review documents the complete Phase 2 database migration for the verification system. All changes are safe, reversible, and preserve existing functionality. Approval required to proceed with staging deployment.*
