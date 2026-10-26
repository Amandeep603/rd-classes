# RD Classes — Pass D (Final Polish & Launch Prep)

**Initialization Date:** 2026-10-26  
**Baseline Commit:** `before final pass D`

---

## Phase Plan & Status

| Phase | Description | Status |
|---|---|:---:|
| **D0 + D1** | Test Isolation + Navbar (Solid dark on all non-home routes, #notes link, no lectures) + `/courses` pixel-matching (1536 canvas, 431px cards, large illustrations, tone system) + Zero-data states (courses empty state, home sections hide when empty) | **DONE** |
| **D2** | Login Pages (`/student/login` & `/admin/login` matching reference with dark navy study room scene, no photos, no forgot password) + Credential Model (AES-256-GCM encrypted copy `passwordEnc`, admin reveal with re-auth & audit log, no student password change) | **NEXT** |
| **D3** | Free First Lecture (`freePreview` auto-set on lowest order lecture, admin override) + "Buy on WhatsApp" dialog on locked lectures & visitor sidebar | **PENDING** |
| **D4** | Notes Ecosystem (Public `/notes` page, note card grid, protected stream route, course detail notes tab + lecture note links) | **PENDING** |
| **D5** | Admin Polish, Zero Data (real counters, empty checklists), Final Lint + Build + Vitest + Docs | **PENDING** |

---

## Phase D1 Summary
- [x] Test Isolation helper [`scripts/lib/testDbIsolation.mjs`](file:///e:/rd-classes/scripts/lib/testDbIsolation.mjs) added to enforce isolated test databases in scripts and prevent writing to production database.
- [x] Navbar made solid dark `#0A0A0A` (1px border `rgba(255,255,255,0.08)`) on all routes except `"/"` from the first pixel. Notes links to `/notes`, no Lectures item.
- [x] `/courses` page matched to 1536px canvas reference with max container width 1330px, 431px cards with 22px gaps, 28% width illustrations, tone accents, 40px View Course buttons, and 46px WhatsApp buttons ([`docs/COMPARE_REPORT_COURSES_PAGE.md`](file:///e:/rd-classes/docs/COMPARE_REPORT_COURSES_PAGE.md)).
- [x] Hero illustration cluster cleanly separates the handwritten note from the book stack.
- [x] Admin course tone auto-selection implemented with 6-tone cycle in `courseService.js` and live swatches in `CourseForm.jsx`.
- [x] Zero-data states implemented: `/courses` displays friendly empty state when no courses are published; Home sections (`FeaturedCoursesSection`, `StatsSection`, `BoardToppersSection`, `TestimonialsSection`, `GallerySection`) hide themselves with zero placeholder numbers.
- [x] 63/63 Vitest tests passed, ESLint passed with 0 errors, Next.js 57/57 production build passed.
