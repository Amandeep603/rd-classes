# RD Classes — Courses Rework & Portal Hardening Resume Status

**Audit & Initialization Date:** 2026-10-25  
**Baseline Commit:** `fbd61b9` ("before courses rework")  

---

## Progress Overview

| Phase | Description | Status | Commit |
|---|---|:---:|---|
| **Phase 1** | Remove fake/demo data from admin & student portals, database guards, login helper & password flow cleanup | **DONE** | `3014c22` |
| **Phase 2** | Course Model single source of truth, migration, indexes, zod validation, admin form with live preview, seed:courses | **DONE** | Pending commit |
| **Phase 3** | CourseCard component (home & catalog variants, tone tokens, illustrations, responsive hover, Home featured section) | **IN PROGRESS** | Pending |
| **Phase 4** | Public `/courses` page (exact to reference, Caveat font hero, chips, search/sort URL params), `/courses/[slug]`, Navbar & footer updates | **PENDING** | Pending |
| **Phase 5** | Complete portal routes (`/student/lectures`, etc.), hidden flags for unready features, Settings fields, stats band, Playwright crawl | **PENDING** | Pending |
| **Phase 6** | Visual comparison overlay tests, multi-viewport checks, vitest & Playwright E2E suites, static build verification | **PENDING** | Pending |

---

## Current Step Log
- [x] Initial commit `before courses rework` executed (`fbd61b9`).
- [x] References measured via throwaway Pillow script, generated `docs/COURSES_SPEC.md`, cleaned up temporary script.
- [x] Phase 1 completed (`3014c22`):
  - Added `demo: Boolean` to all schemas.
  - Added strict environment and database name safety guards to `seed:demo`.
  - Updated `seed:demo:clean` to purge demo data and print db name.
  - Cleaned all hardcoded demo names from portals and added proper empty states.
  - Removed forgot-password links; updated login helper copy.
  - Added `allowStudentPasswordChange` setting with admin password reset capability.
- [x] Phase 2 completed:
  - Extended `Course` model with all required schema fields (`title`, `subtitle`, `slug`, `category`, `classLabel`, `badgeText`, `badgeVariant`, `tone`, `illustration`, `illustrationAssetId`, `description`, `metaIcon`, `metaText`, `language`, `facultyName`, `facultyRole`, `facultyAvatarAssetId`, `whatsappText`, `published`, `featured`, `order`, `demo`) and compound indexes.
  - Created idempotent `scripts/migrate-courses.mjs` (`npm run db:migrate-courses`) and updated `scripts/create-indexes.js`.
  - Created idempotent `scripts/seed-courses.mjs` (`npm run seed:courses`) with all 6 real offerings, guarded for production with `--yes-production`.
  - Built 7 inline SVG illustrations matching reference silhouettes.
  - Built `CourseCard.jsx` with `home` and `catalog` variants, container queries, and tone tokens.
  - Added Zod `courseSchema` validation for published courses.
  - Built Next 16 cached server functions (`getCachedPublicCourses`, `getCachedFeaturedCourses`, `getCachedCourseBySlug`) with `cacheTag("courses")` and invalidation.
  - Created `CourseForm.jsx` with live preview of both card variants and category suggestion defaults.
  - Wired `/admin/courses/new`, `/admin/courses/[id]`, `PortalCoursesView` (reordering, delete confirmation with unpublish fallback), and connected student portal courses.
- [ ] Phase 3: Update Home "Featured courses" section using `CourseCard` variant "home", cached data, tabs, and "View all courses ->" link.
