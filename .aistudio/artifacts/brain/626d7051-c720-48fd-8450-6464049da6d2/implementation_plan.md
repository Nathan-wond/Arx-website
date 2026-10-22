# Attendance Management System for ARX IT Club of SJS

## Overview of Implemented System
The Attendance Management System provides end-to-end management for Computer Lab 3 attendance sessions, operating authoritatively on the Ethiopian clock convention (`Africa/Addis_Ababa` timezone, UTC+3).

### Key Completed Components
1. **Ethiopian Clock Conversion & Scheduling Engine** (`backend/src/utils/ethiopianTimeUtils.js`):
   - Computes live time in `Africa/Addis_Ababa` independent of client or host server timezone.
   - Converts seamlessly between Ethiopian clock (daytime 7:00-7:40 afternoon) and international 24h/12h formats (13:00-13:40 EAT / 1:00 PM-1:40 PM).
   - Strict schedule boundaries:
     - **Before 7:00 Ethiopian (Before 13:00 EAT)**: Form is closed / marked upcoming.
     - **7:00 to < 7:30 Ethiopian (13:00:00 to 13:29:59 EAT)**: Open on-time window with provisional `Present` classification.
     - **7:30 to < 7:40 Ethiopian (13:30:00 to 13:39:59 EAT)**: Open late window with provisional `Late` classification.
     - **7:40 Ethiopian and afterward (13:40:00 EAT onward)**: Closed window; ordinary submissions rejected.

2. **Member Verification & Self-Service Check-In** (`src/pages/portal/MyAttendancePage.tsx`, `backend/src/controllers/attendanceController.js`):
   - Automatic attribution to verified student Member ID.
   - Account password verification against PBKDF2 salt hash to eliminate buddy check-ins.
   - Course enrollment validation checking active enrollment before accepting submissions.
   - Atomic duplicate check-in prevention with informative status feedback.
   - Live metrics calculating total sessions, on-time percentage, and official 80% certificate qualification threshold.

3. **Administrative Suite & Controlled Finalization** (`src/vanilla/pages/admin/adminDashboard.js`, `src/vanilla/components/adminSidebar.js`):
   - **Active Sessions Tab**: Create, edit, and publish course-linked lab sessions with Ethiopian time pickers.
   - **Submission Review Queue**: Approve or reject provisional check-ins with official logged reasons.
   - **Classification Overrides**: Manual corrections with reviewer audit trail.
   - **Controlled Absence Finalization**: One-click batch absence generation for eligible non-submitting enrolled students, strictly locked until the 7:40 Ethiopian deadline.
   - **Analytics & Master Roster**: Multi-criteria filtering by course, date, review status, and student.

4. **Automated Verification**:
   - Integration & unit test suite in `backend/test/attendanceTest.js` verifying time arithmetic, schedule window transitions, invalid credentials, duplicate prevention, review approvals, and absence eligibility.
   - Zero compilation or linting warnings (`tsc --noEmit` and `vite build` passing).
