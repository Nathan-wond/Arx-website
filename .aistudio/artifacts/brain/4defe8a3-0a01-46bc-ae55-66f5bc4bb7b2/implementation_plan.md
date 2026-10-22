# Technical Implementation Plan — Complete Production Attendance Management System for ARX IT Club

## 1. Current Project Architecture & Source Code Inspection

An audit of the current ARX IT Club codebase confirms the following structure:
- **Runtime & Persistence**: Dual-layer architecture (`backend/src/services/db.js` in-memory `Map` with JSON file persistence in `arx_database.json` via `fileService.js`).
- **Authentication**: PBKDF2 with SHA-512 and random 16-byte salt (`backend/src/utils/passwordUtils.js`), JWT session tokens in HTTP-only cookies and Bearer headers (`backend/src/utils/jwtUtils.js`, `backend/src/middleware/authMiddleware.js`).
- **Core Entities**:
  - `members`: Accounts with `id`, `memberId`, `studentName`, `role` (`member`, `admin`, `president`), `status` (`pending`, `approved`, `active`, `suspended`), `isApproved`, `telegramActivated`.
  - `courses`: Tracks (`crs_web_dev`, `crs_python`, `crs_cybersecurity`, `crs_robotics`, `crs_ai_ml`) with titles, instructors, syllabi.
  - `enrollments`: Member course enrollments linking `memberId`/`userId` and `courseId`.
  - `attendanceRecords` & `attendanceSessionConfigs`: Rudimentary placeholder check-in with legacy daily configs (`session_afternoon`, `session_evening`) lacking course binding, Ethiopian clock conversion, administrative approval states, and controlled absence finalization.
- **Frontend Layers**:
  - React SPA with Vite (`src/App.tsx`, `src/pages/portal/*`, `src/pages/admin/*`, `src/pages/president/*`).
  - Modular state & API layer (`src/services/api.js`, `src/context/AuthContext.tsx`, `src/vanilla/pages/*`).

---

## 2. Ethiopian Clock System — Mathematical Model & Conversion Architecture

### Context & Rules
In the Ethiopian calendar/clock system (authoritative timezone: `Africa/Addis_Ababa`, UTC+3):
- Daytime hours count starting from sunrise (~6:00 AM international time).
- **12:00 sunrise** = 06:00 international.
- **1:00 morning** = 07:00 international.
- **6:00 midday** = 12:00 international (noon).
- **7:00 afternoon** = 13:00 international (1:00 PM).
- **7:30 afternoon** = 13:30 international (1:30 PM).
- **7:40 afternoon** = 13:40 international (1:40 PM).

### Attendance Schedule Matrix (Authoritative Timezone: `Africa/Addis_Ababa`)
| Ethiopian Clock Time | Approximate International (EAT / UTC+3) | Status / Permitted Action |
| :--- | :--- | :--- |
| **Before 7:00** | Before 13:00 (1:00 PM) | **Closed / Upcoming**: Check-in rejected ("Attendance session opens at 7:00 Ethiopian time"). |
| **7:00 to < 7:30** | 13:00 to < 13:30 (1:00 PM – 1:29:59 PM) | **Open (On-Time)**: Submissions accepted, provisional classification = `Present`, review status = `Pending`. |
| **7:30 to < 7:40** | 13:30 to < 13:40 (1:30 PM – 1:39:59 PM) | **Open (Late Window)**: Submissions accepted, provisional classification = `Late`, review status = `Pending`. |
| **7:40 & Afterward** | 13:40 (1:40 PM) onward | **Closed**: Ordinary submissions rejected. Session status transitions to `closed` / `awaiting_finalization`. |

### Conversion Utility: `backend/src/utils/ethiopianTimeUtils.js`
A dedicated utility module will provide:
1. `getAddisAbabaNow()`: Returns current date and time in `Africa/Addis_Ababa` timezone irrespective of host machine or browser timezone.
2. `ethiopianToInternationalTime(ethiopianTimeStr, period = 'afternoon')`:
   - Converts `"07:00"` afternoon $\rightarrow$ `"13:00"`.
   - Converts `"07:30"` afternoon $\rightarrow$ `"13:30"`.
   - Converts `"07:40"` afternoon $\rightarrow$ `"13:40"`.
3. `internationalToEthiopianTime(internationalTimeStr)`:
   - Converts `"13:00"` $\rightarrow$ `"07:00"` afternoon.
   - Formats dual display strings: e.g. `"7:15 Ethiopian time (1:15 PM EAT)"`.
4. `calculateSessionWindow(session, checkDate)`:
   - Server-authoritative computation yielding `{ isOpen, isUpcoming, isClosed, provisionalClassification, minutesRemaining }`.

---

## 3. Database Schema Extensions (Zero Data Loss)

Existing database structures will be preserved and extended in `arx_database.json` and `backend/src/services/db.js`:

### 1. `attendanceSessions` (Collection / Map)
```typescript
interface AttendanceSession {
  id: string; // e.g. "att_sess_1791823901"
  courseId: string; // References courses (e.g. "crs_web_dev")
  courseTitle: string; // Snapshot for fast indexing
  title: string; // e.g. "Lab 3: Modern Component Architecture"
  date: string; // YYYY-MM-DD in Africa/Addis_Ababa
  
  // Ethiopian Clock Configuration (Authoritative definition)
  ethiopianOpenTime: string; // "07:00"
  ethiopianPresentCutoff: string; // "07:30"
  ethiopianLateCutoff: string; // "07:40" (Closing deadline)
  
  // International EAT Timestamps (Precomputed UTC+3 for rapid evaluation)
  internationalOpenTime: string; // "13:00"
  internationalPresentCutoff: string; // "13:30"
  internationalLateCutoff: string; // "13:40"
  
  instructions?: string;
  status: 'draft' | 'published' | 'closed' | 'finalized';
  createdBy: string; // Administrator name/ID
  createdAt: string; // ISO UTC
  updatedAt: string; // ISO UTC
  finalizedAt?: string;
  finalizedBy?: string;
}
```

### 2. `attendanceSubmissions` / `attendanceRecords`
Separate administrative review status from attendance classification:
```typescript
interface AttendanceRecord {
  id: string; // e.g. "att_rec_1791823902"
  sessionId: string; // References attendanceSessions.id
  sessionTitle: string;
  courseId: string;
  courseTitle: string;
  date: string; // YYYY-MM-DD
  
  // Member Attribution (Server-authoritative)
  userId: string; // Authoritative database user UUID
  memberId: string; // Authoritative formatted ID (e.g. "TI000001")
  studentName: string;
  studentClass: string;
  
  // Server-Authoritative Timestamps
  submittedAt: string; // Full ISO UTC
  submissionTimeEthiopian: string; // e.g. "07:14 Afternoon"
  submissionTimeInternational: string; // e.g. "13:14:22 EAT"
  
  // Classification vs. Review Status (Explicit Separation)
  initialClassification: 'Present' | 'Late' | 'Absent';
  finalClassification: 'Present' | 'Late' | 'Absent';
  reviewStatus: 'Pending' | 'Approved' | 'Rejected';
  
  // Administrative Review Attribution
  reviewedBy?: string; // Administrator studentName / memberId
  reviewedAt?: string; // ISO UTC
  rejectionReason?: string;
  correctionNotes?: string;
  history?: Array<{
    timestamp: string;
    changedBy: string;
    action: string;
    previousStatus: string;
    newStatus: string;
  }>;
}
```

---

## 4. Member Authentication & Submission Verification Pipeline

When a member submits attendance:
1. **Payload**: Requires `{ sessionId, memberId, password }`.
2. **Step 1 — Account & Credential Verification**:
   - Lookup member by `memberId`. Reject with 401 if not found.
   - Verify PBKDF2 password hash. Reject with 401 if invalid.
   - Verify account is `approved`/`active` and not `suspended` or `rejected`.
3. **Step 2 — Identity Binding**:
   - If authenticated via Bearer token / cookie session, ensure logged-in `req.user.memberId === submitted memberId` (prevents submitting for peers).
4. **Step 3 — Course Enrollment Eligibility**:
   - Ensure member is enrolled in the session's `courseId` via `enrollments` table.
5. **Step 4 — Duplicate Submission Prevention**:
   - Atomic database lookup for existing record matching `(sessionId, userId)`.
   - If already submitted, return existing record and reject duplicate with 409 Conflict.
6. **Step 5 — Server-Authoritative Timestamp & Boundary Enforcement**:
   - Retrieve trusted server time in `Africa/Addis_Ababa`.
   - Before 7:00 Ethiopian (13:00 EAT): Reject (400 "Session not yet open").
   - 7:00 to < 7:30 Ethiopian (13:00 – 13:29:59 EAT): Provisional = `Present`.
   - 7:30 to < 7:40 Ethiopian (13:30 – 13:39:59 EAT): Provisional = `Late`.
   - 7:40 Ethiopian and afterward ($\ge 13:40$ EAT): Reject (400 "Attendance session is closed").
7. **Step 6 — Persistence & Review Queue**:
   - Set `reviewStatus = 'Pending'`, `initialClassification = provisional`, `finalClassification = provisional`.
   - Commit record to persistent storage.

---

## 5. Administrative Review & Absence Finalization Flow

### Administrative Review
- Table view with filters: Course, Session Date, Review Status (`Pending`, `Approved`, `Rejected`), Classification (`Present`, `Late`, `Absent`).
- Dual time display: "7:12 Ethiopian (1:12 PM EAT)".
- Actions:
  - **Approve**: Confirms provisional classification, marks `reviewStatus = 'Approved'`.
  - **Reject**: Marks `reviewStatus = 'Rejected'`, prompts for rejection reason, recalculates standing.
  - **Correct / Override**: Allows modifying classification with audit log record.

### Controlled Absence Finalization
- After 7:40 Ethiopian time (13:40 EAT), administrator clicks **Finalize Absences** for a closed session.
- System identifies all active enrolled students for that session's course who have **no** submission record.
- Idempotently creates `Absent` records with:
  - `reviewStatus = 'Approved'`
  - `initialClassification = 'Absent'`
  - `finalClassification = 'Absent'`
  - `reviewedBy = admin.studentName`
  - `reviewedAt = now`
- Prevents re-running before the 7:40 deadline.

---

## 6. Frontend Integration & User Interface Design

### 1. Member Dashboard (`src/pages/portal/DashboardPage.tsx` & new `MyAttendancePage.tsx` or Portal Tab)
- Add dedicated **Lab Attendance** tab/section in member workspace.
- **Session Cards & States**:
  - *Upcoming*: Shows opening countdown, course, date, Ethiopian & international time.
  - *Open*: Displays check-in form with verified Member ID and password verification field.
  - *Pending Review*: Yellow badge showing submission received, provisional classification, awaiting officer approval.
  - *Approved / Finalized*: Green/amber badge with verified status.
  - *Rejected*: Red badge with administrator's rejection reason.
  - *Finalized Absent*: Red badge for missed sessions.
- **Attendance History Table**: Complete historical log with percentages and certificate qualification threshold ($\ge 80\%$).

### 2. Administrator & President Dashboards (`src/vanilla/pages/admin/adminDashboard.js`, `presidentDashboard.js`)
- Dedicated **Attendance Management** module:
  - Tab 1: **Active & Upcoming Sessions** (create new session form with Ethiopian clock pickers, publish, close).
  - Tab 2: **Live Submission Review Queue** (review pending check-ins, approve/reject modal with reason).
  - Tab 3: **Absence Finalization** (view eligible non-submitting members, one-click finalization after 7:40 Ethiopian).
  - Tab 4: **Historical Master Roster & Analytics** (exportable report, filter by student, course, date).

---

## 7. Backend API Routes (`backend/src/routes/attendanceRoutes.js`)

| Method | Endpoint | Protection | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/attendance/check-in` | Rate-limited, Optional Auth | Submit member attendance with Member ID & Password |
| `GET` | `/api/attendance/available-sessions` | Authenticated | List open & upcoming sessions for member's enrolled courses |
| `GET` | `/api/attendance/my-history` | Authenticated | Member's attendance history, rates, and approval status |
| `GET` | `/api/attendance/admin/sessions` | Admin / President | List all configured sessions with submission counts |
| `POST` | `/api/attendance/admin/sessions` | Admin / President | Create a new course attendance session (Ethiopian clock schedule) |
| `PUT` | `/api/attendance/admin/sessions/:id` | Admin / President | Update session status or details |
| `GET` | `/api/attendance/admin/sessions/:id/unsubmitted` | Admin / President | Identify eligible members who have not submitted |
| `POST` | `/api/attendance/admin/sessions/:id/finalize-absences` | Admin / President | Finalize absences after 7:40 Ethiopian deadline |
| `GET` | `/api/attendance/admin/records` | Admin / President | Master attendance records with filtering |
| `PATCH` | `/api/attendance/admin/records/:id/review` | Admin / President | Approve or reject submission with reason |
| `PATCH` | `/api/attendance/admin/records/:id/correct` | Admin / President | Correct classification with audit log |

---

## 8. Automated Test Suite Plan

Automated test script (`backend/test/attendanceTest.js`) running via Node.js to verify:
1. **Ethiopian Clock Time Boundaries**:
   - 6:59:59 Ethiopian (12:59:59 EAT) $\rightarrow$ Rejection.
   - 7:00:00 Ethiopian (13:00:00 EAT) $\rightarrow$ Accepted as `Present`.
   - 7:29:59 Ethiopian (13:29:59 EAT) $\rightarrow$ Accepted as `Present`.
   - 7:30:00 Ethiopian (13:30:00 EAT) $\rightarrow$ Accepted as `Late`.
   - 7:39:59 Ethiopian (13:39:59 EAT) $\rightarrow$ Accepted as `Late`.
   - 7:40:00 Ethiopian (13:40:00 EAT) $\rightarrow$ Rejection (Session closed).
2. **Credential & Enrollment Validation**:
   - Invalid password $\rightarrow$ 401.
   - Member not enrolled in course $\rightarrow$ 403.
   - Impersonation attempt $\rightarrow$ 403.
3. **Duplicate Prevention**:
   - Second submission for same session $\rightarrow$ 409 / Return existing status.
4. **Administrative Review**:
   - Officer approves submission $\rightarrow$ reviewStatus becomes `Approved`.
   - Officer rejects with reason $\rightarrow$ rejection reason recorded.
5. **Absence Finalization**:
   - Premature finalization before 7:40 $\rightarrow$ Blocked.
   - Post-deadline finalization $\rightarrow$ Marks unsubmitted enrolled students `Absent` idempotently.

---

## 9. Verification & Safe Execution Checkpoints

- **Zero Data Loss**: Existing courses, members, enrollments, certificates, awards, and database records remain strictly intact.
- **Compatibility**: Integrates directly into existing navigation, styles (`src/vanilla/styles.css`), dark/light themes, and API client.
- **Verification Commands**: Build verification via `compile_applet` and type-checking via `lint_applet`.

---

## Awaiting Your Authorization
As instructed, **no code modifications or database updates have been executed**. Please click **Proceed** or reply with your authorization to begin implementation.
