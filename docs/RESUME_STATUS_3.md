# RD Classes — Courses Rework & Portal Hardening Resume Status

**Audit & Initialization Date:** 2026-10-25  
**Baseline Commit:** `fbd61b9` ("before courses rework")  

---

## Progress Overview

| Phase | Description | Status | Commit |
|---|---|:---:|---|
| **Phase 1** | Remove fake/demo data from admin & student portals, database guards, login helper & password flow cleanup | **DONE** | `3014c22` |
| **Phase 2** | Course Model single source of truth, migration, indexes, zod validation, admin form with live preview, seed:courses | **DONE** | `f331a96` |
| **Phase 3** | CourseCard component (home & catalog variants, tone tokens, illustrations, responsive hover, Home featured section) | **DONE** | `5310d25` |
| **Phase 4** | Public `/courses` page (exact to reference, Caveat font hero, chips, search/sort URL params), `/courses/[slug]`, Navbar & footer updates | **DONE** | Pending commit |
| **Phase 5** | Complete portal routes (`/student/lectures`, etc.), hidden flags for unready features, Settings fields, stats band, Playwright crawl | **IN PROGRESS** | Pending |
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
- [x] Phase 2 completed (`f331a96`):
  - Extended `Course` model with all required schema fields and compound indexes.
  - Created idempotent `scripts/migrate-courses.mjs` (`npm run db:migrate-courses`) and updated indexes.
  - Created idempotent `scripts/seed-courses.mjs` (`npm run seed:courses`) with all 6 real offerings.
  - Built 7 inline SVG illustrations matching reference silhouettes.
  - Built `CourseCard.jsx` with `home` and `catalog` variants, container queries, and tone tokens.
  - Added Zod `courseSchema` validation for published courses.
  - Built Next 16 cached server functions (`getCachedPublicCourses`, `getCachedFeaturedCourses`, `getCachedCourseBySlug`) with `cacheTag("courses")` and invalidation.
  - Created `CourseForm.jsx` with live preview of both card variants and category suggestion defaults.
  - Wired `/admin/courses/new`, `/admin/courses/[id]`, `PortalCoursesView`, and connected student portal courses.
- [x] Phase 3 completed (`5310d25`):
  - Connected Home `FeaturedCoursesSection` to `getCachedFeaturedCourses()` (published && featured, ordered).
  - Hides whole section when no featured courses exist.
  - Replaced legacy `CourseCard` with unified `CourseCard` variant `"home"`.
  - Added centered "View all courses ->" link to `/courses`.
  - Deleted legacy constants-based course file (`src/constants/courses.js`) and legacy card component.
  - Updated footer course links in `src/constants/footer.js` to `/courses/[slug]`.
- [x] Phase 4 completed:
  - Built public `/courses` page exact to `reference/courses-page.png` (1536px canvas width).
  - Built `CoursesHeroCluster` with SVG potted plant, 3 stacked books (ACCOUNTS / PRACTICE / RESULTS), pen cup, and Caveat font handwritten note ("Learn / Practice / Score Higher") rotated -12deg with yellow swoosh.
  - Built `CoursesCatalogClient` with filter chips (All Courses, Class 12 CBSE, Class 11 Foundation, Recorded Portal, Test Series, Crash Courses), debounced search, and sort select, syncing state cleanly to URL search params.
  - Built `/courses/[slug]` detail page with tone-tinted hero, curriculum preview by section (titles and durations only, zero exposed video IDs), "What's Included", and related courses.
  - Updated Navbar & MobileMenu: removed "Lectures", active underline on "Courses" using `usePathname()`.
  - Updated `sitemap.js` with dynamic published courses.
- [ ] Phase 5: Build `/student/lectures`, hide unready portal nav items behind flags, expand Settings fields and connect Website Numbers to Home Stats band, Playwright crawl.
