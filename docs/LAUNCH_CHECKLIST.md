# RD Classes — Production Launch Checklist

This checklist provides Sir / administrators with exact step-by-step guidance to launch the RD Classes platform on Vercel and MongoDB Atlas.

---

## 1. Pre-Deployment Configuration (Vercel & Services)

### 1.1 Vercel Environment Variables
Add the following variables in **Vercel Project Settings > Environment Variables** (set for Production and Preview):

| Variable Name | Description | Example / Notes |
| :--- | :--- | :--- |
| `NODE_ENV` | Environment mode | `production` |
| `MONGODB_URI` | MongoDB Atlas Connection String | `mongodb+srv://<user>:<password>@cluster0.mongodb.net/rdclasses?retryWrites=true&w=majority` |
| `JWT_SECRET` | Secret for signing student and admin session JWTs | High-entropy string (min 32 chars). Generate with `openssl rand -base64 32` |
| `NEXTAUTH_SECRET` | Secret for admin authentication session encryption | High-entropy string (min 32 chars) |
| `NEXTAUTH_URL` | Canonical domain URL | `https://rdclasses.in` |
| `EMAIL_DRIVER` | Active email provider | `smtp` or `resend` |
| `SMTP_HOST` | SMTP server address (if using SMTP) | e.g. `smtp.zoho.in` or `smtp.sendgrid.net` |
| `SMTP_PORT` | SMTP port | `465` (SSL) or `587` (TLS) |
| `SMTP_USER` | SMTP username | e.g. `support@rdclasses.in` |
| `SMTP_PASS` | SMTP application-specific password | Generated app password |
| `SMTP_FROM` | Default sender email address | `RD Classes <support@rdclasses.in>` |
| `RESEND_API_KEY` | Resend API key (if using Resend) | `re_123456789...` |
| `VIMEO_CLIENT_ID` | Vimeo API app client ID | For video streaming authentication |
| `VIMEO_CLIENT_SECRET` | Vimeo API app client secret | Secret key |
| `VIMEO_ACCESS_TOKEN` | Vimeo API access token with private video read access | Personal access token |

---

## 2. Database Initialization & Seeding Order

Execute these steps against the production MongoDB Atlas instance prior to pointing public traffic:

1. **Verify Connection & Indexes**:
   ```bash
   npm run db:verify
   ```
   *Ensures all unique indexes (`users.email`, `students.email`, `courses.slug`, `enrollments` compound) and TTL indexes (`ratelimits`) are properly generated.*

2. **Create Admin User**:
   ```bash
   node --conditions=react-server scripts/seed-admin.mjs
   ```
   *Logs generated admin credentials. Record them securely in your password manager.*

3. **Verify Environment Sanity**:
   ```bash
   npm run check:env
   ```
   *Confirms all mandatory variables are loaded without errors.*

---

## 3. Go-Live Day Steps

- [ ] **DNS & SSL**: Confirm custom domain `rdclasses.in` resolves to Vercel with active SSL certificate.
- [ ] **Admin Login Test**: Log in to `https://rdclasses.in/admin/login` using the seeded admin account.
- [ ] **Course Catalog**: Verify published courses render on `https://rdclasses.in/courses`. Verify unpublished courses return 404.
- [ ] **Email Delivery Test**: Go to `/admin/students`, click **Add Student**, create a test student, and send credentials. Verify inbox receipt.
- [ ] **Student Portal Access**: Log in on mobile or desktop via `https://rdclasses.in/student/login` to ensure device registration completes smoothly.
- [ ] **Video Stream Test**: Open an enrolled course and verify the lecture video plays with player controls and watermark protection.

---

## 4. Student Support & Device Reset Cheat Sheet

### Scenario A: Student bought a new phone and cannot log in
1. Student attempts login on new phone: The system automatically registers a **Pending Device Request** and redirects them to the "Pending Approval" screen.
2. Admin action:
   - Log in to `/admin/devices`.
   - Locate student's request under **Pending Requests**.
   - Review device details (Browser, OS, IP address).
   - Click **Approve** and choose **Replace current device**.
3. Result: Old phone's session is immediately terminated; new phone gains immediate access.

### Scenario B: Student forgot password
1. Go to `/admin/students`.
2. Search student by name or email.
3. Click student row > **Actions** > **Reset Password**.
4. Choose **Send reset email** or copy temporary password to send via WhatsApp.

### Scenario C: Block or unblock a student
1. Go to `/admin/students`.
2. Toggle status between `Active` and `Blocked`.
3. If blocked, active sessions are immediately rejected on their next request.

### Scenario D: Regular Database Backup
- Run daily or weekly:
  ```bash
  npm run db:backup
  ```
  *Saves timestamped JSON dumps to the local `backups/` directory.*
