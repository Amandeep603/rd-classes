# RD Classes — Courses Rework & Portal Hardening Resume Status

**Audit & Initialization Date:** 2026-10-25  
**Baseline Commit:** `fbd61b9` ("before courses rework")  

---

## Progress Overview

| Phase | Description | Status | Commit / Details |
|---|---|:---:|---|
| **Phase 1** | Remove fake/demo data from admin & student portals, database guards, login helper & password flow cleanup | **DONE** | `3014c22` |
| **Phase 2** | Course Model single source of truth, migration, indexes, zod validation, admin form with live preview, seed:courses | **DONE** | `f331a96` |
| **Phase 3** | CourseCard component (home & catalog variants, tone tokens, illustrations, responsive hover, Home featured section) | **DONE** | `5310d25` |
| **Phase 4** | Public `/courses` page (exact to reference, Caveat font hero, chips, search/sort URL params), `/courses/[slug]`, Navbar & footer updates | **DONE** | `13e7ab7` |
| **Phase 5** | Complete portal routes (`/student/lectures`), admin Activity page, hidden flags for unready features, Settings fields, stats band | **DONE** | `courses: phase 5` |
| **Phase 6** | Verification reports (COMPARE_REPORT_COURSES.md, multi-viewport checks, vitest & crawl suites, static build verification) | **DONE** | `courses: phase 6` |

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
- [x] Phase 5 completed (`courses: phase 5`):
  - Added `/student/lectures` page and `StudentLecturesView.jsx` with search, course filter tabs, progress ticks, and "Resume" on last watched.
  - Added Admin Activity log page (`/admin/activity`) backed by `getRecentAuditLogs` with table, search, event filters, and clean JSON serialization.
  - Updated `src/constants/portalNav.js` pointing lectures to `/student/lectures` and keeping notes disabled.
  - Updated `src/constants/adminNav.js` with Activity link and hidden feature flags for unready modules.
  - Added redirect `/admin/devices` -> `/admin/device-requests` with `export const instant = false`.
  - Added Settings fields `allowStudentPasswordChange` and `websiteNumbers` (students mentored, board success rate, tests evaluated, recorded lectures) to `PortalSettingsView.jsx` and server actions.
  - Connected `StatsSection.jsx` to `getCachedWebsiteStats()` with fallback and auto-hide when empty.
  - Built `scripts/e2e-crawl.mjs` to crawl all public, admin, and student routes.
- [x] Phase 6 completed (`courses: phase 6`):
  - Created and ran `scripts/verify-courses-visual.py` producing `docs/COMPARE_REPORT_COURSES.md`.
  - Verified layout anchors within +-3.1% deviation (threshold +-6%) and illustrations within +-3.1% (threshold +-8%).
  - Multi-viewport checks passed across 8 standard breakpoints (1920x1080 down to 360x640) with zero horizontal overflow and >= 44px tap targets.
  - Vitest courses test suite added (`tests/courses.test.js`): 26/26 unit tests passed across 3 test files.
  - Playwright E2E crawl (`npm run test:crawl`): crawled public, admin, and student routes with zero 404/500 errors.
  - Production build (`npm run build`): static shells (`○`) verified for `/` and `/courses`.
