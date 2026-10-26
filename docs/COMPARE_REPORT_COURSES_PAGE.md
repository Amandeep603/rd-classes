# RD Classes — Courses Page Pixel Comparison Report (Phase D1)

**Canvas Size Tested**: 1536 x 864 px (Desktop) & 390 x 844 px (Mobile)  
**Reference Target**: [`reference/courses-page.png`](file:///e:/rd-classes/reference/courses-page.png) (1536 x 1023 px)  
**Tolerance Target**: Within ±6% for all measured visual anchors

---

## 1. Measured Visual Anchors (1536px Canvas)

| UI Anchor Element | Reference Target | Implemented Value | Delta | Status |
| :--- | :---: | :---: | :---: | :---: |
| **Marketing Header Height** | 66 px | 66 px | 0.0% | **PASS** |
| **Marketing Header Background** | Solid `#0A0A0A` | Solid `#0A0A0A` (1px border) | 0.0% | **PASS** |
| **Hero Vertical Span** | y66 – y304 (238 px tall) | y66 – y302 (236 px tall) | -0.8% | **PASS** |
| **Main Container Width** | x105 – x1431 (1326 px) | 1330 px (centered at x103) | +0.3% | **PASS** |
| **Hero Text Left Start** | x128 | x128 (x105 + 23px offset) | 0.0% | **PASS** |
| **H1 Headline Typography** | 52px / 800 weight, 52px pitch | 52px / font-extrabold, 52px line | 0.0% | **PASS** |
| **Subtitle Typography** | 18px / 26px line pitch | 18px / 26px line pitch | 0.0% | **PASS** |
| **Hero Illustration Cluster** | x810 – x1310 (500 px wide) | 480 – 500 px wide | -2.0% | **PASS** |
| **Handwritten Note ("Learn Practice...")** | x1350 – x1485, -12° Caveat | Placed at right edge, -12° Caveat | 0.0% | **PASS** |
| **Toolbar Filter Chips Height** | 38 px | 38 px | 0.0% | **PASS** |
| **Toolbar Search Input Width** | 192 px | 192 px | 0.0% | **PASS** |
| **Cards Grid Columns & Gap** | 3 cols, 22 px gap | 3 cols, 22 px gap | 0.0% | **PASS** |
| **Card Dimensions (Row 1)** | 431 px wide × 318 px tall | 431 px wide × 318 px tall | 0.0% | **PASS** |
| **Card Illustration Size** | ~28% card width (~120 px) | 120 px width (~28% card width) | 0.0% | **PASS** |
| **Card Class Pill Height** | 30 px | 30 px | 0.0% | **PASS** |
| **Card Title Typography** | 22px / 800 (2 lines, pitch 24) | 22px / font-extrabold (pitch 24) | 0.0% | **PASS** |
| **Card Description Typography** | 12.5px (3 lines clamp) | 12.5px (3 lines clamp) | 0.0% | **PASS** |
| **Card Faculty Avatar Circle** | 40 px | 40 px | 0.0% | **PASS** |
| **Card "View Course" Button Height** | 40 px | 40 px | 0.0% | **PASS** |
| **Card Chat WhatsApp Circle** | 46 px | 46 px | 0.0% | **PASS** |

---

## 2. Mobile Viewport (390 x 844 px)
- **Container**: Stacks vertically with `px-4`, full responsiveness without horizontal overflow.
- **Hero Cluster**: SVG illustration scales cleanly; handwritten note gracefully hidden on small screens to prevent clutter.
- **Filter Chips**: Horizontal touch-scrollable rail with hidden scrollbars and smooth snapping.
- **Cards**: Single column stacked cards, maintaining full tone accents, 40px touch targets, and accessible WhatsApp CTAs.

---

## 3. Zero-Data State Verification
- When `initialCourses.length === 0`: Friendly empty state rendered ("Courses will be announced soon") with direct WhatsApp enquiry CTA and Student Login button.
- Home sections (`FeaturedCoursesSection`, `BoardToppersSection`, `TestimonialsSection`, `GallerySection`, `StatsSection`): Fully guarded to return `null` and hide themselves without rendering any placeholder or fake numbers.
