# Admin Login Diagnostic & Fix Report

## 1. Issue Summary
When attempting to sign in to the RD Classes Admin Portal (`/admin/login`) with the credentials defined in `.env.local`, the form returned:
> *"Invalid Admin ID or password"*

## 2. Evidence-Based Diagnosis (No Secrets)

A diagnostic script was executed against the active MongoDB connection and configuration. Findings:

- **Database Connected**: `rdclasses`
- **Admin User Record Exists**: `true`
  - **Role**: `admin`
  - **Status**: `active`
  - **Device Limit**: `3`
- **BCrypt Password Comparison**:
  - `bcrypt.compare(process.env.ADMIN_PASSWORD, user.passwordHash)` evaluated to: `true` (after re-seeding)
- **Account Lock Status**:
  - `LoginAttempt` user key (`admin:u:<adminLoginId>`): `0 attempts` (Unlocked)
  - `LoginAttempt` IP keys (`admin:ip:<ip>`): `0 attempts` (Unlocked)

### Root Cause
Two interrelated factors caused the login failure:
1. **Test Script Credential Clobbering**: In `scripts/e2e-check.mjs`, a test routine previously executed `await bcrypt.hash("password123", 10)` and directly mutated the database document for the admin user. This silently overwrote the production admin password in MongoDB, causing credentials configured in `.env.local` to no longer match the database hash.
2. **Rate Limit Lock Accumulation**: When multiple sign-in attempts were made with the `.env.local` credentials while the stored hash was desynchronized, `LoginAttempt` records accumulated until the 5-attempt threshold triggered an automatic 15-minute lock window. Subsequent login attempts failed immediately at the rate-limiter gate with the same generic error.

## 3. Fixes Implemented

1. **Fixed Test Script (`scripts/e2e-check.mjs`)**:
   Updated the test script to respect `process.env.ADMIN_LOGIN_ID` and `process.env.ADMIN_PASSWORD` from `.env.local` rather than hardcoding credentials or overwriting database users destructively.

2. **Added `npm run admin:unlock`**:
   Created `scripts/admin-unlock.mjs` and registered `"admin:unlock"` in `package.json`. This command connects to MongoDB, reports the database name, and clears all `LoginAttempt` lock documents for the admin username and corresponding IP addresses.

3. **Enhanced `npm run seed:admin`**:
   Updated `scripts/seed-admin.mjs` to:
   - Print the connected database name.
   - Report whether the admin user was created or updated.
   - Automatically purge any existing failed login attempts / lock records to ensure immediate access upon re-seeding.

4. **Added Automated Login Verification via Playwright**:
   Added `scripts/test-admin-login-playwright.mjs` to run a headless browser flow verifying that the `.env.local` credentials successfully authenticate and redirect to `/admin` without logging or printing any sensitive credentials.

## 4. Verification Workflow

To unlock and verify admin access at any time:
```bash
# 1. Ensure admin account is seeded with .env.local credentials
npm run seed:admin

# 2. Clear any rate-limit locks
npm run admin:unlock

# 3. Test headless authentication
node scripts/test-admin-login-playwright.mjs
```
