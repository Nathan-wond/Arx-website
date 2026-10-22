# Technical Implementation Plan — Administrator Accounts, Rectangular Team Images, Mobile Responsiveness, and Button Audit

Based on an in-depth audit of the project codebase (`backend/src/services/db.js`, `backend/src/controllers/authController.js`, `backend/src/middleware/authMiddleware.js`, `src/pages/AboutPage.tsx`, `src/vanilla/pages/about.js`, `src/vanilla/components/navbar.js`, `src/vanilla/components/adminSidebar.js`, `src/vanilla/pages/admin/adminDashboard.js`, and `arx_database.json`), this plan outlines the exact changes ready for execution upon your authorization.

---

## 1. Administrator Accounts & Role-Based Access Control (RBAC)

### Current Codebase State
- Authentication uses PBKDF2 (`sha512`, 10,000 iterations, 16-byte random salt, timing-safe buffer comparison) defined in `backend/src/utils/passwordUtils.js`.
- The database (`arx_database.json` & `db.js`) currently seeds legacy accounts: `president_root` (`memberId: NEXORA`) and `admin_root` (`memberId: ARX-OFFICER-001`).
- Rate limiting exists via `adminLoginLimiter` (5 attempts per 5 minutes) in `backend/src/routes/authRoutes.js`.

### Implementation Plan
1. **Provision New Administrator Accounts**:
   - **Account A: Presidential Administrator**
     - Username / Member ID: `adminp` (alias support for `ADMINP`, `adminp`)
     - Role: `president` (mapped to `presidential` authority with clearance level 0)
     - Initial Password: `admin123` (hashed via PBKDF2 with unique salt, never plaintext)
     - Flag: `mustChangePassword: true`
     - Permissions: `['all', 'manage_admins', 'delete_members', 'system_backup', 'governance', 'settings', 'certificates', 'applications', 'courses']`
   - **Account B: Officer Administrator**
     - Username / Member ID: `admino` (alias support for `ADMINO`, `admino`)
     - Role: `admin` (mapped to `officer` authority)
     - Initial Password: `admin1234` (hashed via PBKDF2 with unique salt, never plaintext)
     - Flag: `mustChangePassword: true`
     - Permissions: `['applications_review', 'members_view', 'attendance', 'assignments_grade', 'courses_view', 'certificates_issue']`
2. **Preserve Existing Access**:
   - Keep existing `NEXORA` and `ARX-OFFICER-001` backwards-compatible so current administrators are never locked out.
3. **Backend Privilege Boundary**:
   - In `backend/src/controllers/adminController.js` and `authMiddleware.js`:
     - Officers cannot edit, delete, or re-permission presidential accounts.
     - Officers cannot create new administrators with role `president` or `all` permissions.
     - Officers cannot export raw JSON snapshots or alter cryptographic salts.
4. **Initial Password Change Enforcement**:
   - If `mustChangePassword` is `true`, login succeeds but payload includes `mustChangePassword: true` and the frontend redirects/prompts with a mandatory password change modal before unlocking full dashboard capabilities.
5. **Rate Limiting & Safety**:
   - Maintain 5-attempt rate limit per IP.
   - Clean sanitize/strip credentials and hashes from all API responses.

---

## 2. Rectangular Team Photograph Design (4:3 Aspect Ratio)

### Current Codebase State
- Public team portraits in `src/pages/AboutPage.tsx` and `src/vanilla/pages/about.js` currently use circular frames (`rounded-full`, `w-28 h-28` and `w-24 h-24`).
- Some images require specific focal points (`center 15%`, `center 42%`, etc.) to prevent facial cutoff.

### Implementation Plan
1. **Replace Circular Crops with Rectangular Frames**:
   - Change `rounded-full` to uniform `rounded-xl` rectangular frames with `aspect-[4/3]` (or `w-full h-52 sm:h-56` on mobile/tablet).
   - Use `object-fit: cover` with dynamic inline `style="object-position: ${m.pos || 'center 20%'}"` across all cards.
2. **Consistent Visual Treatment Across Tiers**:
   - **Executive Leadership (Rank #1 Kidus, Rank #2 Yohannes, Rank #3 Nathan Haddis)**:
     - 4:3 landscape photograph frame with accent border (`border-[#FC6454]/30 dark:border-[#2F8068]/50`).
     - Rank badge cleanly anchored in the top corner (`Rank #1`, `Rank #2`, `Rank #3`).
     - Readable typography, role tags, and specialty subtitle underneath.
   - **Board of Directors (Natan Yonas)**:
     - 4:3 frame with amber governance border (`border-amber-500/30 dark:border-amber-600/40`), board tag, and bio.
   - **Technical Instructors (Nathan Wendesen, Abenezer Ameha, Nafyad Bayissa, Firaol Tadesse)**:
     - 4:3 frame with clean borders, curriculum specialty tags, and instructor biographies.
3. **Responsive Grid**:
   - Mobile (320px–430px): 1 column full width.
   - Tablets (640px–1024px): 2 columns.
   - Laptops & Desktops (>1024px): 3 to 4 columns.

---

## 3. Complete Responsive Mobile Design (320px–430px+)

### Current Codebase State
- Desktop navbar hides navigation links on `< md` screens, but mobile menu overlay does not auto-close when tapping links, causing trapped navigation states.
- Dashboards (`AdminDashboardPage`, `DashboardPage`, `presidentDashboard`) render a fixed or non-collapsible 64-character sidebar on mobile that pushes content dozens of viewports down.
- Data tables (Applications, Project Submissions, Member Directory) can overflow horizontally on 320px–375px screens.

### Implementation Plan
1. **Global Layout & Navigation (`Navbar.tsx` & `navbar.js`)**:
   - Implement an accessible mobile drawer/flyout that slides in cleanly with backdrop blur.
   - Auto-close drawer immediately upon link selection.
   - Ensure touch targets for hamburger and theme toggle buttons are >= 44x44px.
   - Ensure header does not overflow on small screens (`320px` iPhone SE).
2. **Dashboard Mobile Optimization (`adminDashboard.js`, `presidentDashboard.js`, `dashboard.js`)**:
   - On `< lg` viewports, convert the 14-item vertical sidebar into a collapsible mobile drawer with a sticky top bar (`Active Tab: Team & Leadership [Menu]`).
   - Add horizontal swipeable quick-tab chips at the top for instant switching between common tabs without opening the drawer.
3. **Table & Card Responsiveness**:
   - Wrap all wide tables with smooth horizontal touch-scrolling (`overflow-x-auto -mx-4 px-4 sm:mx-0`) and indicator badges.
   - Provide responsive card-stack alternatives for mobile viewports where horizontal scrolling is less ideal (e.g. applications review and members directory).
4. **Form Optimization (Registration, Login, Activation, Submissions)**:
   - Convert all multi-column forms into 1-column layouts on `< sm` viewports.
   - Full-width inputs (`w-full`) with `text-base` on mobile to prevent iOS Safari auto-zooming.
   - File upload dropzones made touch-friendly with clear camera/gallery buttons.
5. **Theme Consistency**:
   - Strict adherence to ARX light (`#F7EFE8`, `#FFFFFF`) and dark (`#071A14`, `#102B22`) tokens across all mobile overlays, drawers, and modal dialogs.

---

## 4. Button Audit, Touch Targets & Functionality Verification

### Current Codebase State
- Several action buttons use compact classes like `px-2 py-0.5` or `text-[10px]` with touch target heights under 30px.
- Some icon-only buttons lack explicit `aria-label` or touch padding.

### Implementation Plan
1. **Touch Target Standard (>= 44 × 44px)**:
   - Update buttons with minimum dimensions or padding (`min-h-[44px] min-w-[44px]` or adequate surrounding padding) on touch devices while preserving crisp desktop typography.
2. **Complete Action Audit & Handlers**:
   - **Public Pages**:
     - "Join Club" / "Register as Member" -> `/register`
     - "Member Login" -> `/login`
     - "Staff Desk View" / "Executive Login" -> correct protected routes
     - "Filter Disciplines" & "Apply for Membership"
   - **Registration & Activation**:
     - "Submit Application", "Copy Activation Code", "Open Bot in Telegram", "Verify Code"
   - **Member Dashboard**:
     - "Submit Project / Homework", "Download Certificate", "View Curriculum", "Exit Session"
   - **Admin & President Dashboards**:
     - "Add Member", "Edit Member", "Delete Member" (with confirmation)
     - "Transfer Role" modal submission
     - "Approve Application", "Reject Application" (with reason modal)
     - "Generate Certificate", "Bulk Generate", "Deliver via Telegram"
     - "Sync Webhook", "Test Bot Connection"
3. **Interaction Feedback & Safety**:
   - Loading spinners (`isSubmitting`, `isSaving`) on all async buttons.
   - Disabled state styling (`opacity-50 cursor-not-allowed`) during requests to prevent duplicate submissions.
   - Accessible keyboard focus rings (`focus-visible:ring-2 focus-visible:ring-offset-2`).

---

## 5. Preservation of All Previous Requirements

- **Governance & Team**:
  - President: Kidus Elias (Rank #1)
  - Vice President: Yohannes Nigatu (Rank #2)
  - Chief Marketing Officer: Nathan Haddis (Rank #3)
  - Board of Directors: Natan Yonas
  - Front-End Instructor: Nathan Wendesen
  - Software Engineering Instructor: Abenezer Ameha
  - Python Instructors: Nafyad Bayissa & Firaol Tadesse
- **Telegram Verification & Dual Storage**:
  - Telegram bot `@ARXITCLUB_bot`, channel `@arxitclub`, activation code engine, and disk+memory sync remain untouched and fully intact.

---

## 6. Verification & Test Plan

1. **Authentication Tests via curl & API**:
   - `POST /api/auth/admin-login` with `{"memberId": "adminp", "password": "admin123"}` -> verify 200 OK, token issued, role: `president`.
   - `POST /api/auth/admin-login` with `{"memberId": "admino", "password": "admin1234"}` -> verify 200 OK, token issued, role: `admin`.
   - Test password change workflow for newly provisioned accounts.
   - Verify rate limiting triggers on repeated invalid attempts.
2. **Layout & Viewport Tests**:
   - Test rendering at 320px (iPhone SE), 390px (iPhone 14/15), 768px (iPad), and 1280px (Desktop).
   - Inspect team rectangular 4:3 cards for aspect ratio and face positioning.
   - Test mobile navigation open, close, and navigation auto-close.
3. **Compilation & Linting**:
   - `compile_applet` (`vite build`) and `lint_applet` (`tsc --noEmit`).

---

## Awaiting Your Authorization
As requested, implementation has **not** started. Please click **Proceed** or reply with your authorization to execute these changes.
