# RD Classes — End-to-End Test Report (Phase C5)

**Executed On**: 2026-10-26T02:14:30+05:30  
**Environment**: Production Mode (`next start` on `http://localhost:3100`), Turbopack build, MongoDB local instance  
**Runner**: Playwright with Chromium (headless) via [`scripts/e2e-full-scenario.mjs`](file:///e:/rd-classes/scripts/e2e-full-scenario.mjs)  
**Overall Status**: **PASSED (12 / 12 steps verified)**

---

## Scenario Summary & Test Results

| Step | Test Objective | UI Route / Flow | Result | Key Assertion |
| :---: | :--- | :--- | :---: | :--- |
| **1** | Admin Credential Validation | DB Verification | **PASSED** | Admin user verified & rate limits cleared for pristine test state. |
| **2** | Course & Content Provisioning | DB Direct Seed | **PASSED** | Published course created with 3 lectures, 1 external link note, and 1 file note. |
| **3** | Admin Authentication | `/admin/login` | **PASSED** | Admin session cookie created; redirect to `/admin` dashboard confirmed. |
| **4** | Bulk CSV Student Import | `/admin/students` | **PASSED** | 3-row CSV imported; one-time plain credentials table rendered with copy buttons. |
| **5** | Bulk Credential Email Delivery | `/admin/students` Modal | **PASSED** | Batch email delivery executed; 3 student credentials written to `.local-emails`. |
| **6** | Student A Device 1 Registration | `/student/login` | **PASSED** | Student logged in; Device 1 registered to active student session in MongoDB. |
| **7** | Student A Device 2 Registration Attempt | `/student/login` | **PASSED** | Device 2 rejected from direct portal entry; routed to pending approval waiting page. |
| **8** | Admin Device Replacement Approval | `/admin/devices` | **PASSED** | Pending device request located; approved with "Replace" decision via UI modal. |
| **9** | Device 1 Session Invalidation | `/student` (Device 1) | **PASSED** | Device 1 page reloaded; session killed immediately; redirected to login. |
| **10** | Device 2 Portal Access & Stream Check | `/student/courses/[slug]` | **PASSED** | Device 2 accessed dashboard, opened course, recorded progress, viewed notes. |
| **11** | Blocked Student Enforcement | `/student/login` | **PASSED** | Blocked student rejected with clear banner message; zero session issued. |
| **12** | Unpublished Course Catalog Isolation | `/courses/[slug]` | **PASSED** | Unpublished course returned branded 404; public cannot discover draft courses. |

---

## Detailed Step Logs

### Step 1: Admin Credential Setup
- Cleared rate limits for `admin` IP and identifiers.
- Verified admin existence in MongoDB with role `admin`.

### Step 2: Course & Content Seeding
- Seeded course `e2e-accounts-mastery` (`Accounts Mastery E2E`).
- Seeded 3 video lectures (`Trial Balance Foundations`, `Depreciation Accounting`, `Final Accounts Formulation`) with Vimeo video IDs.
- Attached 2 lecture notes:
  - External Link Note: `https://rdclasses.in/sample-notes.pdf`
  - Downloadable File Note: `https://rdclasses.in/assets/e2e-notes.pdf`

### Step 3: Admin Login & Portal Access
- Navigated to `http://localhost:3100/admin/login`.
- Input admin username and password.
- Verified transition to `http://localhost:3100/admin`.

### Step 4: CSV Student Import
- Navigated to `http://localhost:3100/admin/students`.
- Pasted CSV with 3 students (`Aman Sharma`, `Rohit Kumar`, `Neha Gupta`).
- System verified data rows and triggered import.
- Table rendered showing generated passwords and credential rows.

### Step 5: Bulk Credential Delivery
- Triggered "Email Credentials to Imported Students".
- Delivery modal monitored batch processing.
- Verified email output files created in `.local-emails` directory.

### Step 6: Student A Device 1 Registration
- Emulated Chrome Desktop viewport & user-agent for Device 1.
- Logged in with Student A's generated credentials.
- Auto-registered Device 1 fingerprint; verified redirect to `/student`.

### Step 7: Student A Device 2 Device Lock Check
- Created isolated browser context for Device 2 with distinct user-agent (`RDClasses-Device2/E2E-Mobile`).
- Attempted login for Student A.
- Verified device lock triggered; navigated to `/student/device-pending`.

### Step 8: Admin Device Approval
- Switched back to Admin browser context.
- Navigated to `/admin/devices`.
- Located pending request for `Aman Sharma`.
- Clicked "Approve", selected "Replace current device", and confirmed.

### Step 9: Device 1 Eviction
- Switched to Device 1 browser context.
- Attempted to reload `/student`.
- Session token invalidated by device fingerprint mismatch.
- Redirected to `/student/login` with session terminated.

### Step 10: Device 2 Portal & Course Access
- Device 2 reloaded and logged in.
- Navigated to `http://localhost:3100/student/courses/e2e-accounts-mastery`.
- Verified lecture list, notes tab, and progress tracking API integration.

### Step 11: Blocked Student Security Check
- Attempted login with `Rohit Kumar` (marked status: `blocked`).
- Login rejected with error: `Your account is blocked. Please contact support.`
- No student session cookie created.

### Step 12: Unpublished Course Security Check
- Created draft course `e2e-draft-economics` (`isPublished: false`).
- Attempted public access at `http://localhost:3100/courses/e2e-draft-economics`.
- Verified HTTP 404 response with branded Not Found UI.

---

## Conclusion
The full end-to-end lifecycle of student onboarding, device enforcement, admin moderation, and content protection behaves as designed under production conditions.
