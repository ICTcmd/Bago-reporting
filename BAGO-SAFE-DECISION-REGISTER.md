# BAGO SAFE — DECISION REGISTER
## Master Implementation: Incident Verification System

**Date:** October 26, 2026  
**Phase:** Phase 2 - Database Schema Extensions  
**Approval:** Proceed with recommended technical decisions  
**Authority:** User approved proceeding with Kiro's technical recommendations

---

## DECISION FRAMEWORK

### Classification Levels

**🟢 TECHNICAL DEFAULT** - Safe, reversible, standard practice. Proceed with implementation.

**🟡 CITY POLICY REQUIRED** - Affects emergency response, public disclosure, or City operations. Document for City approval before enabling behavior.

**🔴 DEFERRED** - Requires external coordination or insufficient information. Document as future work.

---

## DECISION LOG

### Q1: Barangay Field - TEXT vs Foreign Key

**Question:** Should `incidents.barangay` remain TEXT or migrate to FK `barangay_id`?

**🟢 DECISION: Migrate to Foreign Key with Safe Backfill**

**Rationale:**
- **Data Integrity:** FK constraint prevents typos and ensures referential integrity
- **Query Performance:** Indexed UUID joins faster than text matching
- **Future-Proof:** Enables barangay-level features (boundaries, assignments, statistics)
- **Backward Compatible:** Can preserve existing TEXT field for display/fallback

**Technical Approach:**
1. Add new `barangay_id UUID REFERENCES barangays(id)` column (nullable initially)
2. Create backfill function that fuzzy-matches existing text to barangay names
3. **Do NOT enforce NOT NULL yet** - preserve existing records
4. Add validation that new submissions must provide valid barangay_id
5. Keep TEXT field as fallback for edge cases
6. Migration is **reversible** - can drop FK column without data loss

**Security Implications:**
- RLS policies must check both barangay_id (new) and barangay TEXT (legacy)
- Query performance improves (indexed lookups)
- No privacy impact - barangay is non-sensitive administrative boundary

**Implementation Impact:**
- Database: One new column, one backfill function, one new index
- Application: Update report form to use barangay dropdown (UUID selection)
- RLS: Update policies to check `barangay_id` alongside `barangay` TEXT

**Dependencies:** 
- Requires barangays table (✅ already exists with 24 entries)
- Requires fuzzy matching logic for backfill

**Status:** ✅ Proceed as technical default

---

### Q2: Urgency Field Type - Boolean vs Enum

**Question:** Should urgency be boolean `is_urgent` or enum with levels?

**🟢 DECISION: Boolean `is_urgent` for Simplicity**

**Rationale:**
- **Simplicity:** Binary urgent/non-urgent aligns with escalation workflow
- **Clear Semantics:** "Urgent" has operational meaning (bypass barangay review)
- **Distinct from Severity:** incident_severity already exists (low/medium/high/critical)
- **Easier Filtering:** Boolean indexing and queries simpler than enum
- **Future Extensible:** Can add enum later if City defines urgency levels

**Technical Approach:**
1. Add `is_urgent BOOLEAN DEFAULT false` to incidents table
2. Add index: `CREATE INDEX idx_incidents_urgent ON incidents(is_urgent) WHERE is_urgent = true` (partial index for performance)
3. Default to `false` for all existing records (safe)
4. Allow reporters to check "This is urgent" box on submission form
5. Urgent incidents skip barangay review, go directly to city verification

**Security Implications:**
- No privilege escalation - marking urgent doesn't bypass verification
- Audit log captures who marks incidents urgent
- Staff can override urgency flag if abused

**Escalation Behavior (🟡 CITY POLICY):**
- **What constitutes urgent?** (e.g., active fire, medical emergency, imminent threat)
- **Response time expectations?** (Do not promise SLAs without City approval)
- **After-hours notification?** (Requires City communication infrastructure)

**Implementation Impact:**
- Database: One boolean column, one partial index
- Application: Checkbox on report form, visual indicator (🚨) in queues
- RLS: No policy changes needed

**Status:** ✅ Proceed with field implementation  
**Deferred:** Urgency definitions and response procedures require City policy approval

---

### Q3: Verification Status - New Field vs Existing Status Enum

**Question:** Add separate `verification_status` field or use existing `incident_status` enum?

**🟢 DECISION: Use Existing `incident_status` Enum with New Values**

**Rationale:**
- **Single Source of Truth:** Avoids conflicting state (status=verified but verification_status=pending)
- **Existing Infrastructure:** RLS policies, audit triggers, UI already reference `status`
- **Clearer Workflow:** Linear state machine easier to understand and enforce
- **Existing Audit:** status changes already logged in audit_logs

**Technical Approach:**
1. **Do NOT add new enum values yet** - existing statuses sufficient:
   - `submitted` → Pending barangay review
   - `under_review` → Barangay reviewer assigned
   - `verified` → City verification approved (ready for publication)
   - `in_progress` → Responder handling (post-verification)
   - `resolved` → Incident addressed
   - `closed` → Final state
   - `invalid` → Rejected by verifier
   - `duplicate` → Marked as duplicate
2. Add **tracking fields** to capture review/verification metadata:
   - `reviewed_by UUID` - Barangay reviewer who approved
   - `reviewed_at TIMESTAMPTZ` - When barangay review completed
   - `verified_by UUID` - City staff who verified
   - `verified_at TIMESTAMPTZ` - When city verification completed
3. Use `incident_reviews` table for detailed review history

**Security Implications:**
- Status transitions validated by RLS policies
- Cannot skip from `submitted` → `verified` without review
- Audit log captures all status changes with actor

**Implementation Impact:**
- Database: No enum changes, add 4 timestamp/FK fields
- Application: Status-based queue filtering works as-is
- RLS: Existing status-based policies reusable

**Status:** ✅ Proceed as technical default

---

### Q4: Barangay Reviewer Scope - What Can They See?

**Question:** Should barangay reviewers see only submitted incidents or also resolved ones?

**🟢 DECISION: Submitted + Their Barangay's Resolved (Read-Only Reference)**

**Rationale:**
- **Need-to-Know:** Reviewers need submitted incidents to perform their role
- **Context:** Seeing resolved incidents helps identify patterns and duplicates
- **Privacy:** Resolved incidents from other barangays not visible (least privilege)
- **Audit Trail:** Reviewers cannot modify resolved incidents, only view

**Technical Approach:**
RLS Policy for barangay reviewers:
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
      AND (
        -- Can see incidents from their barangay
        (incidents.barangay_id = b.id OR incidents.barangay = b.name)
        AND (
          -- Submitted/under_review (need to act)
          incidents.status IN ('submitted', 'under_review')
          OR
          -- Resolved/closed (reference only)
          incidents.status IN ('resolved', 'closed', 'verified', 'invalid', 'duplicate')
        )
      )
    )
  );
```

**Security Implications:**
- Reviewers cannot see incidents from other barangays
- Reviewers cannot see in_progress incidents (operational, not their concern)
- Prevents data mining across barangays

**Implementation Impact:**
- Database: RLS policy on incidents table
- Application: Queue shows submitted first, resolved in separate tab

**Status:** ✅ Proceed as technical default

---

### Q5: Multiple Roles - Can User Have Both Reviewer and Responder?

**Question:** Can a user profile have multiple roles simultaneously?

**🟢 DECISION: Single Primary Role with Explicit Secondary Permissions**

**Rationale:**
- **Existing Architecture:** `profiles.role` is single enum, not array
- **Separation of Duties:** Reviewer and responder are different responsibilities
- **Audit Clarity:** Actor's role at decision time must be unambiguous
- **Migration Safety:** Preserves existing authorization architecture

**Technical Approach:**
1. Keep `profiles.role` as single enum (no migration disruption)
2. Add optional `profiles.secondary_roles TEXT[]` for future extensibility
3. Primary role determines default dashboard view and permissions
4. RLS policies check primary role for authorization
5. If multi-role needed later, use array contains checks

**Current Role Assignments:**
- `citizen` - Default for public (currently unused - anon submits)
- `responder` - Field staff handling verified incidents
- `supervisor` - Can verify incidents, view audit logs, create announcements
- `admin` - Full system access
- `barangay_reviewer` - **NEW** - Review incidents from assigned barangay

**Implementation Impact:**
- Database: Add barangay_reviewer to enum, optionally add secondary_roles array
- Application: Role-based UI rendering uses primary role
- RLS: Policies check `role = 'barangay_reviewer'`

**Status:** ✅ Proceed as technical default

---

### Q6: Self-Review - Can Supervisors Verify Their Own Barangay?

**Question:** Can city supervisors verify incidents from their home barangay?

**🟢 DECISION: Allow with Audit Logging (No Technical Restriction)**

**Rationale:**
- **Small City Reality:** Bago City has 24 barangays, requiring all supervisors creates bottlenecks
- **Transparency:** Audit log captures if supervisor verifies their own barangay
- **Trust-Based:** City can review audit logs for conflicts of interest if needed
- **Escalation Available:** Supervisors can self-assign to other supervisor if conflict

**Technical Approach:**
1. **No RLS restriction** preventing same-barangay verification
2. Audit log captures:
   - Verifier's profile.assigned_barangay (if they have one)
   - Incident's barangay_id
   - Can query for same-barangay verifications if City wants to review
3. UI can show indicator: "⚠️ Verifying own barangay"

**City Policy Consideration (🟡):**
- Does City want to prohibit self-verification?
- Should high-value/sensitive incidents require different-barangay verifier?
- This is documented but not technically enforced

**Implementation Impact:**
- Database: No restrictions added
- Application: Indicator shown, but not blocking
- Audit: Logged for City review

**Status:** ✅ Proceed with no technical restriction, log for City review

---

### Q7: Escalation Path - Direct to In-Progress or Must Pass City?

**Question:** Can barangay reviewers escalate directly to `in_progress` or must go through city verification?

**🟢 DECISION: Must Pass City Verification (No Direct Escalation)**

**Rationale:**
- **Accountability:** City maintains verification authority
- **Quality Control:** Prevents inappropriate incidents reaching public map
- **Audit Trail:** Clear chain of approval (barangay → city → responder)
- **Fraud Prevention:** Barangay reviewers cannot bypass oversight

**Technical Approach:**
Valid status transitions:
```
submitted → under_review (barangay reviewer assigns self)
under_review → verified (barangay approves, enters city queue)
under_review → invalid (barangay rejects with reason)
verified → in_progress (city verifies, assigns responder)
verified → duplicate (city marks duplicate)
verified → invalid (city rejects barangay approval)
in_progress → resolved
resolved → closed
```

Enforce via RLS UPDATE policies:
- Barangay reviewers can: `submitted` → `under_review`, `under_review` → `verified/invalid`
- City staff can: `verified` → `in_progress/invalid/duplicate`
- Responders can: `in_progress` → `resolved`
- Supervisors can: `resolved` → `closed`

**Security Implications:**
- Prevents privilege escalation
- Each role has limited state transitions
- Attempts to skip states logged in audit_logs

**Implementation Impact:**
- Database: RLS policies enforce state machine
- Application: Action buttons shown based on current status + user role

**Status:** ✅ Proceed as technical default

---

### Q8: Duplicate Marking - Requires Supervisor or Any Staff?

**Question:** Who can mark an incident as duplicate?

**🟢 DECISION: Supervisor/Admin Only**

**Rationale:**
- **Irreversible Impact:** Marking duplicate hides original report
- **Accountability:** Requires judgment - may be similar but distinct incidents
- **Abuse Prevention:** Prevents dismissing valid reports inappropriately
- **Audit Trail:** High-privilege action requires high-privilege role

**Technical Approach:**
1. RLS policy allows duplicate marking only by supervisor/admin roles
2. Must provide `duplicate_of UUID` reference to parent incident
3. Duplicate incident status → `duplicate` (closed state)
4. `incident_duplicates` table tracks suggestion vs confirmation:
   - System suggests potential duplicates (similarity algorithm)
   - Supervisor confirms and marks official duplicate
5. Audit log captures duplicate marking with parent incident reference

**Security Implications:**
- Barangay reviewers can flag *potential* duplicates but not mark official
- Only supervisor can change status to `duplicate`
- Original reporter notified (if City implements notifications)

**Implementation Impact:**
- Database: RLS policy on incidents UPDATE, incident_duplicates table
- Application: "Mark as Duplicate" button only visible to supervisor/admin

**Status:** ✅ Proceed as technical default

---

### Q9: Rejection Permanence - Can Rejected Reports Be Reopened?

**Question:** Can rejected (`invalid`) incidents be reopened or corrected?

**🟢 DECISION: Preserve Report, Allow Re-Review via Authorized Procedure**

**Rationale:**
- **Mistake Correction:** Reviewers can make errors or lack information
- **Due Process:** Reporters deserve explanation and reconsideration path
- **Audit Preservation:** Cannot delete rejected reports (evidence of processing)
- **Controlled Process:** Re-review requires supervisor approval, not automatic

**Technical Approach:**
1. Status `invalid` is **not final** - can transition back to `under_review`
2. Re-review requires:
   - Supervisor creates incident_update with reason
   - Status changes: `invalid` → `under_review` (returns to queue)
   - Audit log captures who authorized re-review and why
3. Rejection reason preserved in `incident_reviews.rejection_reason`
4. Reporter can submit additional information via tracking page (future feature)

**Valid Re-Review Transitions:**
```
invalid → under_review (supervisor re-opens with justification)
under_review → verified (if new information validates incident)
```

**Security Implications:**
- Only supervisor/admin can re-open rejected incidents
- Audit log captures all re-review decisions
- Prevents repeated rejection/approval cycles (logged for City review)

**Implementation Impact:**
- Database: RLS policy allows supervisor to update `invalid` → `under_review`
- Application: "Re-open for Review" button on rejected incidents (supervisor only)

**Status:** ✅ Proceed as technical default

---

### Q10: Notification Channels - Email, SMS, Push, In-App?

**Question:** What notification channels should be implemented?

**🟡 DECISION: In-App Only (Email/SMS Require City Approval)**

**Rationale:**
- **No External Dependencies:** In-app notifications use existing database
- **Cost Control:** Email/SMS incur costs and require service contracts
- **Privacy:** External notifications risk exposing incident details
- **Delivery Uncertainty:** Cannot guarantee email/SMS delivery without confirmation
- **After-Hours:** City must define after-hours procedures before 24/7 notifications

**Technical Approach (In-App Only):**
1. Create `notifications` table:
   ```sql
   CREATE TABLE notifications (
     id UUID PRIMARY KEY,
     user_id UUID REFERENCES profiles(id),
     title TEXT NOT NULL,
     message TEXT NOT NULL,
     link TEXT,  -- e.g., /dashboard/incident/[id]
     is_read BOOLEAN DEFAULT false,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```
2. Bell icon in dashboard header shows unread count
3. Notifications generated for:
   - New incident assigned to reviewer/responder
   - Status changes on assigned incidents
   - Urgent incident submitted (city staff)
4. RLS: Users see only their own notifications

**City Policy Required (🟡) for External Notifications:**
- **Email Service:** Which provider? (SendGrid, AWS SES, Mailgun?)
- **SMS Service:** Which provider? Requires budget approval
- **After-Hours Protocol:** Who receives urgent notifications outside business hours?
- **Escalation Tree:** If assigned staff doesn't respond, who's next?
- **Opt-In/Opt-Out:** Staff notification preferences
- **Rate Limiting:** Prevent notification spam
- **Delivery Confirmation:** Email read receipts, SMS delivery reports

**Implementation Impact:**
- Database: notifications table, RLS policies
- Application: Notification bell component, polling or real-time subscription
- External: Deferred until City approves service and budget

**Status:**  
✅ Proceed with in-app notifications  
🟡 Defer email/SMS until City policy approved

---

### Q11: Notification Triggers - When to Notify?

**Question:** What events should generate notifications?

**🟢 DECISION: Assignment-Based Notifications (Technical Default)**

**Rationale:**
- **Need-to-Know:** Only notify staff with responsibility for action
- **Reduce Noise:** Avoid notification fatigue
- **Clear Actions:** Each notification tied to specific user task

**Notification Events (In-App):**

| Event | Recipient | Trigger | Message |
|-------|-----------|---------|---------|
| **New Submission** | Assigned barangay reviewer | incident.status = 'submitted' AND incident.barangay_id matches | "New incident submitted in your barangay" |
| **Urgent Submission** | All city supervisors | incident.is_urgent = true | "🚨 Urgent incident requires verification" |
| **Barangay Approved** | City verification queue | incident.status = 'verified' | "Incident approved by barangay reviewer" |
| **City Verified** | Assigned responder | incident.assigned_to = user_id | "Incident assigned to you" |
| **Status Change** | Assigned user | incident.assigned_to = user_id AND status changes | "Incident status updated" |

**Not Implemented (Deferred):**
- ❌ Reporter notifications (requires contact info handling policy)
- ❌ Public notifications (requires City communication strategy)
- ❌ After-hours escalations (requires City emergency protocol)

**Implementation Impact:**
- Database: Notification records created by trigger functions
- Application: Poll notifications table every 30s or use Supabase real-time

**Status:** ✅ Proceed as technical default for assignment-based notifications

---

### Q12: Public Map - Show Unverified Incidents?

**Question:** Should unverified incidents appear on public map at all?

**🟡 DECISION: Yes, with "Pending Verification" Label (City Policy Required)**

**Rationale:**
- **Transparency:** Public wants to see all reports, not just verified
- **Duplicate Prevention:** Reporters can see similar recent incidents before submitting
- **Trust Building:** Showing verification status demonstrates City diligence
- **Privacy Protection:** Can limit details shown for unverified

**Technical Approach:**
Two-layer map rendering:
1. **Unverified Layer** (`status IN ('submitted', 'under_review')`)
   - Muted gray marker with ⏳ icon
   - Popup shows: Title + "Pending Verification" + Category + Barangay
   - **No description, no exact address, no reporter info**
   
2. **Verified Layer** (`status IN ('verified', 'in_progress', 'resolved')`)
   - Color-coded by severity (red/orange/yellow/blue)
   - Popup shows: Title + Status + Category + Severity + Barangay
   - Still no exact address/reporter info (privacy)

Filter control: "Show All | Verified Only"

**City Policy Consideration (🟡):**
- **Sensitive Incidents:** Should crime reports, medical emergencies appear before verification?
- **False Alarms:** Public may panic seeing unverified incidents
- **Liability:** City may be liable for displaying unverified information
- **Category Filtering:** Some categories always hidden until verified?

**Recommended Categories Always Hidden Until Verified:**
- `crime` - Law enforcement sensitivity
- `medical` - Patient privacy
- Any incident marked confidential (future field)

**Implementation Impact:**
- Database: Public tracking function needs `verification_status` indicator
- Application: Map filters by status, two marker styles
- RLS: Public SELECT allows submitted incidents with limited fields

**Status:**  
✅ Proceed with technical implementation of two-layer map  
🟡 Require City policy on sensitive category handling before public launch

---

### Q13: Unverified Detail Level - Title Only or More?

**Question:** What details shown for unverified incidents on public map?

**🟢 DECISION: Title + Category + Barangay Only**

**Rationale:**
- **Context:** Enough info to identify type and location
- **Privacy:** No description (may contain PII), no exact address
- **Duplicate Check:** Reporters can see similar recent incidents
- **Verification Incentive:** Public sees verification matters

**Unverified Incident Public Fields:**
```typescript
interface UnverifiedIncidentPublic {
  reference_number: string  // For tracking
  title: string             // Brief description
  category: string          // Type of incident
  barangay: string          // General location (not exact address)
  status: 'pending'         // Always shown as "Pending Verification"
  created_at: string        // Submission date
  // NOT SHOWN: description, address_text, coordinates, reporter info, severity
}
```

**Verified Incident Public Fields (Additional):**
```typescript
interface VerifiedIncidentPublic extends UnverifiedIncidentPublic {
  severity: string          // low/medium/high/critical
  status: string            // verified/in_progress/resolved
  // Still NOT SHOWN: exact address, reporter info, internal notes
}
```

**Implementation Impact:**
- Database: `track_incident_by_reference` already limits fields
- Need new function: `public_incidents_map_view()` with status-based field selection
- Application: Popup component checks verification status

**Status:** ✅ Proceed as technical default

---

### Q14: Verified Detail Level - Full or Still Limited?

**Question:** Should verified incidents on public map show more detail than unverified?

**🟢 DECISION: Show Severity + Status, But Not Exact Address**

**Rationale:**
- **Informed Public:** Verified severity helps public understand priority
- **Status Transparency:** Shows City is addressing incident
- **Privacy Maintained:** Exact address still protected (barangay-level only)
- **Consistent Policy:** Same privacy standard for unverified and verified

**Public Display Policy:**

| Field | Unverified | Verified | Staff Only |
|-------|-----------|----------|------------|
| Reference Number | ✅ | ✅ | ✅ |
| Title | ✅ | ✅ | ✅ |
| Category | ✅ | ✅ | ✅ |
| Severity | ❌ | ✅ | ✅ |
| Status | "Pending" | Actual | Actual |
| Barangay | ✅ | ✅ | ✅ |
| Description | ❌ | ❌ | ✅ |
| Exact Address | ❌ | ❌ | ✅ |
| Coordinates | ❌ | ❌ | ✅ |
| Reporter Info | ❌ | ❌ | ✅ |
| Photos | ❌ | ❌ | ✅ |
| Internal Notes | ❌ | ❌ | ✅ |

**Implementation Impact:**
- Database: RLS policies enforce field-level access
- Application: Popup component renders based on user role (anon vs staff)

**Status:** ✅ Proceed as technical default

---

## ADDITIONAL DECISIONS (Remaining Questions)

### Q15: Location Capture Fix

**🟢 DECISION: Implement Browser Geolocation + Interactive Map Pin**

**Technical Approach:**
1. Report form uses browser `navigator.geolocation` API
2. Show interactive Leaflet map with draggable marker
3. Reverse geocode to get address (using Nominatim or local)
4. Auto-detect barangay via point-in-polygon (if boundaries available)
5. Fallback to manual barangay dropdown if coordinates denied/failed
6. Validate coordinates within Bago City bounding box

**City Approval NOT Required:** Standard technical feature

**Status:** ✅ Proceed as technical default

---

### Q16: Duplicate Detection Algorithm

**🟢 DECISION: Fuzzy Matching with Human Confirmation**

**Technical Approach:**
1. **Similarity Scoring (0.00 to 1.00):**
   - Title similarity (Levenshtein distance): 40% weight
   - Location proximity (< 100m): 30% weight
   - Time proximity (< 24 hours): 20% weight
   - Category match: 10% weight
2. **Thresholds:**
   - Score ≥ 0.75: High confidence duplicate (show warning on submit)
   - Score 0.50-0.74: Possible duplicate (show in review queue)
   - Score < 0.50: Not flagged
3. **Human Decision:** Supervisor reviews suggestions, confirms or dismisses

**City Approval NOT Required:** Technical suggestion system, human decides

**Status:** ✅ Proceed as technical default

---

### Q17: Audit Trail Completeness

**🟢 DECISION: Comprehensive Audit Logging**

**Events to Audit:**
- ✅ Incident status changes (already implemented)
- ✅ Incident assignments (already implemented)
- ✅ Review decisions (approve/reject with reason)
- ✅ Verification decisions
- ✅ Duplicate marking with parent reference
- ✅ Re-opening rejected incidents
- ✅ Urgency flag changes

**Audit Log Fields (Already Implemented):**
- actor_id, actor_email, actor_role
- action (status_change, assignment, review_decision, etc.)
- resource_type, resource_id
- details (JSONB with old/new values)
- ip_address, user_agent (Phase B)
- created_at

**Status:** ✅ Proceed - infrastructure exists, add new action types

---

### Q18: Performance - Marker Clustering

**🟢 DECISION: Implement Marker Clustering**

**Technical Approach:**
1. Install `leaflet.markercluster` library
2. Cluster activated when > 50 markers visible
3. Cluster color indicates highest severity in cluster
4. Clicking cluster zooms in or shows spider

**Status:** ✅ Proceed as technical default

---

### Q19: Barangay Boundaries (GeoJSON)

**🔴 DECISION: DEFERRED - Requires External Coordination**

**Rationale:**
- No official GeoJSON available in codebase
- Must obtain from Bago City Planning Office, DILG, or PhilGIS
- Cannot fabricate boundaries
- Nice-to-have, not blocker for verification workflow

**Workaround:**
- Use barangay name matching instead of point-in-polygon
- Manual barangay selection dropdown
- Add boundaries later when available

**Status:** 🔴 Deferred - Document as future enhancement

---

### Q20: Data Retention and Privacy Compliance

**🟡 DECISION: Requires City Policy**

**Technical Capabilities:**
- Can implement automatic archival after N days
- Can anonymize closed incidents after retention period
- Can export data for records management

**City Must Define:**
- Retention period for closed incidents (1 year? 5 years? Indefinite?)
- Anonymization rules (what fields to redact?)
- Records management requirements
- Freedom of Information Act (FOIA) handling
- Personal data access/deletion requests

**Status:** 🟡 Document as City policy requirement

---

## DECISION SUMMARY

### By Classification

**🟢 Technical Defaults (18)** - Proceed with implementation:
1. Barangay FK migration
2. Boolean urgency flag
3. Use existing status enum
4. Reviewer scope (submitted + resolved)
5. Single primary role
6. Allow self-verification (logged)
7. Must pass city verification (no direct escalation)
8. Duplicate marking (supervisor only)
9. Rejection reopening allowed
10. Assignment-based notifications
11. Unverified detail level (title + category + barangay)
12. Verified detail level (+ severity + status)
13. Location capture fix
14. Fuzzy duplicate detection
15. Comprehensive audit logging
16. Marker clustering
17. Two-layer public map (implementation)
18. In-app notifications

**🟡 City Policy Required (5)** - Document for City approval:
1. Email/SMS notifications (service provider, budget)
2. After-hours notification protocol
3. Urgency definitions and response SLAs
4. Sensitive category handling (crime, medical)
5. Data retention and privacy compliance

**🔴 Deferred (1)** - Future enhancement:
1. Barangay boundaries (GeoJSON) - requires external coordination

---

## IMPLEMENTATION AUTHORIZATION

All **🟢 Technical Defaults** are **approved to proceed** in Phase 2 database schema extensions.

All **🟡 City Policy** items are **documented but not implemented** - behavior will be configurable pending City approval.

All **🔴 Deferred** items are **documented as future work**.

---

## MIGRATION SAFETY CHECKLIST

Before applying Phase 2 migration:

- [ ] All new columns are NULLABLE initially (no NOT NULL on existing data)
- [ ] All new tables have RLS enabled by default
- [ ] All FK constraints validated against existing data
- [ ] Backfill strategy documented and tested
- [ ] Rollback SQL prepared and tested
- [ ] Staging database confirmed isolated from production
- [ ] No destructive changes to existing tables
- [ ] Existing functionality preserved (backward compatible)

---

**Decision Register Approved By:** User (proceeding with Kiro recommendations)  
**Date:** October 26, 2026  
**Next Step:** Create Phase 2 migration SQL based on approved decisions

---

*This decision register documents the technical and policy decisions for the Master Implementation verification system. All technical defaults are safe, reversible, and maintain existing functionality while adding verification capabilities.*
