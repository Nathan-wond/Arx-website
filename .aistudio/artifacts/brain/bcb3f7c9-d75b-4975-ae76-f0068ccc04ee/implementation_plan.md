# ARX IT Club System Improvement Plan (Sections 1, 2 & 3)

A unified architectural and implementation blueprint to resolve registration essay and Telegram validation, fix Telegram bot channel membership verification loops, and enhance the administrator application review workflow with backend security and audit trails.

***

## User Review & Critical Decisions

> [!IMPORTANT]
> This plan combines all three sections provided. Implementation is completely halted until you explicitly review and approve this blueprint.

- **Confirmed Decision 1 (Brand & Data Integrity)**: Preserve the official brand name **ARX IT Club** (never AXR), official bot `@ARXITCLUB_bot`, official channel `@arxitclub` (`https://t.me/arxitclub`), and all existing member IDs, administrative accounts, routes, and database records without resetting or wiping the database.
- **Confirmed Decision 2 (Registration Essay Rules)**: Minimum 100 words enforced identically on frontend and backend using whitespace-split tokenization (`str.trim().split(/\s+/).filter(Boolean)`). Includes a live word counter, remaining words indicator, success state when reaching 100 words, and specific validation feedback.
- **Confirmed Decision 3 (Telegram Verification Resilience)**: Fix channel membership verification loop in `@ARXITCLUB_bot`. Account for all valid Telegram `ChatMember` statuses (`creator`, `administrator`, `member`, and `restricted` with `can_send_messages`), handle technical API errors gracefully without trapping members in endless join loops, and link accounts definitively using numeric `telegram_user_id`.
- **Confirmed Decision 4 (Admin Dashboard & Backend RBAC)**: Protect every approval and rejection endpoint with server-side administrator authorization and audit logging (admin ID, decision timestamp, rejection reason). Approved applications immediately unlock Member Portal access and trigger Telegram bot notification to the applicant.

***

## 1. Overview & Core Concept

### What It Does
The ARX IT Club platform manages the complete lifecycle of club membership:
1. **Public Website & Registration**: Prospective members explore club activities, projects, and curriculum, then complete an application with validated grade, Telegram username, optional email, and a minimum 100-word essay.
2. **Telegram Activation Gateway**: The applicant opens `@ARXITCLUB_bot` via deep-link to verify their Telegram identity and verify membership in `@arxitclub`.
3. **Admin Application Management**: Authorized club leaders review pending applications, inspect applicant essays and verified Telegram credentials, approve or reject applications with audit logging, and trigger instant applicant notifications.
4. **Member Portal**: Approved members access internal resources, course materials, assignments, attendance records, and club achievements.

### Target Audience & Personas
- **Applicants / Students**: Seeking to join ARX IT Club of SJS; need a friction-free registration experience with clear progress indicators and instant bot guidance.
- **Club Administrators / Officers**: Reviewing candidate submissions, verifying eligibility, inspecting essays, and executing review decisions.
- **Active Members**: Accessing club events, courses, and project showcases.

### Key Value
Eliminates registration drops caused by validation mismatches and verification deadlocks, prevents duplicate or spoofed registrations, guarantees administrative accountability through audit trails, and maintains 100% data continuity.

***

## 2. User Experience & Visual Design

### Key User Flows

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER JOURNEY                                   │
└─────────────────────────────────────────────────────────────────────────────┘

 [Applicant]                   [Telegram Bot]                  [Admin]
      │                              │                            │
      │ 1. Submits Form              │                            │
      │    - 100+ word essay         │                            │
      │    - Valid Telegram handle   │                            │
      ▼                              │                            │
 ┌───────────────┐                   │                            │
 │ Application   │                   │                            │
 │ Stored        │                   │                            │
 └───────┬───────┘                   │                            │
         │ 2. Deep-link (/start)     │                            │
         └──────────────────────────►│                            │
                                     │ 3. Verifies @arxitclub     │
                                     │    membership status       │
                                     │ 4. Links numeric           │
                                     │    Telegram User ID        │
                                     ▼                            │
                               ┌───────────────┐                  │
                               │ Application   │                  │
                               │ Activated     │                  │
                               └───────┬───────┘                  │
                                       │                          │
                                       │ 5. Appears in queue      │
                                       └─────────────────────────►│
                                                                  │ 6. Reviews Essay & Info
                                                                  │ 7. Approves / Rejects
                                                                  ▼
                               ┌───────────────┐          ┌───────────────┐
                               │ Notification  │◄─────────│ Decision &    │
                               │ Sent to Bot   │          │ Audit Saved   │
                               └───────────────┘          └───────────────┘
```

### Visual Identity & Theme
- **Color Palette**: Dark Slate background (`#0B0F19` / `#0F172A`), Obsidian structural cards (`#1E293B`), Vivid Electric Cyan (`#06B6D4` / `#0891B2`) and Royal Indigo (`#6366F1`) accents.
- **Typography & Scale**: Neo-Grotesque display headings (`Plus Jakarta Sans`), readable body (`DM Sans`), and tabular figures (`font-mono tabular-nums`) for word counters, dates, and member IDs.
- **Anti-Pill & Metadata Discipline**: Metadata tags (Grade, Date, Status, Word Count) rendered with clean typographic separators (`·` or `-`) rather than candy-colored badge capsules.
- **Form Feedback**: Real-time word counter with clear color transitions:
  - `< 100 words`: Neutral slate counter with remaining word count: `74 / 100 words (26 more needed)`.
  - `≥ 100 words`: Emerald success state: `112 words (Minimum reached)`.

***

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Live Essay Word Counting Algorithm
- **Chosen Approach**: Use a single identical tokenization rule on both client and server:
  ```javascript
  const countWords = (text) => text.trim().split(/\s+/).filter(Boolean).length;
  ```
- **Why**: Prevents discrepancies where an applicant sees 100 words on their browser but the server rejects it as 99 due to newline, multi-space, or punctuation handling.
- **Alternatives Considered**: Character counting (rejected because prompt specifically mandates a 100-word minimum).

### Decision 2: Telegram Channel Verification & Status Parsing
- **Chosen Approach**: Query Telegram API `getChatMember` for chat `@arxitclub`. Treat statuses `creator`, `administrator`, `member`, and `restricted` (if `is_member: true` or `can_send_messages: true`) as confirmed members. Distinguish between *technical API errors* (network timeout, rate limit, bot permission error) and *genuine non-membership* (`left`, `kicked`), providing actionable guidance in both cases.
- **Why**: Previous implementation suffered from false negatives where members who had joined were reported as not joined.
- **Alternatives Considered**: Client-side manual confirmation without bot check (rejected because it allows bypass by non-members).

### Decision 3: Identity Verification by Telegram User ID
- **Chosen Approach**: The applicant's identity is locked to their permanent numeric `telegram_user_id` when they start the bot via the deep-link token (`/start act_<CODE>`). The username handle (`@username`) is stored for display and search, but the numeric ID provides authoritative uniqueness.
- **Why**: Handles can be changed or spoofed; Telegram user IDs are immutable.
- **Alternatives Considered**: Relying solely on `@username` string matching (rejected due to username changes and impersonation risks).

### Decision 4: Backend-Enforced Admin Authorization & Audit Trail
- **Chosen Approach**: Protect `/api/admin/applications/:id/approve` and `/api/admin/applications/:id/reject` with JWT role verification (`req.user.role === 'admin'`). Record an audit entry in the database containing `decision`, `adminId`, `adminName`, `timestamp`, and `rejectionReason`.
- **Why**: Guarantees security even if a malicious user inspects network requests or attempts direct API calls.
- **Alternatives Considered**: Frontend-only button hiding (rejected as insecure).

***

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ARX IT CLUB SYSTEM                               │
└─────────────────────────────────────────────────────────────────────────────┘

  Frontend (React SPA / Vanilla Views)
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  RegisterPage.tsx      │  admin-applications.html  │  dashboard.html     │
  │  - Live 100-word essay │  - Review queue           │  - Member portal    │
  │  - Username validator  │  - Audit history modal    │  - Verified badge   │
  └────────────────────┬───────────────────┬───────────────────┬────────────┘
                       │                   │                   │
                       ▼                   ▼                   ▼
  Express Backend & Middleware (`/backend/src`)
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  Auth & Validation Router   │ Admin Review Router  │ Telegram Bot Router│
  │  - validationUtils.js       │ - authMiddleware.js  │ - getChatMember()  │
  │  - wordCount >= 100         │ - Role verification  │ - Deep-link parser │
  │  - unique username check    │ - Audit logging      │ - Notification bot │
  └────────────────────┬───────────────────┬───────────────────┬────────────┘
                       │                   │                   │
                       ▼                   ▼                   ▼
  Authoritative Persistence Layer (`db.js` + `fileService.js`)
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  Members & Applications Store (`arx_database.json`)                     │
  │  - id: "ARX-2026-XXXX"                                                  │
  │  - status: "pending" | "activated" | "approved" | "rejected"           │
  │  - telegramUserId, telegramUsername, essay, wordCount                   │
  │  - auditTrail: [{ action, adminId, adminName, timestamp, reason }]     │
  └─────────────────────────────────────────────────────────────────────────┘
```

### Data Model Enhancements
Each application record in `arx_database.json` maintains:
```typescript
interface ApplicationRecord {
  id: string; // Member ID (e.g. ARX-2026-0042)
  fullName: string;
  grade: string;
  telegramUsername: string;
  telegramUserId?: number | string; // Verified numeric ID from Telegram bot
  email?: string;
  essay: string;
  wordCount: number;
  status: 'pending_telegram' | 'activated' | 'approved' | 'rejected';
  isTelegramVerified: boolean;
  isActivated: boolean;
  activationCode: string;
  createdAt: string;
  activatedAt?: string;
  reviewedAt?: string;
  reviewedBy?: {
    adminId: string;
    adminName: string;
  };
  rejectionReason?: string;
  auditTrail: Array<{
    action: 'registered' | 'activated' | 'approved' | 'rejected' | 'reopened';
    actorId: string;
    actorName: string;
    timestamp: string;
    notes?: string;
  }>;
}
```

### Verification & Testing Plan
1. **Essay Validation Test**: Test submissions with 0 words, 50 words, 99 words (blocked with remaining word count), 100 words (allowed), and 250 words (allowed).
2. **Telegram Format Test**: Test usernames with `@`, without `@`, under 5 characters (blocked), special symbols (blocked), valid usernames (allowed).
3. **Telegram Verification Test**: Test `/start` with valid activation code, test membership check against `@arxitclub`, confirm non-members receive retry prompt, confirm verified members advance to activated status.
4. **Admin Review Test**: Log in as admin, inspect pending application with full essay and Telegram ID, approve application, verify audit trail entry is persisted, verify member can log in to portal.
5. **Security Test**: Attempt review actions without admin token, verify 401/403 response.
