# RD Classes — Pass D (Final Polish & Launch Prep)

**Initialization Date:** 2026-10-26  
**Baseline Commit:** `before final pass D`

---

## Phase Plan & Status

| Phase | Description | Status |
|---|---|:---:|
| **D0 + D1** | Test Isolation + Navbar (Solid dark on all non-home routes, #notes link, no lectures) + `/courses` pixel-matching (1536 canvas, 431px cards, large illustrations, tone system) + Zero-data states (courses empty state, home sections hide when empty) | **DONE** |
| **D2** | Login Pages (`/student/login` & `/admin/login` matching reference with dark navy study room scene, no photos, no forgot password) + Credential Model (AES-256-GCM encrypted copy `passwordEnc`, admin reveal with re-auth & audit log, no student password change) | **DONE** |
| **D3** | Free First Lecture (`freePreview` auto-set on lowest order lecture, admin override) + "Buy on WhatsApp" dialog on locked lectures & visitor sidebar | **DONE** |
| **D4** | Notes Ecosystem (Public `/notes` page, note card grid, protected stream route, course detail notes tab + lecture note links) | **DONE** |
| **D5** | Admin Polish, Zero Data (real counters, empty checklists), Final Lint + Build + Vitest + Docs | **DONE** |

---

## Phase D1 Summary
- [x] Test Isolation helper [`scripts/lib/testDbIsolation.mjs`](file:///e:/rd-classes/scripts/lib/testDbIsolation.mjs) added to enforce isolated test databases in scripts and prevent writing to production database.
- [x] Navbar made solid dark `#0A0A0A` (1px border `rgba(255,255,255,0.08)`) on all routes except `"/"` from the first pixel. Notes links to `/notes`, no Lectures item.
- [x] `/courses` page matched to 1536px canvas reference with max container width 1330px, 431px cards with 22px gaps, 28% width illustrations, tone accents, 40px View Course buttons, and 46px WhatsApp buttons ([`docs/COMPARE_REPORT_COURSES_PAGE.md`](file:///e:/rd-classes/docs/COMPARE_REPORT_COURSES_PAGE.md)).
- [x] Hero illustration cluster cleanly separates the handwritten note from the book stack.
- [x] Admin course tone auto-selection implemented with 6-tone cycle in `courseService.js` and live swatches in `CourseForm.jsx`.
- [x] Zero-data states implemented: `/courses` displays friendly empty state when no courses are published; Home sections (`FeaturedCoursesSection`, `StatsSection`, `BoardToppersSection`, `TestimonialsSection`, `GallerySection`) hide themselves with zero placeholder numbers.
- [x] 63/63 Vitest tests passed, ESLint passed with 0 errors, Next.js 57/57 production build passed.

## Phase D2 Summary
- [x] Built shared [`AuthScene`](file:///e:/rd-classes/src/components/portal/auth/AuthScene.jsx) component matching `reference/student-login.png` on 1536px canvas without photos: layered navy gradients, soft radial bokeh circles (no blur filters), inline-SVG still-life (Accountancy/Business Studies/Economics books, cream pen cup with yellow pencil, plant leaves, laptop edge), top-left logo, bold headline, and frosted-glass card with backdrop blur on desktop only (opaque on mobile).
- [x] Applied `AuthScene` to both `/student/login` and `/admin/login` with appropriate copy, removal of Google/Forgot password/OR dividers, dark theme autofill styles, and single approved device note.
- [x] Removed student password change UI, route, and server actions; student profile displays read-only details with "To change your password or device, contact Sir" and a direct WhatsApp button; deleted `Settings.allowStudentPasswordChange`.
- [x] Implemented AES-256-GCM credential encryption model in [`credentialEncryption.js`](file:///e:/rd-classes/src/server/auth/credentialEncryption.js) (`User.passwordEnc` with iv, tag, ciphertext, keyVersion) written upon student creation, reset, and CSV import; bcrypt verification for logins remains strictly intact.
- [x] Added "Credentials" card to admin student page with Login ID copy, masked password, and admin re-authentication "Reveal" modal (rate limited to 5/minute, 30-second auto-mask timer, audited without logging password).
- [x] Added "Send credentials" (WhatsApp and email) utilizing the decrypted password without resetting it; updated bulk email to send stored credentials without resetting unless missing.
- [x] 70/70 Vitest tests passed across all 9 suites, ESLint passed with 0 errors, Next.js 42/42 production build passed.

## Phase D3 Summary
- [x] Added `freePreview` and `freePreviewOverridden` fields to [`Lecture.js`](file:///e:/rd-classes/src/server/db/models/Lecture.js) with pre-validate hook keeping `isPreview` synchronized.
- [x] Implemented `syncCourseFreePreview(courseId)` in [`lectureService.js`](file:///e:/rd-classes/src/server/services/lectureService.js) to automatically assign `freePreview: true` to the lowest order published lecture whenever lectures are created, reordered, deleted, or bulk imported unless manually overridden.
- [x] Video safety & privacy: Updated `getCachedCourseLectures` in [`courseService.js`](file:///e:/rd-classes/src/server/services/courseService.js) and `getAuthorizedLecture` in `lectureService.js` to ensure Vimeo IDs are strictly scrubbed for locked lectures and provided only for `freePreview` lectures.
- [x] Enhanced public course curriculum UI in [`CourseDetailClient.jsx`](file:///e:/rd-classes/src/components/courses/CourseDetailClient.jsx):
  - Free lecture row displays a "Watch Free" button with Play icon opening the accessible Vimeo modal player.
  - Locked lecture rows and lock buttons open the accessible "Buy this course" dialog with prefilled WhatsApp button (`Hello RD Classes, I want to buy the course: <title>. Please share the details.`) and secondary "I already have a login" link.
  - Visitor sidebar card updated to "Buy this course" with direct prefilled WhatsApp CTA and Student Login link.
- [x] Updated admin lecture managers ([`PortalCourseDetailView.jsx`](file:///e:/rd-classes/src/components/portal/admin/PortalCourseDetailView.jsx), [`PortalLecturesView.jsx`](file:///e:/rd-classes/src/components/portal/admin/PortalLecturesView.jsx), [`LecturesManager.jsx`](file:///e:/rd-classes/src/components/admin/LecturesManager.jsx)) with "Free" badges and "Free preview" checkboxes.
- [x] Created [`tests/free_lecture.test.js`](file:///e:/rd-classes/tests/free_lecture.test.js) (6 tests). Full Vitest suite passes 76/76 tests across all 10 suites; ESLint 0 errors; Next.js 57/57 production build succeeded.

## Phase D4 Summary
- [x] Built public [`/notes`](file:///e:/rd-classes/src/app/%28marketing%29/notes/page.js) page and [`NotesDirectoryClient.jsx`](file:///e:/rd-classes/src/components/notes/NotesDirectoryClient.jsx) with curriculum search, Class 11/12 tabs, kind chips (Concept Notes, Practice Sheets, Formula Cards, Board Papers), live counts, and zero-data states.
- [x] Implemented `getCachedPublicNotes()` in [`noteService.js`](file:///e:/rd-classes/src/server/services/noteService.js) with `cacheTag("notes")` and `cacheLife("max")`, sanitizing sensitive storage keys and file paths while populating linked course badges.
- [x] Protected streaming route [`/api/notes/[id]/stream`](file:///e:/rd-classes/src/app/api/notes/%5Bid%5D/stream/route.js) verifies authentication and active course enrollment before serving PDFs as `inline` with `no-store` headers.
- [x] Course detail page Notes tab updated in [`CourseDetailClient.jsx`](file:///e:/rd-classes/src/components/courses/CourseDetailClient.jsx) with interactive "Enrolled only · Unlock note" button opening the course purchase dialog for visitors.
- [x] Student lecture player page in [`[lectureId]/page.js`](file:///e:/rd-classes/src/app/%28student%29/student/%28portal%29/courses/%5Bslug%5D/lectures/%5BlectureId%5D/page.js) enriched with "Chapter Notes & Resources" card displaying direct PDF stream / link access for enrolled students.
- [x] Created [`tests/notes_ecosystem.test.js`](file:///e:/rd-classes/tests/notes_ecosystem.test.js) (4 tests). Full Vitest suite passes 80/80 tests across all 11 suites; ESLint 0 errors; Next.js 58/58 production build succeeded.

## Phase D5 Summary
- [x] Real Counters: Verified all 6 admin stat tiles (`Students`, `Active Logins`, `Pending Devices`, `Recorded Videos`, `Active Courses`, `Enrolments`) execute real database queries via `Promise.all` with zero placeholder values.
- [x] Quick Setup Checklist: Implemented [`AdminSetupChecklistCard.jsx`](file:///e:/rd-classes/src/components/portal/admin/AdminSetupChecklistCard.jsx) dynamically tracking initial platform completion (Courses, Lectures, Students, Notes) with direct navigation buttons and progress bar, cleanly hiding when all 4 steps are complete.
- [x] Polished Empty States:
  - [`AdminCoursesOverviewCard.jsx`](file:///e:/rd-classes/src/components/portal/admin/AdminCoursesOverviewCard.jsx): Replaced plain text with polished zero-state card and direct "Add Course" action button.
  - [`AdminDeviceApprovalCard.jsx`](file:///e:/rd-classes/src/components/portal/admin/AdminDeviceApprovalCard.jsx): Replaced empty message with green check "All clear! No pending device clearance requests."
  - [`AdminAnnouncementsCard.jsx`](file:///e:/rd-classes/src/components/portal/admin/AdminAnnouncementsCard.jsx): Replaced bare container with clean broadcast prompt and "Create Announcement" action link.
  - [`AdminRecentActivityCard.jsx`](file:///e:/rd-classes/src/components/portal/admin/AdminRecentActivityCard.jsx): Enhanced with dashed container explaining audit log behavior.
- [x] Testing & QA:
  - Added [`tests/admin_dashboard_zero_data.test.js`](file:///e:/rd-classes/tests/admin_dashboard_zero_data.test.js) (2 tests) verifying zero-count robustness and checklist completion calculations.
  - All 12 test files passed (82/82 tests passing).
  - ESLint passed with 0 errors across `src` and `tests`.
  - Next.js production build succeeded with 58/58 routes prerendered / compiled cleanly.

