# Vimeo Video Setup & Privacy Configuration Guide

Follow this guide to securely configure RD Classes video lectures on Vimeo Pro / Business / Standard. This setup ensures lecture videos cannot be found on Vimeo search, cannot be downloaded, and cannot be embedded on any third-party websites outside your official domains.

---

## 1. Domain Privacy & Embed Whitelist (Crucial)

By default, Vimeo videos can be embedded anywhere unless domain restriction is enabled.

1. Navigate to [Vimeo Video Settings](https://vimeo.com/manage/videos).
2. For each course lecture (or globally via **Settings > Default Upload Settings > Privacy**):
   - **Privacy:** Set to **"Hide from Vimeo"** (or **"Unlisted"**).
   - **Who can embed?:** Select **"Specific domains"**.
3. Add the following allowed origins to the domain whitelist:
   - `localhost`
   - `localhost:3000`
   - `*.vercel.app` (or your preview branch domain `rd-classes.vercel.app`)
   - `rd-classes.in`
   - `www.rd-classes.in`
4. Click **Save**. Any attempt to embed this video on other domains or inspect and load the iframe URL directly outside these origins will be rejected by Vimeo's embed policy.

---

## 2. Player Controls & Anti-Download Settings

Under the video's **Player** customize tab:
- **Downloads:** Toggle **OFF** (prevents student download button).
- **Speed controls:** Toggle **ON** (allows students to watch at 1.25x, 1.5x, 2x for board exam revision).
- **Player controls:**
  - Play bar: ON
  - Volume: ON
  - Fullscreen: ON
  - Like, Watch Later, Share, Embed code buttons: **OFF**
  - Byline, Title, Portrait: **OFF** (the RD Classes custom player handles lecture titles natively).

---

## 3. How to Copy Unlisted Vimeo Links for the Admin Dashboard

When adding a lecture in `/admin/courses/[id]`:
1. Open the unlisted video on Vimeo.
2. In the browser address bar or the "Copy Link" modal, copy the unlisted link.
   - Example Standard URL: `https://vimeo.com/123456789/abcdef1234`
   - Example Player Embed URL: `https://player.vimeo.com/video/123456789?h=abcdef1234`
3. Paste this URL directly into the **Vimeo URL / ID** field in the RD Classes Admin Dashboard.
4. The backend automatically extracts:
   - `vimeoId`: `123456789`
   - `vimeoHash`: `abcdef1234` (the unlisted security hash)

> **Important:** The Vimeo video ID and security hash are NEVER exposed to unauthenticated visitors or students not actively enrolled in the course. The player URL is only computed server-side after verifying session authenticity and enrollment status.

---

## 4. Optional Vimeo API Token Setup (Autofill Metadata)

You can enable one-click autofill for lecture title, description, thumbnail, and duration:

1. Visit [Vimeo Developer Apps](https://developer.vimeo.com/apps).
2. Click **Create an App**.
   - App Name: `RD Classes Portal`
   - App Description: `Lecture metadata integration`
3. Under **Generate an Access Token**, choose:
   - **Authenticated (you)**
   - Scopes: check `public` and `video_files` (or `private` if videos are hidden).
4. Click **Generate Token**.
5. Copy the generated token and paste it into `.env.local` (and your Vercel project environment settings):
   ```env
   VIMEO_ACCESS_TOKEN=your_vimeo_access_token_here
   ```
6. In the Admin Dashboard when creating or editing a lecture, click the **"Fetch Metadata from Vimeo"** button. The server will automatically populate:
   - Video Title
   - Description
   - Exact Duration (seconds)
   - High-resolution Thumbnail URL

> If `VIMEO_ACCESS_TOKEN` is not set, the platform degrades gracefully: administrators simply enter the duration and title manually.
