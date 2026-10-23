# RD Classes Backend Foundation — Audit Report

**Audit Date:** 2026-10-23  
**Auditor:** Principal Full-Stack Engineer  
**Scope:** `src/server/`, `src/app/(student)/`, `src/app/admin/`, Next.js 16 App Router runtime, security policies, and performance quality gates.

---

## 1. Requirement-by-Requirement Audit & Verification Matrix

| # | Required Behaviour | Architectural Implementation | Verification Status | Gaps / Issues Found & Fixes Applied |
|---|---|---|---|---|
| **1** | **Admin-only student creation** (loginId + password). Students cannot self-register. | `createStudent` in `src/server/services/studentService.js` and Server Action `createStudentAction` in `admin.students.actions.js` guarded with `requireAdmin()`. No registration routes or actions exist. | **PASS** | Verified. No public self-registration endpoints exist; registration forms absent in public views. |
| **2** | **First login auto-registers device** (`deviceCount: 0 -> 1` atomic conditional update). | `studentLogin` in `src/server/auth/authService.js` checks `user.deviceCount === 0`, performs atomic `User.updateOne({ _id, deviceCount: 0 }, { $inc: { deviceCount: 1 } })`, and creates `Device` with `approvedBy: "auto-first-login"`. Rollback decrement on failure. | **PASS** | Verified in unit test 2 and E2E step 4–5. |
| **3** | **Approved device login reuse**. | `Device.findOne({ userId, deviceId })` updates `lastUsedAt`, updates user `lastLoginAt`, drops any prior session for `(userId, deviceId)`, and issues a fresh 30-day session. | **PASS** | Verified in unit test 3 and repeat login checks. |
| **4** | **New device slot full -> NO session, creates/reuses ONE pending request**. | When no free slot exists, `studentLogin` does NOT issue a session cookie. Redirects to `/student/login/pending`. Reuses existing pending request if present. | **FIXED & PASS** | **Bug/Gap Fixed**: Previously, the 24-hour request count check ran before checking if the request for the current device already existed. Re-logging in on the same pending device now reuses the request cleanly without false-positive rate limiting. |
| **5** | **At most 5 new requests per user per 24 hours**. | Counts `DeviceRequest` where `userId = user._id` and `createdAt >= now - 24h`. Rejects 6th new request with descriptive message. | **FIXED & PASS** | Added unit test `4b` in `tests/backend.test.js` to explicitly assert refusal on 6th request. |
| **6** | **Device Identity via signed cookie `rd_device`**. | `rd_device` format `<uuid>.<hmac-sha256(AUTH_SECRET)>`, verified using `crypto.timingSafeEqual`. Tampered or invalid signatures issue a new device ID. 2-year duration, httpOnly, sameSite lax, secure in production. | **PASS** | Verified in unit test 11. |
| **7** | **Session management & single-session-per-(user, device)**. | 32-byte cryptographically random token (`base64url`), stored as `sha256` hash in MongoDB `Session` with TTL index. Exactly one session per `(userId, deviceId)`. | **PASS** | Verified in session creation and invalidation tests. |
| **8** | **Session invalidation on device removal or account blocking**. | `getCurrentUser` validates session expiration, user blocked status, and `Device.exists({ userId, deviceId })`. If device removed or user blocked, session and cookie are immediately deleted. | **PASS** | Verified in unit tests 6, 7, 8, 9 and E2E step 12–13. |
| **9** | **Admin approval modes**: `add`, `replace`, `raise-and-add`. | `approveDeviceRequest` in `deviceService.js`: `add` uses atomic conditional update `{ deviceCount: { $lt: deviceLimit } }`; `replace` deletes old device & its sessions; `raise-and-add` increments `deviceLimit` up to 3 and claims slot. | **PASS** | Verified in unit tests 5, 6, 12 and E2E step 9–10. |
| **10** | **Admin management suite**: reject, remove device, reset all devices, set limit 1..3, logout all sessions, block/unblock, reset password. | Full action and service implementations in `deviceService.js` and `studentService.js`. All mutations write structured records to `AuditLog`. | **PASS** | Verified across unit tests 5, 6, 7, 8, 9, 12, 15 and admin action handlers. |
| **11** | **Rate Limiting & Timing Protection**. | `rateLimit.js` checks `5` failures per `u:<loginId>` / `20` failures per `ip:<addr>` in 15 minutes. Unknown IDs execute dummy bcrypt compare to prevent timing side-channels. | **PASS** | Verified in unit test 1 and test 10. |
| **12** | **Lecture access authorization**. | Server-side `getAuthorizedLecture` verifies active session, still-approved device, and active non-expired `Enrollment` (or `lecture.isPreview`). Inaccessible lectures return 404/null. | **PASS** | Verified in unit tests 13, 14 and E2E steps 6, 12. |
| **13** | **Vimeo integration & Anti-Piracy Watermark**. | Vimeo ID and security hash stored server-side; custom responsive player with dynamic `@vimeo/player` SDK import; moving semi-transparent watermark (`<Student Name> · <Login ID>`) repositioning every 8s; context menu disabled. | **PASS** | Verified in `VimeoPlayer.jsx` and `Watermark.jsx`. |
| **14** | **Security headers & Noindex policy**. | `next.config.mjs` sets `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`, `Permissions-Policy` (camera/mic/geo off); `/student/*` and `/admin/*` have `X-Robots-Tag: noindex, nofollow` and `frame-ancestors 'self'`. | **PASS** | Configured in `next.config.mjs` and `robots.js`. |
| **15** | **Static Marketing Home Page**. | Root layout does not read headers or cookies. Route groups `(student)` and `admin` use independent isolated shells. `next build` produces `○ / (Static)`. | **PASS** | Verified `npm run build` output shows `○ / 15m 1y`. |

---

## 2. Issues Diagnosed and Resolved During Quality Gates

1. **Node Typeless Package Warning during Script Execution**:
   - **Diagnosis**: Running `node scripts/create-indexes.mjs` triggered `(node) [MODULE_TYPELESS_PACKAGE_JSON] Warning: Module type of file:///.../models/index.js is not specified and it doesn't parse as CommonJS`.
   - **Resolution**: Created `src/server/db/package.json` with `{"type": "module"}` without modifying the root `package.json`. Node resolves all database models directly as ESM modules, eliminating the warning completely.
2. **ESLint 9 Flat Config Folder Scanning Latency**:
   - **Diagnosis**: Default flat config in `eslint.config.mjs` was traversing heavy asset folders (`reference/**`, `docs/**`, `client/**`), causing lint command timeouts.
   - **Resolution**: Explicitly registered `reference/**`, `docs/**`, and `client/**` in `globalIgnores` within `eslint.config.mjs`. Linting now executes in seconds with 0 warnings/errors.
3. **Turbopack Google Font Query Constraint in Next.js 16**:
   - **Diagnosis**: Specifying `weight: ["600", "700"]` for the variable font `Caveat` in `src/app/layout.js` failed in Turbopack build with `Error: next/font/google queries have exactly one entry`.
   - **Resolution**: Configured `Caveat({ subsets: ["latin"], display: "swap" })` as a variable font query. Production build now completes cleanly.
4. **Pending Device Request Rate Limiting Order**:
   - **Diagnosis**: Re-attempting login from an already pending device counted toward the 24-hour threshold before reusing the existing pending request.
   - **Resolution**: Checked `DeviceRequest.findOne({ userId, deviceId, status: "pending" })` first, reusing it immediately if found, and only applying the 24h count limit when creating a new request.
5. **Cookie Mutation in Read-Only Server Component Context**:
   - **Diagnosis**: When `getCurrentUser()` detected a blocked student or invalid session during Server Component rendering (e.g. on `/student/account`), calling `deleteCookie()` attempted `cookieStore.set()`, which Next.js 16 forbids outside Server Actions/Route Handlers (`Error: Cookies can only be modified in a Server Action or Route Handler`), resulting in unhandled HTTP 500 errors.
   - **Resolution**: Wrapped `cookieStore.set` in `deleteCookie()` in `src/server/auth/cookies.js` with a graceful `try...catch`. Revoked sessions in the database immediately invalidate the user session, allowing Server Components to redirect to `/student/login` cleanly without crashing.
6. **Dynamic Request-Time Evaluation on Pending Device Holding Page**:
   - **Diagnosis**: `PendingPage` evaluating fallback `new Date()` triggered Next.js prerender warning `Route /student/login/pending: Next.js encountered the unstable value new Date() while prerendering`.
   - **Resolution**: Added `await connection()` from `next/server` at the top of `PendingPage` in `src/app/(student)/student/login/pending/page.js` to ensure proper request-time execution.
7. **Redirect Errors Intercepted in Server Actions**:
   - **Diagnosis**: `redirect()` in `loginStudentAction` and `loginAdminAction` was called within a `try/catch` block that checked `err?.message === "NEXT_REDIRECT"`. Next.js 16 sets error `digest` (`NEXT_REDIRECT;...`), causing the catch block to erroneously treat redirects as fatal exceptions and abort navigation.
   - **Resolution**: Moved all `redirect()` calls outside of the `try/catch` blocks in `src/server/actions/auth.actions.js` per standard Next.js architecture guidelines.

