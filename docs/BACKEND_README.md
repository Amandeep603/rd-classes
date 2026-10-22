# RD Classes — Backend Foundation & Architecture Guide

Welcome to the backend architecture and operations documentation for the **RD Classes Learning Platform**.

---

## 1. Environment Variables Table

| Variable | Type | Required | Description | Example / Notes |
|---|---|---|---|---|
| `MONGODB_URI` | `string` | **Yes** (Runtime) | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/rdclasses?retryWrites=true&w=majority` |
| `AUTH_SECRET` | `string` | **Yes** (Runtime) | Secret key for HMAC signing & tokens (>= 32 chars) | Random 64-char hex or base64 string |
| `NEXT_PUBLIC_SITE_URL` | `url` | **Yes** | Canonical site URL for redirects & WhatsApp links | `http://localhost:3000` or `https://rd-classes.in` |
| `VIMEO_ACCESS_TOKEN` | `string` | Optional | Personal access token with `video` scope for metadata autofill | e.g. `9f8e7d6c5b4a...` (degrades gracefully if missing) |
| `ADMIN_LOGIN_ID` | `string` | Scripts only | Initial admin login identifier | `admin` (used by `seed:admin`) |
| `ADMIN_PASSWORD` | `string` | Scripts only | Initial admin password (>= 8 chars) | `AdminPass123!` (used by `seed:admin`) |
| `MONGODB_URI_TEST` | `string` | Optional | Fallback MongoDB URI for unit/integration tests | If `mongodb-memory-server` binary is unavailable |

> **Note on Build Safety:** `src/server/env.js` employs lazy schema validation. Missing runtime secrets will NOT break `next build`, but will raise explicit descriptive errors at runtime when invoked.

---

## 2. Setup & Database Initialization

### A. MongoDB Atlas Configuration
1. Create a MongoDB Atlas M0 (Free) or dedicated cluster in the same AWS region as your Vercel deployment (e.g. `ap-south-1` Mumbai).
2. Under **Network Access**, add your developer IP or `0.0.0.0/0` (with strong user credentials).
3. Copy the SRV URI into `.env.local` as `MONGODB_URI`.

### B. Index Synchronization
To ensure production performance and disable Mongoose runtime `autoIndex`, compile and ensure all compound, unique, and TTL indexes are in place:
```bash
npm run db:indexes
```
This syncs:
- `User`: `{ loginId: 1 }` (unique), `{ role: 1, status: 1 }`
- `Device`: `{ userId: 1, deviceId: 1 }` (unique)
- `DeviceRequest`: `{ userId: 1, deviceId: 1 }` (unique where `status: "pending"`)
- `Session`: `{ tokenHash: 1 }` (unique), `{ userId: 1, deviceId: 1 }` (unique), `{ expiresAt: 1 }` (TTL: `expireAfterSeconds: 0`)
- `LoginAttempt`: `{ key: 1 }` (unique), `{ expireAt: 1 }` (TTL: `expireAfterSeconds: 0`)
- `Course`: `{ slug: 1 }` (unique)
- `Lecture`: `{ courseId: 1, order: 1 }`
- `Enrollment`: `{ userId: 1, courseId: 1 }` (unique)
- `Progress`: `{ userId: 1, lectureId: 1 }` (unique)
- `AuditLog`: `{ at: -1 }`, `{ actorId: 1 }`

### C. Admin Seeding
Create or update the administrator account with cost-12 bcrypt encryption:
```bash
npm run seed:admin
```

---

## 3. Data Models Architecture

All Mongoose models reside in `src/server/db/models/`:
- **`User`**: Core identity. Stores `role` (`student` \| `admin`), `loginId` (unique, lowercase, 4–30 alphanumeric), `passwordHash`, `status` (`active` \| `blocked`), `deviceLimit` (1..3, default 1), `deviceCount` (atomic slot counter), `mustChangePassword`, and `lastLoginAt`.
- **`Device`**: Registered hardware/browser fingerprint. Stores `userId`, `deviceId` (UUID v4), `label` (e.g., `"Chrome on Windows"` parsed via `ua-parser-js`), initial `ip`, `approvedAt`, `approvedBy`, and `lastUsedAt`.
- **`DeviceRequest`**: Pending device approval queue. Stores `userId`, `deviceId`, `label`, `ip`, `userAgent`, `status` (`pending` \| `approved` \| `rejected`), `resolvedAt`, and `resolvedBy`.
- **`Session`**: Active login tokens. Stores `userId`, `deviceId`, `tokenHash` (SHA-256 of random 32-byte token), `lastSeenAt` (throttled updates), and `expiresAt` (30 days for students, 8 hours for admins).
- **`LoginAttempt`**: Brute-force throttling. Tracks failed attempts by `u:<loginId>` and `ip:<address>` with 15-minute lockouts.
- **`Course`**: Curriculums with `title`, `slug`, `thumbnail`, `published`, and `order`.
- **`Lecture`**: Video chapters referencing courseId with `vimeoId`, `vimeoHash`, `durationSec`, `isPreview`, and `order`.
- **`Enrollment`**: Student-course access entitlement with `status` (`active` \| `revoked`), `startsAt`, `expiresAt`, and `assignedBy`.
- **`Progress`**: Lecture playback bookmarks with `positionSec`, `durationSec`, and `completed` (auto-marked >= 90%).
- **`AuditLog`**: Administrative event history for every approval, block, limit change, and device removal.

---

## 4. Single-Device Lock & Authentication Flowchart

```text
               +----------------------------------+
               |  Student submits Login Form      |
               |  (loginId, password)             |
               +-----------------+----------------+
                                 |
                                 v
               +----------------------------------+
               | Rate limit check (LoginAttempt)  |
               | >= 5 fails / 15m => Locked       |
               +-----------------+----------------+
                                 | OK
                                 v
               +----------------------------------+
               | Verify password (bcrypt cost 12) |
               | (Dummy hash run if ID not found) |
               +-----------------+----------------+
                                 | Valid & Active
                                 v
               +----------------------------------+
               | Read / Generate rd_device Cookie |
               | (HMAC-SHA256 signature verified) |
               +-----------------+----------------+
                                 |
        +------------------------+------------------------+
        |                                                 |
        v [Case A: Device Approved]                       v [Device Not Registered]
+----------------------------------+             +----------------------------------+
| Device exists for (User, Device) |             | Check user.deviceCount === 0?    |
+-----------------+----------------+             +-----------------+----------------+
                  |                                                |
                  |                               +----------------+----------------+
                  |                               | YES                             | NO
                  v                               v (Auto-first-login)              v
+----------------------------------+   +-------------------------------+   +-------------------------------+
| - Revoke old session on device   |   | Atomic increment deviceCount: |   | NO session issued             |
| - Issue new rd_session (30 days) |   | {$inc: {deviceCount: 1}}      |   | Create/reuse DeviceRequest    |
| - Update lastUsedAt, lastLoginAt |   | Register Device ('auto-login')|   | Redirect to:                  |
| - Redirect to /student           |   | Issue rd_session -> /student  |   | /student/login/pending        |
+----------------------------------+   +-------------------------------+   +-------------------------------+
                                                                                           |
                                                                                           v
                                                                           +-------------------------------+
                                                                           | Admin reviews in Dashboard:   |
                                                                           | Choice 1: Add (if slot free)  |
                                                                           | Choice 2: Replace old device  |
                                                                           | Choice 3: Raise limit & add   |
                                                                           +-------------------------------+
```

---

## 5. Admin Runbook

### Scenario A: Student Lost Phone or Bought a New Device
1. Open Admin Dashboard at `/admin/students`.
2. Search student by name or login ID and click to view their detail page (`/admin/students/[id]`).
3. Under **Registered Devices**, you have two options:
   - **Option 1 (Targeted Removal):** Click **Remove** next to the lost device. This revokes the device's session, deletes the device record, and decrements `deviceCount`. The student's free slot is immediately open for their new device.
   - **Option 2 (Complete Reset):** Click **Reset All Devices**. This wipes all registered devices, revokes all sessions, and resets `deviceCount = 0`. The student's very next login on any device will auto-register as their primary device.

### Scenario B: Student Has a Pending Device Request
1. Navigate to `/admin/device-requests` (the sidebar shows a badge for pending count).
2. Locate the student's request. Review the device label (e.g. `Mobile Safari on iPhone`), IP address, and timestamp.
3. Click **Approve**. A dialog presents three intelligent options:
   - **Add to free slot:** Active if `deviceCount < deviceLimit`.
   - **Replace existing device:** Select which older device to kick out. The chosen device's active session is terminated instantly.
   - **Increase limit and approve:** Raises student's `deviceLimit` (up to 3) and approves the device in a single atomic transaction.
4. Click **Confirm & Approve**. The student can now log in immediately on that device.

### Scenario C: Blocking a Misbehaving Student / Revoking Access
1. In `/admin/students/[id]`, click **Block Student**.
2. This atomically changes status to `blocked` and deletes **all active sessions** across all devices.
3. Any subsequent page request or video stream attempt from that student will immediately kick them to the login screen.

---

## 6. Vercel Deployment & Region Alignment

1. **Function Region:**
   - Configure your Vercel Project Settings > **Functions** > **Function Region** to `ap-south-1` (Mumbai) or the exact region hosting your MongoDB Atlas cluster.
   - Minimizing network latency between Vercel Serverless Functions and Atlas ensures token verification and throttled progress updates execute in `< 15ms`.
2. **Environment Variables:**
   - Add `MONGODB_URI`, `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`, and optionally `VIMEO_ACCESS_TOKEN` in the Vercel dashboard.
3. **Static Optimization Integrity:**
   - The marketing Home page (`/`) is statically rendered at build time (`○ (Static)`).
   - Dynamic routes under `/student` and `/admin` run server-side with zero risk of static leak or hydration failure.

---

## 7. Known Security Limits & Architectural Boundaries

1. **Browser-Cookie Identity:**
   - Device identity is cryptographically tied to the `rd_device` signed cookie.
   - If a student clears cookies, uses Incognito/Private browsing, or switches from Chrome to Edge on the same laptop, the browser is recognized as an unapproved device and requires administrative approval. This is an intentional security design to prevent account sharing.
2. **Cookie Theft vs Watermark Defense:**
   - While an attacker could hypothetically extract cookies via local browser inspection, sessions are locked to the registered `deviceId`. An unregistered machine cannot reuse the session token without the matching device token.
   - All Vimeo video playback is covered with a semi-transparent, dynamic floating **Watermark** displaying `<Student Name> · <Login ID>`, moving randomly every 8 seconds to prevent recording redistribution.
3. **Screen Recording:**
   - No browser technology (including DRM or Widevine) can completely prevent external screen recording software or smartphone cameras pointed at a display. The floating dynamic watermark and single-device lock provide the strongest legal and deterrence guarantees available for web streaming.
