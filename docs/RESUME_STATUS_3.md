# RD Classes — Courses Rework & Portal Hardening Resume Status

**Audit & Initialization Date:** 2026-10-25  
**Baseline Commit:** `fbd61b9` ("before courses rework")  

---

## Progress Overview

| Phase | Description | Status | Commit |
|---|---|:---:|---|
| **Phase 1** | Remove fake/demo data from admin & student portals, database guards, login helper & password flow cleanup | **DONE** | Pending commit |
| **Phase 2** | Course Model single source of truth, migration, indexes, zod validation, admin form with live preview, seed:courses | **IN PROGRESS** | Pending |
| **Phase 3** | CourseCard component (home & catalog variants, tone tokens, illustrations, responsive hover, Home featured section) | **PENDING** | Pending |
| **Phase 4** | Public `/courses` page (exact to reference, Caveat font hero, chips, search/sort URL params), `/courses/[slug]`, Navbar & footer updates | **PENDING** | Pending |
| **Phase 5** | Complete portal routes (`/student/lectures`, etc.), hidden flags for unready features, Settings fields, stats band, Playwright crawl | **PENDING** | Pending |
| **Phase 6** | Visual comparison overlay tests, multi-viewport checks, vitest & Playwright E2E suites, static build verification | **PENDING** | Pending |

---

## Current Step Log
- [x] Initial commit `before courses rework` executed.
- [x] References measured via throwaway Pillow script, generated `docs/COURSES_SPEC.md`, cleaned up temporary script.
- [x] Phase 1 completed:
  - Added `demo: Boolean` to all schemas (`User`, `Device`, `DeviceRequest`, `Course`, `Lecture`, `Enrollment`, `Progress`, `Announcement`, `Test`, `TestResult`).
  - Added safety guard to `seed:demo`: strictly refuses to run if `NODE_ENV=production` or connected database name does not end with `_dev`; marks every document created with `demo: true`.
  - Updated `seed:demo:clean`: deletes only documents with `demo: true` and prints connected database name. Ran against local database cleanly.
  - Eliminated hardcoded demo names (`Vardaan`, `RD-2025-001`, etc.) from portal forms, profile, and headers.
  - Updated login helper copy to: "Your login ID and password are provided by RD Classes".
  - Implemented `allowStudentPasswordChange` setting in `Settings` and enforced in student profile UI & backend service; admins retain password reset capability.
  - Made admin topbar workspace pill, sidebar footer, and student topbar dynamic from `Settings` and `User` documents. Empty states updated cleanly.
- [ ] Phase 2 in progress: Course model migration, single source of truth, admin course form live preview, `seed:courses`.
