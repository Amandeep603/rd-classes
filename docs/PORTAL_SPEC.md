# RD Classes Portal Design System Specification

**Reference Canvases:** `reference/student-dashboard.png` (1536x1024) and `reference/admin-dashboard.png` (1536x1024)  
**Measured Tolerance:** Target elements match reference layouts within ±6% across all viewports.

---

## 1. Global Typography & Core Theme Tokens

- **Font Family:** Plus Jakarta Sans (`var(--font-plus-jakarta-sans)`, fallback system-ui)
- **Fluid Layout Max Width:** 1536px desktop container.

### Colors & Tints

| Role / Element | Hex / Gradient | Notes |
|---|---|---|
| **Student Page Background** | `#FDF9F0` | Soft warm cream with subtle `#EAF4FC` wash on left |
| **Student Sidebar Background** | `linear-gradient(180deg, #E6F3FD 0%, #FBF8EF 100%)` | Floating pill container, radius 32px |
| **Student Active Nav Item** | `linear-gradient(135deg, #FFD54A 0%, #FFC21A 100%)` | Radius 14px, text `#0B0C0E` font-weight 700 |
| **Student Inactive Nav Item** | `#4B5563` hover `#111827` | 17px / font-weight 500 |
| **Admin Sidebar Background** | `linear-gradient(180deg, #0F1B2D 0%, #0B1424 100%)` | Dark navy, 279px width full height |
| **Admin Topbar Background** | `#FFFFFF` | Height 78px, border-b `1px solid #EAECEF` |
| **Admin Content Background** | `#FBF8F1` | Warm neutral administration background |
| **Admin Active Nav Item** | `#FFC21A` | Text `#0B0C0E` font-weight 700, radius 14px |
| **Admin Red Count Badge** | `#E5432D` | 22px circle, text `#FFFFFF` |
| **Admin Welcome Banner** | `linear-gradient(135deg, #FFF6DE 0%, #FFF1CE 100%)` | Radius 24px, border `1px solid #F5E8C8` |
| **Gold Name Gradient** | `linear-gradient(135deg, #B7791F 0%, #E8A317 100%)` | Clip to text for admin greeting |
| **Student Syllabus Card** | `linear-gradient(150deg, #0B2A47 0%, #051A2E 100%)` | Dark navy, radius 22px |
| **Student Announcement** | `linear-gradient(135deg, #FFF3C9 0%, #FFF8E0 100%)` | Border `#F6DFA0`, radius 22px |
| **Stat Tint Blue** | `#E7F3FD` / border `#CFE7FA` | Text `#0369A1` |
| **Stat Tint Yellow** | `#FFF5D6` / border `#FCE7A5` | Text `#B45309` |
| **Stat Tint Peach/Red** | `#FFEBDD` / border `#FDCBAF` | Text `#C2410C` |
| **Stat Tint Indigo** | `#EEF2FF` / border `#D9E2FE` | Text `#4338CA` |
| **Stat Tint Green** | `#ECFDF5` / border `#C6F6D5` | Text `#047857` |
| **Stat Tint Purple** | `#FAF5FF` / border `#E9D5FF` | Text `#7E22CE` |

---

## 2. Student Portal Dimensions (1536x1024 Canvas)

1. **Floating Sidebar**:
   - Placement: `x: 18px`, `width: 256px`, `height: calc(100vh - 36px)`, `border-radius: 32px`
   - Border: `1px solid rgba(0, 0, 0, 0.05)`
   - Brand logo tile: `44px` icon + "RD Classes" 22px/700 + "STUDENT PORTAL" 12px/800 letter-spacing `0.12em`
   - Active Nav Button: `226px x 49px`, radius 14px, font 17px/700
   - Bottom Card: Illustration of books and leaves with "Consistent Learning Brighter Results"
   - WhatsApp Button: Full-width green chip `#25D366` hover `#20BD5A`
2. **Topbar**:
   - Greeting: "Hi <Name> 👋" (28px / 800)
   - Class Chip: "Class 12" `#FFE8A3` background, text `#784D00` (14px / 700)
   - Subtitle: "Class 12 Comprehensive Accountancy (Full Syllabus)" (16px / muted `#6B7280`)
   - Search: `327px x 46px`, radius 23px, pill border `#E5E7EB`
   - Notifications Bell: 50px circle, `#FFFFFF` with shadow
   - Avatar: 50px circle pill with initial and chevron
3. **Announcement Banner**:
   - Dimensions: `1195px x 96px`, radius 22px
   - Megaphone circle: 56px `#FFB800`
   - Badge: "ANNOUNCEMENT" 11.5px/800
   - Title: 19px/800, body 15px muted, dismiss button on right
4. **Main Grid Cards**:
   - Resume Card: `760px x 327px`, white `#FFFFFF`, radius 22px, progress track 8px, `#FFB800` fill
   - Syllabus Card: `414px x 327px`, dark navy `#0B2A47`, circular SVG progress ring 130px, cash reward chip
   - 3 Stat Cards: `372px..410px x 95px`, radius 20px, icon tile 46px, arrow circle 32px
   - Upcoming Test Card: `531px x 281px`, white `#FFFFFF`, radius 22px, calendar date tile 80px x 90px
   - Recently Uploaded Notes Card: `640px x 281px`, white `#FFFFFF`, radius 22px, 3 rows with View and Download actions (feature-gated)

---

## 3. Admin Portal Dimensions (1536x1024 Canvas)

1. **Sidebar**:
   - Width: `279px`, full height `100vh`
   - Background: `#0F1B2D` -> `#0B1424`
   - Brand: Yellow 44px logo tile "RD", "RD CLASSES" + yellow-tint "ADMIN" chip, "Management Suite" 14px
   - Nav items: `244px x 45px`, 16.5px / 500, white 80%; active: `#FFC21A` dark 700 text, radius 14px, soft glow
   - Red count badge: 22px circle `#E5432D`
   - Admin Footer: 48px avatar "RD", "Ronak Dugar" 14px/700, "Administrator" 12px, logout icon
2. **Topbar**:
   - Height: `78px`, `#FFFFFF`
   - Breadcrumb/Title: "ADMIN PORTAL" 14px/700, letter-spacing `0.12em`
   - Workspace Pill: "Ronak Sir Workspace" with green shield-check icon
   - Actions: "View Public Website" outlined button, notifications bell with orange dot, avatar pill
3. **Welcome Banner**:
   - Dimensions: `1200px x 195px`, gradient `#FFF6DE` -> `#FFF1CE`
   - Sparkles Chip: "RD Classes Management Console"
   - Heading: "Welcome back, <Name>" (46px/800) with gold gradient `#B7791F` -> `#E8A317`
   - Quick Action Buttons: "+ Add Student" (186px x 44px, `#FFB800`), "Upload Photo", "Add Topper"
   - Masked desk illustration (`public/images/admin/banner-desk.webp`) on right
4. **Stat Row**:
   - Six stat tiles: `~187px x 140px` with gap `17px`
   - Values: 28px / 800, labels: 15px muted, icon tile 46px, arrow circle 30px
5. **Dashboard 2-Column Split**:
   - Left Column: `763px` wide
     - Device Approval Requests Card: avatar, name, studentCode chip, device label, relative time, italics note, Approve & Reject buttons
     - Recent Activity Card: AuditLog records with friendly sentences and icons
   - Right Column: `416px` wide
     - Featured Toppers / Courses Overview
     - Result PDFs / Announcements

---

## 4. Responsive Breakpoints

- **Desktop (>=1280px)**: Full layout as designed on 1536 canvas.
- **Laptop (1024px – 1279px)**: Fluid narrower cards, stat tiles wrap 3x2, right column wraps below.
- **Tablet (<1024px)**: Admin sidebar becomes drawer with topbar hamburger; Student sidebar becomes fixed bottom tab bar.
- **Mobile (<640px)**: Single column, tables convert to stacked cards, dialogs convert to bottom sheets, minimum 44px tap targets.
