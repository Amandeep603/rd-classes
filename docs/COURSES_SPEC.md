# Courses Specification & Measurements

**Generated Date:** 2026-10-25  
**Reference Sources:**
- `reference/courses-home-cards.png` (measured at 1600px canvas width)
- `reference/courses-page.png` (measured at 1536px canvas width)

---

## 1. Palette & Tone Tokens

Measured with Pillow sample analysis, applying the WCAG AA & deepened-palette rules (slight saturation boost, avoiding washed-out tints):

| Tone | Card Gradient / Tint (Top -> Bottom) | View Course Button Fill | Button Text | Chat Button Fill (Home / Catalog) | Badge Fill / Text |
|---|---|---|---|---|---|
| **sky** | `#D8ECFB` -> `#FFFFFF` | `#0B2A5B` | `#FFFFFF` | `#E3F2FD` (Home) / `#0B2A5B` (Catalog) | `#0B2A5B` / `#FFFFFF` (Navy crown) |
| **yellow** | `#FFF2C6` -> `#FFFFFF` | `#FFC21A` | `#1E293B` | `#FEF3C7` (Home) / `#FFC21A` (Catalog) | `#FFC21A` / `#1E293B` |
| **orange** | `#FFE3D4` -> `#FFFFFF` | `#F97316` | `#FFFFFF` | `#FFEDD5` (Home) / `#F97316` (Catalog) | `#F97316` / `#FFFFFF` |
| **green** | `#DCF4E9` -> `#FFFFFF` | `#0E7A57` | `#FFFFFF` | `#E1F7EC` (Home) / `#0E7A57` (Catalog) | `#1F9D6B` / `#FFFFFF` |
| **purple** | `#EAE4FC` -> `#FFFFFF` | `#6D4AE0` | `#FFFFFF` | `#F0ECFD` (Home) / `#6D4AE0` (Catalog) | `#6D4AE0` / `#FFFFFF` |
| **red** | `#FFE2E1` -> `#FFFFFF` | `#E5392E` | `#FFFFFF` | `#FEE8E7` (Home) / `#E5392E` (Catalog) | `#E5392E` / `#FFFFFF` |

---

## 2. Card Variant: "home" (Home Featured Section)

- **Canvas Reference:** 1600px width.
- **Section Grid:** 3 columns at desktop, gap 24px, container max-width 1500px, horizontal padding ~48px.
- **Card Box:** Width ~475px - 481px, Height ~525px, Border radius `24px` (`rounded-3xl`), border `1px solid rgba(226, 232, 240, 0.8)`, shadow `0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03)`.
- **Banner Area (Top):**
  - Height: ~165px.
  - Background: Soft tone tint (`data-tone`).
  - Top Pill Row: Class Pill on top-left (e.g., "Class 12", `rounded-full`, bg `rgba(255,255,255,0.85)`, font 12px font-semibold `#1E293B`), Badge Pill on top-right (e.g. "Most Popular" with crown icon, bg `#0B2A5B` text `#FFF`, font 12px font-semibold).
  - Title: 2 lines. First line bold (22px, font-bold, `#0F172A`), subtitle in lighter weight (18px, font-normal, `#475569`).
  - Illustration: Right-aligned, overlapping bottom edge of banner, dimensions ~130x110px.
- **Body Area (Bottom):**
  - Background: `#FFFFFF`.
  - Description: 3 lines clamp, font 14px, line-height 1.5, color `#5B6676`.
  - Divider: `1px solid #F1F5F9`.
  - Meta Row: Left icon tile (video/file/clock) + text ("Full Year + 136 Videos"), right globe icon + text ("Bilingual"), font 13px, color `#475569`.
  - Divider: `1px solid #F1F5F9`.
  - Faculty Row: Circular avatar with gold gradient ring (38px diameter), fallback "RD", name "Ronak Dugar" (14px font-bold `#0F172A`), subtitle "Lead Accountancy Faculty" (12px `#64748B`).
  - Footer Action Row:
    - Primary "View Course ->" pill button: Height 48px, rounded-full, tone background, font-semibold 14px, arrow nudge on hover.
    - Chat Button: 48px diameter circle, rounded-full, soft tone fill with matching icon color, WhatsApp deep-link.

---

## 3. Card Variant: "catalog" (Public /courses Page)

- **Canvas Reference:** 1536px width.
- **Section Grid:** 3 columns, cards width ~431px, height ~320-330px, gap 22px.
- **Card Box:** Whole card tinted with vertical gradient `var(--tone-light)` -> `#FFFFFF`, border radius `20px` (`rounded-2xl`), border `1px solid rgba(226, 232, 240, 0.7)`.
- **Top Row:** Class pill left ("Class 12", `12px`), Badge pill right ("Most Popular", "Foundation Course", "Crash Course", "Recorded Portal", "Test Series", `12px`).
- **Content:**
  - Title: Left aligned, 20px font-bold `#0F172A`, subtitle lighter.
  - Illustration: Right aligned, ~110x90px inline SVG.
  - Description: 2 lines clamp, 13.5px `#5B6676`.
  - Meta row: Meta item + Language item.
  - Faculty row: Yellow circle avatar ("RD") + Ronak Dugar / Lead Accountancy Faculty.
  - Footer Action Row: Solid tone "View Course ->" button + solid tone circular chat button with white WhatsApp icon.

---

## 4. Public /courses Page Layout

- **Canvas Reference:** 1536px width.
- **Background:** Subtle warm cream gradient: `radial-gradient(ellipse at top, #FFFDF8 0%, #FAF6EE 100%)`.
- **Hero Section:**
  - Eyebrow: "OUR COURSES" (13px, bold, tracking-wider `#64748B`) with small yellow horizontal bar (`w-8 h-1 bg-[#FFC21A] rounded`).
  - Heading: "Structured Courses for <Class 11 & 12> Accountancy." (font-extrabold 52-54px at 1536px, line-height 1.15, text `#0F172A`, accent `<Class 11 & 12>` in `#FFB800`).
  - Subtitle: "Learn with concept clarity, practice, and personalised guidance from Ronak Sir. Choose the course that fits your preparation goals." (18px, 2 lines, `#5B6676`, max-w-2xl).
  - Hero Right Graphic:
    - Pale yellow circle glow behind illustration (`#FEF3C7` ~380px).
    - Inline SVG illustration cluster: potted plant, 3 stacked books (ACCOUNTS / PRACTICE / RESULTS in cream `#FFF9E6`, yellow `#FFC21A`, navy `#0B2A5B`), pen cup.
    - Handwritten badge: Caveat font, rotated ~ -12deg, "Learn / Practice / Score Higher" with curved yellow underline accent.
- **Toolbar:**
  - Category Filter Chips: "All Courses" (active `#FFC21A`), "Class 12 CBSE", "Class 11 Foundation", "Recorded Portal", "Test Series", "Crash Courses". Pill buttons, height 38px, horizontal scroll on mobile with edge mask.
  - Search Input: "Search courses...", icon left, pill rounded, height 42px.
  - Sort By: Select dropdown ("Most Popular", "Newest", "A-Z"), height 42px.
- **Catalog Grid:**
  - 3 columns (lg >= 1024px), 2 columns (md 640px - 1023px), 1 column (< 640px).

---

## 5. Built-in Illustrations Reference List
1. `books-blue`: Stack of blue accountancy hardcover books labelled "ACCOUNTANCY".
2. `open-book`: Open textbook with pages and gold pen.
3. `revision-plan`: Spiral notepad titled "Revision Plan" with checkboxes and pencil.
4. `target`: 3D-styled orange dartboard target with arrow in bullseye.
5. `laptop-play`: Modern laptop displaying a large play button on screen.
6. `checklist-clock`: Purple/indigo clipboard with test checklist next to a desktop clock.
7. `notebook-red`: Red spiral-bound revision notebook with pen.
