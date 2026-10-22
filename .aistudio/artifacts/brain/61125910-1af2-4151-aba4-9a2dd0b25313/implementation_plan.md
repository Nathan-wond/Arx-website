# ARX IT Club Team Structure, Leadership Hierarchy & Admin Dashboard Management

## Executive Summary
This implementation plan covers the complete requirements of Prompt 4 along with the critical correction for **Natan Yonas** (`Board of Director`) and the integration of all previous requirements from Prompts 1, 2, and 3. It establishes an authoritative database model for team members and governance, reorganizes the leadership order, transfers the Chief Marketing Officer (CMO) role from Nathan Wendesen to Nathan Haddis, adds Firaol Tadesse as Python Instructor, connects the public About page to the live backend API, and equips the administrator dashboard with full CRUD, reordering, role-uniqueness constraints, media management, and audit logging.

---

## 1. Team Structure & Leadership Hierarchy Specifications

### A. Leadership Ordering & Tier Hierarchy
The team members will be organized into structured categories with authoritative display ordering:

1. **Primary Leadership Group**:
   - **Kidus Elias** (Order 1) — *President & Co-Founder* | Cyber Security Instructor | Photo: `/team/kidus.jpg`
   - **Yohannes Nigatu** (Order 2) — *Vice President & Co-Founder* | AI & Machine Learning Instructor | Photo: `/team/jo.jpg?v=2`
   - **Nathan Haddis** (Order 3) — *Chief Marketing Officer* | AI & Machine Learning Instructor | Photo: `/team/nathan-haddis.jpg`

2. **Board of Directors**:
   - **Natan Yonas** (Order 4) — *Board of Director* | Robotics Instructor | Photo: `/team/me.jpg?v=2`
   *(Critical correction applied: Exact spelling "Natan Yonas", Title "Board of Director", strictly positioned directly following Nathan Haddis, not designated as an ordinary member or instructor).*

3. **Instructors & Core Contributors**:
   - **Nathan Wendesen** (Order 5) — *Front-End Development Instructor* (CMO title transferred; profile, biography, photo `/team/nathan.jpg`, and instructor responsibilities fully preserved; no duplicate CMO title)
   - **Abenezer Ameha** (Order 6) — *Software Engineering Instructor* | Photo: `/team/ab.jpg?v=2`
   - **Nafyad Bayissa** (Order 7) — *Python Instructor* | Photo: `/team/nafyad.jpg`
   - **Firaol Tadesse** (Order 8) — *Python Instructor* (Newly added; clean initial profile with default ARX avatar placeholder until custom photo/bio is supplied by an admin)

---

## 2. Authoritative Data Model & Backend Architecture

### A. Database Schema (`arx_database.json` & `db.js`)
Extend the authoritative `governance` collection in `backend/src/services/db.js` with comprehensive attributes:
```typescript
interface TeamMemberGovernanceRecord {
  id: string; // e.g. "gov_..."
  name: string; // Full legal/display name
  role: string; // Executive or technical title (e.g. "Chief Marketing Officer", "Board of Director")
  category: 'leadership' | 'board' | 'instructor' | 'core_team'; // Display grouping
  department: string; // Specialty/discipline (e.g. "AI & Machine Learning", "Robotics")
  specialty?: string; // Secondary specialty label for cards
  description: string; // Biography & responsibilities
  photoUrl: string; // Profile image path or URL
  positionOffset?: string; // CSS object-position for framing (e.g. "center 20%")
  socialLinks?: {
    github?: string;
    linkedin?: string;
    telegram?: string;
    twitter?: string;
    email?: string;
  };
  order: number; // Numerical sort index
  isUniqueRole?: boolean; // Flag indicating single-holder executive position
  isPublished: boolean; // Active/Visible vs Hidden
  createdAt: string;
  updatedAt: string;
}
```

### B. Unique Leadership Constraints & Validation
Implement backend validation in `backend/src/controllers/adminController.js` and `backend/src/services/db.js`:
- **Unique Executive Roles**: Positions designated as single-holder (`President`, `Vice President`, `Chief Marketing Officer`, `Chief Operating Officer`, `Chief Technology Officer`) cannot be assigned to more than one active team member simultaneously.
- **Role Transfer Logic**: When an administrator reassigns a unique role (e.g. assigning CMO to Nathan Haddis), the backend can automatically prompt/confirm the transfer, clearing the unique title from the previous holder (Nathan Wendesen) and assigning their revised departmental title without deleting or corrupting their record.

### C. Admin Endpoints (`/api/admin/governance`)
- `GET /api/admin/governance`: Returns all team members (including unverified/hidden members, with full audit metadata).
- `POST /api/admin/governance`: Validates required fields (`name`, `role`, `category`), checks role uniqueness, generates an ID, appends an audit log entry, and persists to `arx_database.json`.
- `PUT /api/admin/governance/:id`: Updates member profile, category, photo, bio, display order, or visibility status. Revalidates role uniqueness on title changes.
- `DELETE /api/admin/governance/:id`: Safely deletes a member or deactivates them (`isPublished: false`), with audit logging.
- `POST /api/admin/governance/reorder`: Accepts an array of member IDs and updates their numeric display order in bulk.
- `POST /api/admin/governance/:id/transfer-role`: Dedicated transfer utility allowing direct one-click transfer of a title from one member to another with automated logging.

### D. Public Endpoint (`/api/governance`)
- Returns sanitized, sorted list of active (`isPublished !== false`) team members.
- Supports category filtering (`/api/governance?category=leadership`).

---

## 3. Administrator Dashboard Management UI

### A. Dedicated "Team & Leadership" Tab in Admin Console
Integrate a first-class **Team & Leadership** management tab into `src/vanilla/components/adminSidebar.js` and `src/vanilla/pages/admin/adminDashboard.js`:
- **Sidebar Integration**: Add `{ id: 'team', label: 'Team & Leadership', iconName: 'Users' }` to the navigation menu.
- **Categorized Management View**:
  - Filter by category: All, Primary Leadership, Board of Directors, Instructors, Core Team.
  - Visual indicator badges for unique executive roles (President, VP, CMO, Board of Director).
  - Quick-action buttons: Add Member, Reorder (Drag / Up-Down), Transfer Role, Edit, Toggle Visibility, Delete.

### B. Add / Edit Member Modal
A responsive form with real-time validation:
- **Full Name** (Required)
- **Role / Title** (Required, e.g. "Chief Marketing Officer", "Board of Director", "Python Instructor")
- **Category Selection**:
  - Primary Leadership
  - Board of Directors
  - Technical Instructor
  - Core Team Member
- **Specialty / Department** (e.g. "Cyber Security", "Robotics", "AI & Machine Learning")
- **Profile Photograph**:
  - URL input or media picker
  - Preset club portrait selector (`/team/kidus.jpg`, `/team/jo.jpg`, `/team/nathan-haddis.jpg`, `/team/me.jpg`, `/team/nathan.jpg`, `/team/ab.jpg`, `/team/nafyad.jpg`)
  - Image framing adjustment (`object-position` preview)
  - Live preview with fallback handling
- **Biography & Description**: Detailed summary of responsibilities
- **Social / Professional Links**: GitHub, LinkedIn, Telegram username, Email
- **Display Order**: Numerical position
- **Visibility Toggle**: Published (Public) vs Hidden (Draft/Deactivated)

### C. Role Transfer Modal
- Select source member and target member.
- Specify the role to transfer (e.g. CMO).
- Set new role for previous holder to prevent duplicate titles.
- Submit with instant database persistence and audit log entry.

### D. Audit Logging
- Every creation, modification, role transfer, and deletion records:
  - Timestamp
  - Admin ID and student name (`req.user.memberId`)
  - Action summary (e.g. `"Transferred Chief Marketing Officer title to Nathan Haddis from Nathan Wendesen"`)
  - Target member ID

---

## 4. Frontend Dynamic Integration (`AboutPage.tsx` & `about.js`)

### A. Dynamic API Fetching with Fallback
Update both React `AboutPage.tsx` and vanilla `about.js`:
- Fetch team data dynamically on mount via `api.getGovernance()` / `/api/governance`.
- Group members into sections:
  1. **Executive Leadership** (Primary Leadership: Kidus Elias, Yohannes Nigatu, Nathan Haddis)
  2. **Board of Directors** (Natan Yonas)
  3. **Technical Instructors** (Nathan Wendesen, Abenezer Ameha, Nafyad Bayissa, Firaol Tadesse)
- Provide immediate, reliable fallback to the updated authoritative static defaults if offline or during initial hydration.

### B. Visual Polish & Responsive Card Design
- Maintain ARX IT Club design constitution: warm parchment backgrounds (`#F7EFE8` / `#071A14`), coral/forest accents (`#FC6454` / `#6BB89E`), clean typography, crisp rounded cards, and dark mode contrast.
- Team cards showcase:
  - Avatar with subtle gradient border and framing.
  - Full Name.
  - Primary Role badge (e.g. "CHIEF MARKETING OFFICER", "BOARD OF DIRECTOR", "PRESIDENT").
  - Department / Specialty subtitle.
  - Expandable / hover biography and social links (Telegram, GitHub, LinkedIn) when available.

---

## 5. Verification & Test Plan

1. **Leadership Order Verification**:
   - Verify Kidus Elias is #1 (President).
   - Verify Yohannes Nigatu is #2 (Vice President).
   - Verify Nathan Haddis is #3 (Chief Marketing Officer).
   - Verify Natan Yonas is #4 (Board of Director, exact spelling).
   - Verify Nathan Wendesen is preserved as Front-End Instructor without CMO title.
   - Verify Firaol Tadesse appears in Instructors section with role "Python Instructor".

2. **Role Uniqueness & Validation Testing**:
   - Attempt to assign a second member as "Chief Marketing Officer" -> Ensure validation blocks it or triggers a clean transfer flow.
   - Test role transfer utility -> Confirm previous holder's title is cleanly updated and new holder receives the title.

3. **Admin Dashboard CRUD Testing**:
   - Create a new team member via Admin UI -> Confirm it appears in DB and on public `/about` page.
   - Edit member name, bio, photo, order -> Confirm instant reflection.
   - Toggle visibility to hidden -> Confirm member is hidden from public `/about` page but visible in admin console.
   - Reorder members -> Confirm public display order matches.

4. **Audit Trail Verification**:
   - Confirm all administrative updates append structured audit records into `arx_database.json` `auditLogs`.

5. **Build & Lint Verification**:
   - Execute `lint_applet` to verify TypeScript and syntax compliance.
   - Execute `compile_applet` to confirm successful production bundle generation.
