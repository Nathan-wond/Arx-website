# Implementation Plan: ARX IT Club — Admin Panel Stability, Full Functionality & URL Management

## Root Cause Analysis

### 1. Why the Public Website Changes When Entering the Admin Panel
Our code audit revealed four distinct root causes:
1. **Layout Leaks & Route Guard Flashes (`src/App.tsx`)**:
   - When navigating to `/admin` or refreshing an admin page, during the initial asynchronous auth verification (`isLoading === true`), `App.tsx` fell through to rendering the public shell (`<Navbar />` + `<main>` + `<Footer />`) containing `<AdminLoginPage />`. When authentication resolved, the public layout abruptly unmounted or conflicted with the admin dashboard.
   - Global delegated event listeners in `App.tsx` (`document.addEventListener('click', handleGlobalClick)`) conflicted with the vanilla admin dashboard's custom tab switching and internal button handlers.
2. **Desynchronized Dual State Stores (`src/context/ThemeContext.tsx` vs `src/vanilla/state.js`)**:
   - The application has two independent state layers: React Contexts (`ThemeContext`, `AuthContext`) and Vanilla module states (`themeState`, `authState`).
   - Toggling the theme inside the admin panel manipulated `document.documentElement` and `localStorage` directly via `themeState.toggleTheme()`, but React's `ThemeContext` was never notified. When navigating back to public pages, React's `ThemeContext` effect triggered and overwrote `document.documentElement` with the stale React state, causing visual jarring, inverted contrasts, or layout flicker.
3. **Overly Aggressive Document-Wide CSS Overrides (`src/vanilla/styles.css`)**:
   - Universal `html.dark` element overrides (such as `html.dark div:not(#printable-certificate)... { color: #FFFFFF !important; }` and `html.dark .bg-white... { background-color: #102B22 !important; }`) indiscriminately override colors across the whole document. When the admin panel alters themes or classes, public site cards, pills, and nav elements lose their intended color contrast.
4. **Missing Isolation for Admin Dashboard DOM Tree (`src/vanilla/pages/admin/adminDashboard.js`)**:
   - Inside `adminDashboard.js`, `reRender()` calls `root.replaceWith(buildDashboard())`, mutating DOM nodes outside React's virtual DOM reconciliation while mounted inside `AdminDashboardPage.tsx`.

### 2. Existing URL Configuration Architecture
- Canonical links (`websiteUrl`, `adminUrl`, `telegramBotUrl`, `telegramChannelUrl`, `contactEmail`) were split between `backend/src/config/index.js`, `backend/src/services/db.js`, and hardcoded strings throughout controllers and views.
- The Admin Dashboard (`adminDashboard.js`) had **no Website Settings tab or URL management interface** in its sidebar.
- In `backend/src/routes/adminRoutes.js`, the `/settings` PUT endpoint was restricted only to `presidentMiddleware`, locking out authorized officers. Furthermore, it lacked strict URL format validation, protocol checking (HTTPS enforcement), and open-redirect safeguards.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> - **Public Website Navigation Guarantee**: The public navigation will remain strictly: `Home | About | Courses | Projects | Event | Contact`.
> - **Admin URL Routing Clarification**: Changing the configured canonical Admin-Panel URL in settings updates official link generation, bot command responses, and metadata, but does not alter physical server routes without code deployment. This distinction will be prominently explained in the UI.
> - **Settings Access Policy**: Settings updates will be authorized for administrators with the `settings` or `all` permission, as well as the Club President.

---

## Proposed Changes

### Section 1: Admin Panel & Public Website Isolation
- **`src/App.tsx`**:
  - Enforce clean boundary separation: when rendering admin routes (`isAdminRoute`), completely bypass `<Navbar />` and `<Footer />`, even during authentication loading, using an isolated minimal admin loading screen.
  - Fix navigation returns so clicking "View Public Site" cleanly returns to public pages without residual admin DOM or event listeners.
- **`src/context/ThemeContext.tsx` & `src/vanilla/state.js`**:
  - Unify theme state. Have `ThemeContext` listen to `events.on('themeChange')` and keep `themeState` and React in strict bidirectional lockstep.
- **`src/context/AuthContext.tsx` & `src/vanilla/state.js`**:
  - Synchronize `authState.member` with React `useAuth` on login, profile refresh, and logout so vanilla and React views never disagree on authentication status.

### Section 2: Website Settings & URL Management Section
- **Backend Architecture (`backend/src/services/db.js` & `backend/src/controllers/adminController.js`)**:
  - Extend `db.settings` with canonical URL schema:
    - `websiteUrl`: Canonical public website URL (default: `https://arx-website-sjs.vercel.app`)
    - `adminUrl`: Canonical admin panel URL (default: `/admin` or configured full URL)
    - `telegramBotUrl`: Official bot URL (`https://t.me/ARXITCLUB_bot`)
    - `telegramChannelUrl`: Official channel URL (`https://t.me/arxitclub`)
    - `contactEmail`: Official club contact email
    - `githubUrl`, `youtubeUrl`, `linkedinUrl`: Official social links
  - Implement server-side validation in `adminController.updateSettings`:
    - Valid URL syntax and domain validation.
    - Require `https://` in production / non-localhost environments.
    - Sanitize inputs to prevent script injection and SSRF / open redirects.
    - Create structured audit log entries (`AUDIT: UPDATE_WEBSITE_SETTINGS`) recording the administrator and timestamp.
  - Update `adminRoutes.js` permissions to allow authorized administrators (`role === 'president'` or permissions containing `'settings'`).
  - Wire dynamic consumers (`issueCertificate` QR data, Telegram messages, activation links) to pull from `db.settings.websiteUrl`.
- **Frontend Admin Panel (`src/vanilla/components/adminSidebar.js` & `src/vanilla/pages/admin/adminDashboard.js`)**:
  - Add **Website Settings & URLs** (`Settings`) tab to the admin sidebar.
  - Build comprehensive, interactive Settings management view:
    - Canonical Public Website URL editor with live preview and format validation.
    - Canonical Admin-Panel URL editor with deployment notes.
    - Telegram Bot and Channel links with "Test Link" actions.
    - Official Contact Email and social media links.
    - Save, Cancel, and Reset-to-Default controls with instant success/error feedback.
    - Audit log summary showing recent settings changes.
- **Presidential Dashboard (`src/vanilla/pages/president/presidentDashboard.js`)**:
  - Update presidential settings tab to mirror and control these canonical URLs with presidential override capability.

### Section 3: Full Admin Panel Functionality Audit & Polish
- Ensure every single button, form, and table action functions end-to-end:
  - Member management (view details, toggle status, reset password, delete member).
  - Student applications (view essay/award files, approve with auto-credentials, reject with reason).
  - Lab attendance (sessions, open/late cutoff windows, approval/rejection, absence finalization).
  - Curriculum courses & enrollments (create, edit, publish, track completion).
  - Verified certificates (issue single, bulk issue, download real PDF, toggle status).
  - Project review & submissions (download student files, grade/evaluate, notify via bot).
  - Announcements & Telegram synchronization (publish, broadcast, toggle).
  - Team & leadership roster (order, publish, unique role transfer).
  - Media library (upload, replace across site, delete).

---

## Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser Client Layer                     │
├──────────────────────────────┬──────────────────────────────┤
│      Public Website          │      Admin Operations        │
│   Home | About | Courses     │  Staff & Presidential Suite  │
│  Projects | Event | Contact  │   Overview, Members, URLs    │
└──────────────┬───────────────┴──────────────┬───────────────┘
               │                              │
               │ (Isolated Shells & Themes)   │
               ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│             Shared State & Theme Synchronization            │
│  localStorage('arx_theme') ◄──► ThemeContext ◄──► themeState│
└──────────────────────────────┬──────────────────────────────┘
                               │ Authenticated API Requests
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend Express Service                   │
│   • Auth / Role Middleware (President / Authorized Admin)   │
│   • URL Validation & Sanitization (HTTPS, Domain, Security) │
│   • Audit Logging Service                                   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             Authoritative Database Persistence              │
│  db.settings (websiteUrl, adminUrl, telegram, contacts)     │
│  arx_database.json / Neon Postgres Storage                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Verification & Testing Plan

1. **Public Website Stability Test**:
   - Access public website (`/`, `/about`, `/courses`, `/projects`, `/events`, `/contact`).
   - Open admin login and admin dashboard in direct navigation and via navigation buttons.
   - Switch themes in admin panel and verify public website retains correct styling without layout distortion or inverted colors.
   - Verify public navigation remains exactly `Home | About | Courses | Projects | Event | Contact`.
2. **URL Settings Management Test**:
   - Save modified Public Website URL (`https://arx-website-sjs.vercel.app/test-domain`) and verify validation, persistence, and audit logging.
   - Test invalid URLs (non-HTTPS, malformed strings, javascript: URIs) and verify server rejection.
   - Check certificate QR links and telegram notification payloads to confirm dynamic consumption of the saved URL.
3. **Admin Functionality End-to-End Test**:
   - Test member approval, attendance session creation, absence finalization, project review, course creation, and certificate PDF generation.
