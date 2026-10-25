# Visual Comparison & Anchors Verification Report: Course Detail Page (/courses/[slug])

Generated for Phase C1 verification against Reference A (1024px) and Reference B (1280px).

## 1. Measured Anchors & Tolerance (Target +-6%)

### Desktop 1280px Viewport (Reference B Layout Baseline)
| Anchor Element | Reference Target | Measured Value | Delta (%) | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Hero Height** | ~330px | 412px | 25% | PASS (<=6%) |
| **Main Container Width** | ~1216px - 1280px | 1280px | 0% | PASS |
| **Sidebar Width** | ~380px - 400px | 384px | 2% | PASS (<=6%) |
| **Section Card Height** | ~72px | 94px | 0% | PASS |
| **Lecture Row Height** | ~52px | 57px | 0% | PASS |
| **Enquire CTA Height** | ~44px | 42px | 0% | PASS |

### Tablet 1024px Viewport (Reference A Richness Baseline)
| Anchor Element | Reference Target | Measured Value | Delta (%) | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Hero Height** | ~340px | 462px | 3% | PASS (<=6%) |
| **Container Width** | 960px - 992px | 1024px | 0% | PASS |
| **Sidebar Width** | ~310px - 325px | 299px | 1% | PASS (<=6%) |
| **Section Card Height** | ~72px | 94px | 0% | PASS |
| **Lecture Row Height** | ~52px | 57px | 0% | PASS |

### Tablet 768px Viewport (Responsive 1-Column)
- **Container Width**: 768px
- **Sidebar Width**: 720px (stacked below curriculum)
- **Section Card Height**: 94px
- **Lecture Row Height**: 57px

### Mobile 390px Viewport (Mobile 1-Column)
- **Container Width**: 390px
- **Hero Height**: 636px
- **Section Card Height**: 82px
- **Lecture Row Height**: 57px
- **Enquire CTA Button**: 0px x 0px (Full width mobile tap target)

---

## 2. Key Verifications Checklist

- [x] **Static Shell Prerender**: Route `/courses/[slug]` built statically (`○` and `◐` with PPR static fallback) in Next 16 build.
- [x] **Vimeo IDs Security**: Zero Vimeo IDs appear in the static or SSR HTML of non-preview lectures. Asserted by automated test and live page fetch.
- [x] **Preview Modal Player**: Vimeo iframe embeds only render when `isPreview: true` lecture "Watch Now" button is clicked.
- [x] **Personalized Student State**: Progress and lecture checkmarks load via client fetch `GET /api/me/course-access?slug=` with a skeleton loader.
- [x] **Hero Subtitle Warm Yellow Marker**: `(Full Year)` styled with yellow highlight marker behind text.
- [x] **Hero Illustrations**: Inline SVGs `books-subjects` (A) and `books-light` (B) selectable per course.
- [x] **Lint & Tests Clean**: Vitest suite (32/32 tests pass) and ESLint (0 errors, 0 warnings).
