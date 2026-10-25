# RD Classes — Final Features & Hardening Resume Status

**Audit & Initialization Date:** 2026-10-25  
**Baseline Commit:** `db5ff9e` ("before final features")  

---

## Progress Overview

| Phase | Description | Status | Commit / Details |
|---|---|:---:|---|
| **Phase C1** | Public Course Detail Page `/courses/[slug]` (Reference A/B measured, desktop B layout + A richness, personalized sidebar via client fetch, preview lectures modal, Related Courses strip, static shell prerender) | **DONE** | `final: phase C1` (`3af8aa7`) |
| **Phase C2** | Student Email + Email System (SMTP/Resend/Console drivers, EmailLog, credentials & device approval mailers) | **DONE** | `final: phase C2` (`688ab53`) |
| **Phase C3** | Bulk Email and CSV Import (Chunked client-driven sender, import wizard with per-row validation, credentials download, bulk reset) | **DONE** | `final: phase C3` |
| **Phase C4** | Notes linked to courses + Bulk Lectures (Kind/source notes, course Notes tab, 100-vimeo bulk dialog with reordering) | **NEXT** | Course notes, bulk vimeo dialog |
| **Phase C5** | Backend Readiness Audit and Hardening (Audit checklist, IDOR tests, rate limits, env check, db backup, E2E report, launch checklist) | **MISSING** | Pending |

---

## Phase C3 Verification Summary
- [x] CSV Import Wizard implemented at `/admin/students/import` with header back link, CSV template download (`rd_students_import_template.csv`), drag-and-drop or paste area, and course slug cheat-sheet.
- [x] Client-side parser with per-row validation (missing name, invalid email, unknown course slugs, duplicate loginId in batch, past validity dates, password length).
- [x] Server action `importStudentsFromCSVAction` with atomic sequential student codes (`RD-YYYY-NNN`), password hashing, enrollment linking, and audit logging. Plaintext passwords are ONLY returned once in response for immediate export/emailing and never persisted to MongoDB or logs.
- [x] Immediate post-import action bar: "Email Credentials to All Students" (direct fulfillment of user request for automatic delivery), "Download Credentials CSV Backup", and one-time credentials table with copy and visibility toggles.
- [x] Client-driven chunk runner (`BulkEmailProgressModal`): chunk size <= 10, pause/resume/cancel, progress bar, real-time row status list, and retry failed button.
- [x] Students list table (`/admin/students`): select all header, row checkboxes, docked bulk action bar, bulk reset + email action with typed confirmation ("RESET") for >20 students.
- [x] Email credential status chips on student rows: Emailed (green check), Failed (red alert with tooltip error), Not emailed (slate), No email (amber).
- [x] Email filter dropdown updated: All Emails, Emailed (Sent), Email Failed, Not Emailed, No Email.
- [x] Test suite: 42/42 vitest tests pass across all 6 test files (`tests/bulk_email_csv.test.js`, `tests/email.test.js`, `tests/courses.test.js`, `tests/portal_new_features.test.js`, `tests/storage_media.test.js`, `tests/backend.test.js`).
- [x] ESLint clean (0 errors, 0 warnings); Next.js 16 production build clean (`/admin/students/import` built successfully).
