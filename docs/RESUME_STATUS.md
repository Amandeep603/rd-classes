# RD Classes Portal Redesign — Resume Status

**Audit Date:** 2026-10-23  
**Status Overview:** Interrupted during initial setup. Found baseline commit `before portal redesign`. Beginning structured execution across Phases A, B, C, D.

---

## 1. Audit Matrix (Parts 0 – 7)

| Part | Description | Status | Details |
|---|---|:---:|---|
| **Part 0** | **Fix Next.js "Blocking Route" Error** | **PARTLY DONE** | `await connection()` added in `session.js`, but layouts (`AdminLayout`, `StudentLayout`) need restructuring into static shell + `<Suspense>` boundary with matching skeleton fallback. |
| **Part 1** | **Design System & Measurement** | **MISSING** | `src/styles/portal.css` and `src/components/portal/*` components missing. `docs/PORTAL_SPEC.md` requires measurement script for 1536px canvases (`student-dashboard.png` and `admin-dashboard.png`). |
| **Part 2** | **Auth Pages** | **MISSING** | `/student/login` requires split layout with brand panel; `/student/login/pending` requires note field + polling; `/admin/login` requires dark navy admin theme. |
| **Part 3** | **Student Portal** | **MISSING** | `/student` dashboard requires exact replica (Announcement, Resume, Syllabus coverage, Stat cards, Upcoming Test, Notes card), `/student/courses`, `/student/tests`, `/student/profile`. |
| **Part 4** | **Admin Portal** | **MISSING** | `/admin` dashboard with welcome banner, six stat tiles, device request card with notes, wizard for adding student, announcements, tests, settings. |
| **Part 5** | **Data Additions & Models** | **MISSING** | Need `Announcement`, `Test`, `TestResult`, `Settings`, `Counter` models; field additions on `User` (`studentCode`), `Enrollment` (`paymentNote`), `DeviceRequest` (`studentNote`), `Progress` (`bookmarked`), and backfill script. |
| **Part 6** | **Responsive, Motion & A11y** | **MISSING** | Breakpoint adaptations, CSS motion tokens with `html[data-motion]`, accessible dialogs, and contrast checks. |
| **Part 7** | **Verification & Reports** | **MISSING** | Unit tests for new logic, visual screenshot comparison (`docs/COMPARE_REPORT_PORTAL.md`), Playwright E2E verification (`docs/E2E_REPORT.md`). |

---

## 2. Planned Execution Phases

- **Phase A**: Part 0 (Blocking Route fix, layouts, Suspense skeletons) + Part 1 (Pillow measurement script, `docs/PORTAL_SPEC.md`, tokens, `src/styles/portal.css`, core components, shells).
- **Phase B**: Part 2 (Auth pages) + Part 3 (Student portal complete).
- **Phase C**: Part 5 (Data additions, models, indexes, backfill) + Part 4 (Admin portal complete).
- **Phase D**: Part 6 (Responsive, motion, a11y) + Part 7 (Vitest tests, visual comparison, E2E check, reports).
