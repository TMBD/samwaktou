# Collaborative Task Workflow — Functional Documentation

> **Feature:** Collaborative audio content management through tasks and role-based administration.

---

## Table of Contents

1. [Context & Problem](#1-context--problem)
2. [Solution Overview](#2-solution-overview)
3. [Admin Roles & Hierarchy](#3-admin-roles--hierarchy)
   - 3.1 [Role Hierarchy](#31-role-hierarchy)
   - 3.2 [Role Descriptions](#32-role-descriptions)
   - 3.3 [Permissions Summary](#33-permissions-summary)
4. [Core Concepts](#4-core-concepts)
   - 4.1 [Task](#41-task)
   - 4.2 [Audio Draft](#42-audio-draft)
   - 4.3 [Recording Session](#43-recording-session)
5. [Task Lifecycle](#5-task-lifecycle)
   - 5.1 [Task Statuses](#51-task-statuses)
   - 5.2 [Task Status Transitions](#52-task-status-transitions)
   - 5.3 [Task Lifecycle Walkthrough](#53-task-lifecycle-walkthrough)
6. [Audio Draft Lifecycle](#6-audio-draft-lifecycle)
   - 6.1 [Audio Draft Statuses](#61-audio-draft-statuses)
   - 6.2 [Audio Draft Status Transitions](#62-audio-draft-status-transitions)
7. [Detailed Workflow Scenarios](#7-detailed-workflow-scenarios)
   - 7.1 [Creating a Task](#71-creating-a-task)
   - 7.2 [Contributing to a Task](#72-contributing-to-a-task)
   - 7.3 [Reviewing a Task](#73-reviewing-a-task)
   - 7.4 [Publishing a Task](#74-publishing-a-task)
   - 7.5 [Handling Corrections](#75-handling-corrections)
   - 7.6 [Rejecting a Task](#76-rejecting-a-task)
8. [Business Rules & Constraints](#8-business-rules--constraints)
9. [Activity Log](#9-activity-log)
10. [Impact on Existing Features](#10-impact-on-existing-features)

---

## 1. Context & Problem

The current content management process is **manual, sequential, and done by a single person**. Here is what it involves:

1. A long recording session (e.g., 30+ minutes) containing many question-answer exchanges is recorded.
2. The recording is **manually split** into individual short audio clips (one question-answer per clip), resulting in ~10-15 clips per session.
3. Each clip must then be **individually uploaded** to the platform with:
   - A **description** — a French summary of the Wolof-language question and answer
   - A **theme** — the topic category
   - **Keywords** — search terms
   - An **author** and **date**
4. Since the audio content is in **Wolof** and the descriptions must be written in **French**, this requires careful listening and translation.

This process is **time-consuming and error-prone** when done by one person. There is no way for multiple administrators to collaborate on this work, and no review process to ensure quality before content goes live.

---

## 2. Solution Overview

We introduce a **Task-based collaborative workflow** that allows multiple administrators to work together on preparing audio content for publication. The key ideas are:

- **Tasks** group audio clips from the same recording session into a single work unit.
- **Admin roles** with a clear hierarchy define who can do what.
- **A backlog and review queue** let admins pick up work and review each other's contributions.
- **A multi-step workflow** with statuses and transitions ensures quality control before publication.
- **An activity log** provides full traceability of who did what.

---

## 3. Admin Roles & Hierarchy

### 3.1 Role Hierarchy

The roles form a **strict hierarchy** where each higher role **inherits all permissions** from the roles below it:

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   System Admin                                               │
│   ├── Full platform control (system, users, settings)        │
│   ├── Everything a Publisher can do                          │
│   │                                                          │
│   │   Publisher                                              │
│   │   ├── Creates tasks                                      │
│   │   ├── Publishes approved content                         │
│   │   ├── Everything a Reviewer can do                       │
│   │   │                                                      │
│   │   │   Reviewer                                           │
│   │   │   ├── Reviews completed tasks                        │
│   │   │   ├── Approves / requests corrections / rejects      │
│   │   │   ├── Everything a Contributor can do                 │
│   │   │   │                                                  │
│   │   │   │   Contributor                                    │
│   │   │   │   ├── Picks tasks from backlog                   │
│   │   │   │   ├── Describes and tags audio drafts            │
│   │   │   │   └── Submits completed work for review          │
│   │   │   │                                                  │
└───┴───┴───┴──────────────────────────────────────────────────┘
```

**Key principle:** Each role can do **everything that the roles below it can do**, plus its own specific capabilities. A Publisher can contribute and review. A Reviewer can contribute. This is not just about one specific action — it's a full hierarchy of capabilities.

### 3.2 Role Descriptions

#### System Admin
The **overall platform administrator**. Manages the system itself: admin accounts, platform settings, and everything else. Can also perform all task-related actions (create, contribute, review, publish). This role is focused on **platform governance**, not day-to-day content work — but has full access if needed.

*Replaces the current "Super Admin" concept and extends it.*

#### Publisher
The **content manager**. Responsible for:
- **Creating new tasks** — uploading audio clips from a recording session and defining the session metadata (author, date).
- **Publishing approved tasks** — pushing reviewed content live to the public platform.
- **Reviewing tasks** — can review and approve/reject like a Reviewer.
- **Contributing** — can also pick up and work on tasks like a Contributor.

A Publisher can publish a task **without an external review** (they are trusted to self-validate).

#### Reviewer
The **quality controller**. Responsible for:
- **Reviewing completed tasks** — picking tasks from the review queue and checking the quality of descriptions, themes, and keywords.
- **Approving, requesting corrections, or rejecting** tasks and individual audio drafts.
- **Contributing** — can also pick up and work on tasks like a Contributor.

A Reviewer **cannot review their own work** — if they contributed to a task, another Reviewer (or Publisher) must review it (four-eyes principle).

#### Contributor
The **content worker**. This is the entry-level role for content preparation. Responsible for:
- **Picking tasks from the backlog** — self-assigning available tasks.
- **Listening to audio clips** and writing French descriptions, selecting themes, adding keywords.
- **Submitting completed work** for review.

### 3.3 Permissions Summary

| Action | Contributor | Reviewer | Publisher | System Admin |
|--------|:-----------:|:--------:|:---------:|:------------:|
| Pick a task from the backlog | ✅ | ✅ | ✅ | ✅ |
| Work on a task (describe/tag audio drafts) | ✅ | ✅ | ✅ | ✅ |
| Submit a task for review | ✅ | ✅ | ✅ | ✅ |
| Unassign self from a task | ✅ | ✅ | ✅ | ✅ |
| Pick a task from the review queue | ❌ | ✅ | ✅ | ✅ |
| Approve / Request corrections / Reject a task | ❌ | ✅ ¹ | ✅ | ✅ |
| Approve / Request corrections / Reject audio drafts | ❌ | ✅ ¹ | ✅ | ✅ |
| Create a new task | ❌ | ❌ | ✅ | ✅ |
| Publish an approved task | ❌ | ❌ | ✅ | ✅ |
| Manage admin accounts | ❌ | ❌ | ❌ | ✅ |
| Platform settings & system management | ❌ | ❌ | ❌ | ✅ |

> ¹ **Four-eyes rule:** A Reviewer cannot review a task they personally contributed to. Another Reviewer or Publisher must review it. Publishers are exempt from this constraint.

---

## 4. Core Concepts

### 4.1 Task

A **Task** represents the work of preparing all the audio clips from **one recording session** for publication. It is the central unit of collaboration.

A task contains:

| Field | Description |
|-------|-------------|
| **Session author** | The Islamic teacher/scholar who gave the answers in the recording |
| **Session date** | The date of the original recording session |
| **Description** | A short description of the task (e.g., "Session du 15 mars 2025 — Imam X") |
| **Status** | Current state in the workflow (see [Task Statuses](#51-task-statuses)) |
| **Assignee** | The admin currently working on or responsible for the task |
| **Creator** | The Publisher who originally created the task |
| **Content** | A list of Audio Drafts (the individual audio clips to process) |
| **Content state** | A summary of how many audio drafts are done, pending, etc. |
| **Activity log** | History of all actions taken on this task |

### 4.2 Audio Draft

An **Audio Draft** is a single audio clip within a task — one question-answer from the recording session. It needs to be described and tagged before it can be published.

An audio draft contains:

| Field | Description |
|-------|-------------|
| **URI** | The audio file reference (uploaded when the task is created) |
| **Description** | The French summary of the question-answer (written by the contributor) |
| **Theme** | The topic category (selected by the contributor) |
| **Keywords** | Search terms (written by the contributor) |
| **Status** | Current state in the workflow (see [Audio Draft Statuses](#61-audio-draft-statuses)) |
| **Review comment** | Feedback from the reviewer (when corrections are needed or rejected) |

**Inherited from the Task (not duplicated per audio draft):**
- **Author** — same for all clips in the session
- **Date** — same for all clips in the session

### 4.3 Recording Session

A **Recording Session** is the real-world event where the original long audio is recorded. It is not a separate entity in the system — its metadata (author, date) is captured at the **Task level** and shared by all audio drafts within that task.

---

## 5. Task Lifecycle

### 5.1 Task Statuses

| Status | Description | Who is responsible |
|--------|-------------|-------------------|
| **OPEN** | Task has been created and is available in the backlog for contributors to pick up | No one yet |
| **IN_PROGRESS** | A contributor has picked up the task and is working on describing/tagging the audio drafts | Contributor (assignee) |
| **IN_REVIEW** | The contributor has finished and submitted the task for review. It appears in the review queue. | Waiting for a reviewer |
| **CORRECTIONS_NEEDED** | The reviewer has found issues and sent the task back for corrections | Contributor (re-assigned) |
| **APPROVED** | The reviewer has accepted the task. It is ready to be published. | Waiting for a publisher |
| **REJECTED** | The reviewer has rejected the task entirely (rare — e.g., unusable audio, duplicate) | Dead end |
| **PUBLISHED** | The content has been pushed live to the public platform | Done |

### 5.2 Task Status Transitions

```
                    ┌──────────────────────────────────────────────┐
                    │                                              │
                    ▼                                              │
   ┌────────┐    ┌─────────────┐    ┌───────────┐    ┌──────────────────────┐
   │  OPEN  │───►│ IN_PROGRESS │───►│ IN_REVIEW │───►│ CORRECTIONS_NEEDED   │
   └────────┘    └─────────────┘    └───────────┘    └──────────────────────┘
                   ▲                   │      │
                   │                   │      │
                   │                   ▼      ▼
                   │            ┌──────────┐  ┌──────────┐
                   │            │ APPROVED │  │ REJECTED │
                   │            └────┬─────┘  └──────────┘
                   │                 │
                   │                 ▼
                   │           ┌───────────┐
                   │           │ PUBLISHED │
                   │           └───────────┘
                   │
                   └─── (unassign: back to OPEN)
```

**Allowed transitions:**

| From | To | Triggered by | Condition |
|------|----|-------------|-----------|
| OPEN | IN_PROGRESS | Contributor assigns task to self | — |
| IN_PROGRESS | OPEN | Contributor unassigns self | Task goes back to backlog |
| IN_PROGRESS | IN_REVIEW | Contributor submits for review | All audio drafts must be in DONE status (none still PENDING) |
| IN_REVIEW | APPROVED | Reviewer approves | All audio drafts are APPROVED |
| IN_REVIEW | CORRECTIONS_NEEDED | Reviewer requests corrections | Reviewer must leave comments on flagged audio drafts |
| IN_REVIEW | REJECTED | Reviewer rejects | Reviewer must provide a reason |
| CORRECTIONS_NEEDED | IN_REVIEW | Contributor resubmits after corrections | All flagged audio drafts have been addressed |
| APPROVED | PUBLISHED | Publisher publishes | — |

### 5.3 Task Lifecycle Walkthrough

Here is a typical happy path:

1. **Publisher** creates a task: uploads 12 audio clips, sets the author and date → Task is **OPEN**.
2. **Contributor** browses the backlog, picks the task → Task is **IN_PROGRESS**.
3. **Contributor** listens to each clip, writes descriptions, selects themes, adds keywords, marks each as done.
4. **Contributor** finishes all 12 clips and submits the task → Task is **IN_REVIEW**.
5. **Reviewer** browses the review queue, picks the task, checks each audio draft.
6. **Reviewer** approves all 12 audio drafts and approves the task → Task is **APPROVED**.
7. **Publisher** reviews the approved task and publishes it → Task is **PUBLISHED**, and all 12 audios are now live on the public platform.

---

## 6. Audio Draft Lifecycle

### 6.1 Audio Draft Statuses

| Status | Description |
|--------|-------------|
| **PENDING** | Audio draft has not been described yet (initial state) |
| **DONE** | Contributor has finished describing and tagging this audio draft |
| **APPROVED** | Reviewer has approved this audio draft |
| **CORRECTIONS_NEEDED** | Reviewer has flagged this audio draft for corrections (with a comment) |
| **REJECTED** | Reviewer has rejected this audio draft (e.g., bad audio quality, duplicate) |

### 6.2 Audio Draft Status Transitions

```
   ┌─────────┐     ┌──────┐     ┌──────────┐
   │ PENDING │────►│ DONE │────►│ APPROVED │
   └─────────┘     └──────┘     └──────────┘
                      │
                      ▼
              ┌──────────────────────┐
              │ CORRECTIONS_NEEDED   │──────► DONE (after fix)
              └──────────────────────┘
                      │
                      ▼
                ┌──────────┐
                │ REJECTED │
                └──────────┘
```

**Allowed transitions:**

| From | To | Triggered by | Condition |
|------|----|-------------|-----------|
| PENDING | DONE | Contributor fills in description, theme, keywords | All required fields are filled |
| DONE | APPROVED | Reviewer approves | — |
| DONE | CORRECTIONS_NEEDED | Reviewer requests corrections | Must provide a review comment |
| DONE | REJECTED | Reviewer rejects | Must provide a reason |
| CORRECTIONS_NEEDED | DONE | Contributor fixes and resubmits | All required fields are filled |

**Notes:**
- A **REJECTED** audio draft is a dead end — it will not be published. It remains in the task for record-keeping but is excluded from publication.
- When a task is published, only **APPROVED** audio drafts become live content. **REJECTED** audio drafts are ignored.

---

## 7. Detailed Workflow Scenarios

### 7.1 Creating a Task

**Who:** Publisher or System Admin

**Steps:**
1. Navigate to the admin dashboard → Task management → "Create Task"
2. Upload multiple audio files (the pre-split clips from one recording session)
3. Fill in session-level metadata:
   - **Author** — select or type the teacher's name
   - **Session date** — the date of the original recording
   - **Description** — a short label for the task (e.g., "Session Imam X — 15/03/2025")
4. Submit → Task is created with status **OPEN** and all audio drafts in **PENDING** status
5. The task appears in the **backlog** for contributors to pick up

### 7.2 Contributing to a Task

**Who:** Any admin (Contributor, Reviewer, Publisher, or System Admin)

**Steps:**
1. Navigate to the **Task Backlog** — list of all OPEN tasks
2. Pick a task → Assign it to yourself → Status changes to **IN_PROGRESS**
3. For each audio draft in the task:
   - Listen to the audio clip
   - Write a French description summarizing the question-answer
   - Select or type a theme
   - Add relevant keywords
   - Mark the audio draft as **DONE**
4. Once all audio drafts are processed (all in DONE or REJECTED status):
   - Submit the task for review → Status changes to **IN_REVIEW**
   - The task appears in the **review queue**

**Unassigning:** If a contributor cannot finish the work, they can unassign themselves. The task goes back to **OPEN** and returns to the backlog. Any work already done on individual audio drafts is **preserved** (audio drafts that were marked DONE remain DONE).

### 7.3 Reviewing a Task

**Who:** Reviewer, Publisher, or System Admin

**Four-eyes rule:** A Reviewer cannot review a task they contributed to. A Publisher is exempt from this rule.

**Steps:**
1. Navigate to the **Review Queue** — list of all IN_REVIEW tasks
2. Pick a task to review → Assign it to yourself as reviewer
3. For each audio draft:
   - Listen to the audio clip
   - Read the description, check the theme and keywords
   - **Approve** → Audio draft status becomes APPROVED
   - **Request corrections** → Audio draft status becomes CORRECTIONS_NEEDED (must leave a comment explaining what to fix)
   - **Reject** → Audio draft status becomes REJECTED (must provide a reason)
   - **Fix directly** → The reviewer can also directly edit the description/theme/keywords and approve it (faster for minor issues)
4. Once all audio drafts are reviewed (all in APPROVED, CORRECTIONS_NEEDED, or REJECTED):
   - If **all are APPROVED** (or REJECTED) → Approve the task → Task status becomes **APPROVED**
   - If **any need corrections** → Request corrections on the task → Task status becomes **CORRECTIONS_NEEDED**, and the task goes back to the contributor

### 7.4 Publishing a Task

**Who:** Publisher or System Admin

**Steps:**
1. Navigate to the list of **APPROVED** tasks
2. Review the task one final time (optional)
3. Click **Publish** → Task status becomes **PUBLISHED**
4. All **APPROVED** audio drafts within the task are automatically converted into live audio entries on the public platform (with the session author and date inherited from the task)
5. **REJECTED** audio drafts are excluded from publication

### 7.5 Handling Corrections

When a reviewer requests corrections:

1. Task status becomes **CORRECTIONS_NEEDED**
2. The task is **re-assigned to the original contributor** (the person who submitted it)
3. The contributor sees which audio drafts need corrections and reads the reviewer's comments
4. The contributor fixes the flagged audio drafts and marks them as **DONE** again
5. The contributor resubmits the task → Status changes back to **IN_REVIEW**
6. The task re-enters the review queue (ideally picked up by the same reviewer for continuity, but any qualified reviewer can take it)

### 7.6 Rejecting a Task

Rejection is a **rare, terminal action**. It means the task as a whole is not suitable for publication (e.g., all audio clips are of poor quality, the session is a duplicate).

- The reviewer must provide a **reason** for rejection.
- A rejected task remains in the system for record-keeping but cannot be reactivated.
- If some clips are salvageable, the reviewer should approve those individual audio drafts and reject only the bad ones, rather than rejecting the entire task.

---

## 8. Business Rules & Constraints

### Role & Permission Rules

| # | Rule |
|---|------|
| R1 | Only **Publishers** and **System Admins** can create tasks |
| R2 | Only **Publishers** and **System Admins** can publish tasks |
| R3 | Any admin can assign themselves a task from the backlog (Contributor and above) |
| R4 | Only **Reviewers** and above can review tasks from the review queue |
| R5 | A **Reviewer** cannot review a task they contributed to (four-eyes principle) |
| R6 | **Publishers** are exempt from rule R5 — they can review their own contributions |
| R7 | **System Admins** are exempt from rule R5 |

### Task Rules

| # | Rule |
|---|------|
| T1 | A task can only have **one assignee** at a time |
| T2 | A task can only be submitted for review when **all audio drafts are in DONE or REJECTED status** (none still PENDING) |
| T3 | A task can only be approved when **all audio drafts are in APPROVED or REJECTED status** |
| T4 | A task can only be published when its status is **APPROVED** |
| T5 | When a task is sent back for corrections, it is **re-assigned to the previous contributor** |
| T6 | When a contributor unassigns from a task, it returns to **OPEN** and the assignee is cleared |
| T7 | A published task converts only **APPROVED** audio drafts into live content |
| T8 | A task always belongs to a **single recording session** (one author, one date) |

### Audio Draft Rules

| # | Rule |
|---|------|
| A1 | An audio draft can only be marked DONE when **description, theme, and keywords** are all filled |
| A2 | A correction request on an audio draft **must include a comment** explaining what to fix |
| A3 | A rejection of an audio draft **must include a reason** |
| A4 | Author and date are **inherited from the task**, not set per audio draft |

---

## 9. Activity Log

Every significant action on a task is recorded in an **activity log** to ensure full traceability. Each log entry contains:

| Field | Description |
|-------|-------------|
| **Timestamp** | When the action occurred |
| **Actor** | Which admin performed the action |
| **Action** | What was done (e.g., "assigned task", "approved audio draft #3", "requested corrections") |
| **Details** | Additional context (e.g., review comment, rejection reason) |

**Logged actions include:**
- Task created
- Task assigned / unassigned
- Task submitted for review
- Task approved / corrections requested / rejected
- Task published
- Audio draft marked as done
- Audio draft approved / corrections requested / rejected
- Audio draft edited (during review)

---

## 10. Impact on Existing Features

### Admin Model Changes

The current admin model uses a simple `isSuperAdmin` boolean. This will be replaced by a **role** field:

| Current | New |
|---------|-----|
| `isSuperAdmin: true` | `role: SYSTEM_ADMIN` |
| `isSuperAdmin: false` | `role: CONTRIBUTOR` (default) or any other role as assigned |

This is a **breaking change** on the admin model and will require a migration of existing admin records.

### Audio Publication

Currently, audios are created directly through the admin interface. With the task workflow:
- The **direct audio creation** feature remains available for Publishers and System Admins (for quick, one-off uploads that don't need the full workflow).
- The **task workflow** is the recommended path for bulk content from recording sessions.

### Existing Public Features

The public-facing features (browsing, searching, listening, downloading, sharing) are **not affected**. Published audio entries appear exactly the same to end users regardless of whether they were created directly or through the task workflow.

---

*This document defines the functional aspects of the collaborative task workflow. For implementation details, see [Task Feature — Technical Documentation](./TASK_FEATURE_TECHNICAL.md).*
