# Course Detail Page Specification (docs/COURSE_DETAIL_SPEC.md)

**Generated from Reference Measurements:**
- Reference A (`reference/course-detail-a.png`): 1024 x 682
- Reference B (`reference/course-detail-b.png`): 1024 x 423

---

## 1. Layout & Breakpoints Hierarchy
- **Desktop (>= 1100px): Follows Reference B Layout & Spacing**
  - Max container width: `1280px` centered (`max-w-7xl px-4 sm:px-6 lg:px-8`)
  - Two-column layout:
    - Main column (Curriculum / Tabs): ~`68%` width (`lg:col-span-8` or `flex-1`)
    - Sidebar column (Sticky): ~`32%` width (`lg:col-span-4` or `w-[360px]`)
  - Sticky top offset: `top-24` (header height + margin)
  - Hero banner height: ~`280px` to `320px` responsive (`py-10 md:py-14`)
  - Hero right-side illustration box: ~`360px` wide x `240px` high
  - Section accordion cards:
    - Collapsed height: ~`72px`
    - Expanded lecture rows: ~`52px` height per row
    - Section 1 expanded shows first 5 lectures with "View all N lectures" toggle button
  - Sidebar:
    - Course Progress / Start Learning card: ~`180px` height
    - Course Includes card: ~`340px` height (up to 7 items from A)
    - Faculty card: single compact row with chevron when no bullets, or expanded with bullets (up to 4 from A)
  - Related courses strip: 3 cards grid (`grid-cols-1 md:grid-cols-3 gap-6`), cards ~`90px` height with tone tile, title, lectures count, and arrow circle.

- **Tablet (768px - 1099px): Follows Reference A**
  - Two columns with narrower sidebar (`col-span-7` / `col-span-5` or flexible)
  - Tab bar horizontally scrollable with edge fade
  - Hero illustration scaled down (~`260px` wide)

- **Mobile (< 768px): Single Column Stack**
  - 1 column order:
    1. Breadcrumb + Hero
    2. Horizontally scrollable Tab Bar
    3. Search bar
    4. Curriculum / Tab panels
    5. Sidebar cards (Progress/Action, Includes, Faculty)
    6. Related Courses strip
  - 44px minimum tap targets on all buttons, tabs, and lecture rows
  - Zero horizontal page overflow (`overflow-x: hidden`)

---

## 2. Color Palette & Typography Sampled
- **Hero Background:** Cream to soft blue gradient: `linear-gradient(135deg, #FFFDF5 0%, #FFF9EB 45%, #EBF4FF 100%)`
- **Hero Title Highlight:** Warm yellow marker background `#FFE27A` / `#FFD84D` behind subtitle `(Full Year)` with rounded corners (`px-2 py-0.5 rounded-md inline-block text-[#0B2545]`)
- **Primary Text:** Deep near-black `#0B1B3D` / `#0F172A`
- **Muted Subtitle / Meta Text:** `#556987` / `#64748B`
- **Tab Bar Container:** `#F8FAFC` background with `#E2E8F0` border
- **Active Tab Underline:** `#FFB800` (height 3px, rounded)
- **Section Number Badges (Pastel Tone Cycle):**
  - 1. Blue: Bg `#EBF5FF`, Text `#0066FF`
  - 2. Yellow: Bg `#FFFBEB`, Text `#D97706`
  - 3. Red: Bg `#FEF2F2`, Text `#DC2626`
  - 4. Green: Bg `#F0FDF4`, Text `#16A34A`
  - 5. Purple: Bg `#FAF5FF`, Text `#9333EA`
  - 6. Blue: Bg `#EFF6FF`, Text `#2563EB`
  - 7. Orange: Bg `#FFF7ED`, Text `#EA580C`
- **Watch Now Pill:** Navy `#0B2545` with white text, font weight 600, 32px height
- **Locks:** Gray `#94A3B8` icon 16px
- **Continue Learning Button:** Navy `#0B2545` with hover `#143565`, white text, 44px min-height

---

## 3. Illustration Silhouettes
- **`books-subjects` (Style A):**
  - 3 books stacked:
    - Top: PARTNERSHIP (Navy `#0B2545`, gold foil letters)
    - Middle: COMPANY ACCOUNTS (Cream `#FFF8E7`, navy text)
    - Bottom: FINANCIAL STATEMENTS (Deep Navy `#071A36`, gold spine line)
- **`books-light` (Style B):**
  - 3 books stacked:
    - Top: ACCOUNTS (Light Sky Blue `#E0F0FE`, blue text)
    - Middle: PRACTICE (Soft Blue `#CBE5FE`, blue text)
    - Bottom: RESULTS (Steel Blue `#8DC3FB`, dark blue text)
  - Pale blue wave/cloud backdrop behind books
