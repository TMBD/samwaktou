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
   - 4.4 [Theme Management](#44-theme-management)
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
   - 7.7 [Unpublishing a Task](#77-unpublishing-a-task)
8. [Business Rules & Constraints](#8-business-rules--constraints)
9. [Activity Log](#9-activity-log)
10. [User Experience & Interface Requirements](#10-user-experience--interface-requirements)
11. [Impact on Existing Features](#11-impact-on-existing-features)

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
- **Ownership clarity** — at any given moment, if someone is working on a task, it must be clear to everyone else. No two people should work on the same task unknowingly.
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
│   ├── Can unpublish tasks (exceptional operation)            │
│   ├── Can hard-delete content                                │
│   ├── Everything a Publisher can do                          │
│   │                                                          │
│   │   Publisher                                              │
│   │   ├── Creates tasks                                      │
│   │   ├── Publishes approved content                         │
│   │   ├── Can hard-delete content                            │
│   │   ├── Everything a Reviewer can do                       │
│   │   │                                                      │
│   │   │   Reviewer                                           │
│   │   │   ├── Reviews completed tasks                        │
│   │   │   ├── Approves / requests corrections / rejects      │
│   │   │   ├── Can reassign or unassign any task              │
│   │   │   ├── Everything a Contributor can do                 │
│   │   │   │                                                  │
│   │   │   │   Contributor                                    │
│   │   │   │   ├── Picks tasks from backlog                   │
│   │   │   │   ├── Describes and tags audio drafts            │
│   │   │   │   ├── Can suggest rejections (with reason)       │
│   │   │   │   └── Submits completed work for review          │
│   │   │   │                                                  │
└───┴───┴───┴──────────────────────────────────────────────────┘
```

**Key principle:** Each role can do **everything that the roles below it can do**, plus its own specific capabilities. A Publisher can contribute and review. A Reviewer can contribute. This is not just about one specific action — it's a full hierarchy of capabilities.

### 3.2 Role Descriptions

#### System Admin
The **overall platform administrator**. Manages the system itself: admin accounts, platform settings, and everything else. Can also perform all task-related actions (create, contribute, review, publish). This role is focused on **platform governance**, not day-to-day content work — but has full access if needed.

Unique capabilities:
- **Unpublish tasks** — Can revert a published task (removes all its audios from the public platform). This is an exceptional and rare operation requiring explicit confirmation.
- **Manage admin accounts** — Create, update, delete admin accounts and assign roles.
- **Platform settings** — System-level configuration.

*Replaces the current "Super Admin" concept and extends it.*

#### Publisher
The **content manager**. Responsible for:
- **Creating new tasks** — uploading audio clips from a recording session and defining the session metadata (author, date).
- **Publishing approved tasks** — pushing reviewed content live to the public platform.
- **Hard-deleting content** — Permanently deleting tasks, audio drafts, or published audios.
- **Reviewing tasks** — can review and approve/reject like a Reviewer.
- **Contributing** — can also pick up and work on tasks like a Contributor.

A Publisher can publish a task **without an external review** (they are trusted to self-validate).

#### Reviewer
The **quality controller**. Responsible for:
- **Reviewing completed tasks** — picking tasks from the review queue and checking the quality of descriptions, themes, and keywords.
- **Approving, requesting corrections, or rejecting** tasks and individual audio drafts.
- **Reassigning or unassigning tasks** — Can reassign a task to a different admin or unassign it back to the backlog/review queue. This helps unblock situations (e.g., a contributor who is unavailable).
- **Contributing** — can also pick up and work on tasks like a Contributor.

A Reviewer **cannot review their own work** — if they contributed to a task, another Reviewer (or Publisher) must review it (four-eyes principle).

#### Contributor
The **content worker**. This is the entry-level role for content preparation. Responsible for:
- **Picking tasks from the backlog** — self-assigning available tasks.
- **Listening to audio clips** and writing French descriptions, selecting themes, adding keywords.
- **Suggesting rejections** — Can flag an audio draft or an entire task as "suggested for rejection" with a mandatory reason. The final decision is made by the reviewer.
- **Adding new themes** — Can propose a new theme if none of the existing ones fit. New themes are visually flagged for the reviewer to validate.
- **Submitting completed work** for review.

### 3.3 Permissions Summary

| Action | Contributor | Reviewer | Publisher | System Admin |
|--------|:-----------:|:--------:|:---------:|:------------:|
| Pick a task from the backlog | ✅ | ✅ | ✅ | ✅ |
| Work on a task (describe/tag audio drafts) | ✅ | ✅ | ✅ | ✅ |
| Suggest rejection of audio draft or task (with reason) | ✅ | ✅ | ✅ | ✅ |
| Add a new theme (flagged for review) | ✅ | ✅ | ✅ | ✅ |
| Submit a task for review | ✅ | ✅ | ✅ | ✅ |
| Unassign self from a task | ✅ | ✅ | ✅ | ✅ |
| Reassign or unassign any task | ❌ | ✅ | ✅ | ✅ |
| Pick a task from the review queue | ❌ | ✅ | ✅ | ✅ |
| Approve / Request corrections / Reject a task | ❌ | ✅ ¹ | ✅ | ✅ |
| Approve / Request corrections / Reject audio drafts | ❌ | ✅ ¹ | ✅ | ✅ |
| Create a new task | ❌ | ❌ | ✅ | ✅ |
| Publish an approved task | ❌ | ❌ | ✅ | ✅ |
| Hard-delete content (tasks, audio drafts, published audios) | ❌ | ❌ | ✅ | ✅ |
| Unpublish a task | ❌ | ❌ | ❌ | ✅ |
| Manage admin accounts | ❌ | ❌ | ❌ | ✅ |
| Platform settings & system management | ❌ | ❌ | ❌ | ✅ |

> ¹ **Four-eyes rule:** A Reviewer cannot review a task they personally contributed to. Another Reviewer or Publisher must review it. Publishers and System Admins are exempt from this constraint.

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
| **Assignee** | The admin currently working on or responsible for the task (null when unassigned) |
| **Creator** | The Publisher who originally created the task |
| **Content** | A list of Audio Drafts (the individual audio clips to process) |
| **Content state** | A summary of how many audio drafts are done, pending, etc. |
| **Rejection suggestion** | Optional: contributor's suggestion to reject the entire task, with a reason |
| **Activity log** | History of all actions taken on this task |

### 4.2 Audio Draft

An **Audio Draft** is a single audio clip within a task — one question-answer from the recording session. It needs to be described and tagged before it can be published.

An audio draft contains:

| Field | Description |
|-------|-------------|
| **URI** | The audio file reference (uploaded when the task is created) |
| **Description** | The French summary of the question-answer (written by the contributor) |
| **Theme** | The topic category (selected or created by the contributor) |
| **Is new theme** | Flag indicating if the contributor created a new theme (for reviewer attention) |
| **Keywords** | Search terms (written by the contributor) |
| **Status** | Current state in the workflow (see [Audio Draft Statuses](#61-audio-draft-statuses)) |
| **Review comment** | Feedback from the reviewer (when corrections are needed or rejected) |
| **Rejection suggestion** | Optional: contributor's suggestion to reject this audio draft, with a reason |

**Inherited from the Task (not duplicated per audio draft):**
- **Author** — same for all clips in the session
- **Date** — same for all clips in the session

### 4.3 Recording Session

A **Recording Session** is the real-world event where the original long audio is recorded. It is not a separate entity in the system — its metadata (author, date) is captured at the **Task level** and shared by all audio drafts within that task.

### 4.4 Theme Management

Themes are the topic categories assigned to audio content (e.g., "Prière", "Mariage", "Comportement").

**Existing themes** are available as a dropdown for contributors to select from. However, sometimes a recording covers a topic that doesn't match any existing theme.

**New theme creation by contributors:**
- When working on an audio draft, a contributor can **create a new theme** if none of the existing ones fit.
- When a new theme is created, the audio draft is **flagged with a "new theme" indicator**.
- During review, the reviewer can easily see which audio drafts have new themes:
  - **Accept the new theme** — It becomes part of the permanent theme list.
  - **Replace with an existing theme** — If the contributor made a mistake or a similar theme already exists (e.g., typo, duplicate).
  - **Rename the new theme** — Correct the wording while keeping the intent.

This mechanism avoids theme duplication and typos while allowing contributors the flexibility to handle new topics without blocking their work.

---

## 5. Task Lifecycle

### 5.1 Task Statuses

| Status | Description | Who is responsible |
|--------|-------------|-------------------|
| **OPEN** | Task has been created and is available in the **backlog** for contributors to pick up | No one (unassigned) |
| **IN_PROGRESS** | A contributor has picked up the task and is actively working on it | Contributor (assignee) |
| **READY_FOR_REVIEW** | The contributor has finished and submitted the task. It is in the **review queue**, waiting for a reviewer to pick it up. | No one (unassigned, waiting) |
| **IN_REVIEW** | A reviewer has picked up the task and is actively reviewing it | Reviewer (assignee) |
| **CORRECTIONS_NEEDED** | The reviewer has found issues and sent the task back for corrections. By default re-assigned to the previous contributor, but can be unassigned to the backlog. | Contributor (assignee) or No one (unassigned) |
| **APPROVED** | The reviewer has accepted the task. It is ready to be published. | Waiting for a publisher |
| **REJECTED** | The reviewer has rejected the task entirely (rare — e.g., unusable audio, duplicate) | Dead end |
| **PUBLISHED** | The content has been pushed live to the public platform. The task remains linked to its published audios. | Done |

### 5.2 Task Status Transitions

```
                         ┌─────────────────────────────────────────────────────┐
                         │                                                     │
                         ▼                                                     │
  ┌────────┐    ┌─────────────┐    ┌──────────────────┐    ┌───────────┐    ┌──────────────────────┐
  │  OPEN  │───►│ IN_PROGRESS │───►│ READY_FOR_REVIEW │───►│ IN_REVIEW │───►│ CORRECTIONS_NEEDED   │
  └────────┘    └─────────────┘    └──────────────────┘    └───────────┘    └──────────────────────┘
                  ▲       ▲                                   │      │          │
                  │       │                                   │      │          │
                  │       │                                   ▼      ▼          ▼
                  │       │                            ┌──────────┐  ┌──────────┐
                  │       │                            │ APPROVED │  │ REJECTED │
                  │       │                            └────┬─────┘  └──────────┘
                  │       │                                 │
                  │       │                                 ▼
                  │       │                           ┌───────────┐
                  │       │                           │ PUBLISHED │
                  │       │                           └───────────┘
                  │       │
                  │       └── (unassign from CORRECTIONS_NEEDED: back to OPEN)
                  │
                  └─── (unassign from IN_PROGRESS: back to OPEN)
```

**Allowed transitions:**

| From | To | Triggered by | Condition |
|------|----|-------------|-----------|
| OPEN | IN_PROGRESS | Any admin assigns task to self | — |
| IN_PROGRESS | OPEN | Assignee unassigns self, or Reviewer/Publisher unassigns them | Task goes back to backlog |
| IN_PROGRESS | READY_FOR_REVIEW | Contributor submits for review | All audio drafts must be in DONE, REJECTION_SUGGESTED, or REJECTED status (none still PENDING) |
| READY_FOR_REVIEW | IN_REVIEW | Reviewer assigns task to self for review | Four-eyes rule applies for Reviewers |
| IN_REVIEW | APPROVED | Reviewer approves | All audio drafts are APPROVED or REJECTED |
| IN_REVIEW | CORRECTIONS_NEEDED | Reviewer requests corrections | Reviewer must leave comments on flagged audio drafts |
| IN_REVIEW | REJECTED | Reviewer rejects | Reviewer must provide a reason |
| CORRECTIONS_NEEDED | IN_PROGRESS | Contributor picks up corrections | Assignee starts working again |
| CORRECTIONS_NEEDED | OPEN | Reviewer unassigns the task | Task goes back to backlog for anyone to pick up |
| IN_PROGRESS | READY_FOR_REVIEW | Contributor resubmits after corrections | Same conditions as initial submission |
| APPROVED | PUBLISHED | Publisher publishes | — |
| PUBLISHED | APPROVED | System Admin unpublishes | Requires explicit confirmation; removes all audios from public platform |

### 5.3 Task Lifecycle Walkthrough

Here is a typical happy path:

1. **Publisher** creates a task: uploads 12 audio clips, sets the author and date → Task is **OPEN**.
2. **Contributor** browses the backlog, picks the task → Task is **IN_PROGRESS**.
3. **Contributor** listens to each clip, writes descriptions, selects themes, adds keywords, marks each as done.
4. **Contributor** finishes all 12 clips and submits the task → Task is **READY_FOR_REVIEW**.
5. **Reviewer** browses the review queue, picks the task → Task is **IN_REVIEW**.
6. **Reviewer** checks each audio draft, approves all 12 → approves the task → Task is **APPROVED**.
7. **Publisher** reviews the approved task and publishes it → Task is **PUBLISHED**, and all 12 audios are now live on the public platform.

---

## 6. Audio Draft Lifecycle

### 6.1 Audio Draft Statuses

| Status | Description |
|--------|-------------|
| **PENDING** | Audio draft has not been described yet (initial state) |
| **DONE** | Contributor has finished describing and tagging this audio draft |
| **REJECTION_SUGGESTED** | Contributor has suggested this audio draft should be rejected, with a reason. The reviewer will make the final decision. |
| **APPROVED** | Reviewer has approved this audio draft |
| **CORRECTIONS_NEEDED** | Reviewer has flagged this audio draft for corrections (with a comment) |
| **REJECTED** | Reviewer has rejected this audio draft (e.g., bad audio quality, duplicate) |

### 6.2 Audio Draft Status Transitions

```
                                         ┌──────────┐
                              ┌─────────►│ APPROVED │
                              │          └──────────┘
   ┌─────────┐     ┌──────┐──┤
   │ PENDING │────►│ DONE │  │          ┌──────────────────────┐
   └─────────┘     └──────┘  ├─────────►│ CORRECTIONS_NEEDED   │───► DONE (after fix)
       │                     │          └──────────────────────┘
       │                     │
       │                     └─────────►┌──────────┐
       │                                │ REJECTED │
       │                                └──────────┘
       │                                      ▲
       │     ┌───────────────────────┐        │
       └────►│ REJECTION_SUGGESTED   │────────┘ (reviewer confirms)
             └───────────────────────┘    │
                                          └───► DONE (reviewer overrides suggestion)
```

**Allowed transitions:**

| From | To | Triggered by | Condition |
|------|----|-------------|-----------|
| PENDING | DONE | Contributor fills in description, theme, keywords | All required fields are filled |
| PENDING | REJECTION_SUGGESTED | Contributor suggests rejection | Must provide a reason |
| DONE | APPROVED | Reviewer approves | — |
| DONE | CORRECTIONS_NEEDED | Reviewer requests corrections | Must provide a review comment |
| DONE | REJECTED | Reviewer rejects | Must provide a reason |
| REJECTION_SUGGESTED | REJECTED | Reviewer confirms the rejection | — |
| REJECTION_SUGGESTED | DONE | Reviewer overrides the suggestion and describes the audio themselves | All required fields are filled |
| REJECTION_SUGGESTED | CORRECTIONS_NEEDED | Reviewer disagrees and sends back for the contributor to actually describe it | Must provide a comment |
| CORRECTIONS_NEEDED | DONE | Contributor fixes and resubmits | All required fields are filled |

**Notes:**
- A **REJECTED** audio draft is a dead end — it will not be published. It remains in the task for record-keeping but is excluded from publication.
- A **REJECTION_SUGGESTED** audio draft is not a final state — the reviewer must act on it (confirm rejection, override, or send back).
- When a task is published, only **APPROVED** audio drafts become live content. **REJECTED** audio drafts are excluded.

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
   - Select a theme from the existing list, **or create a new theme** if none fits (the audio draft will be flagged with a "new theme" indicator for the reviewer)
   - Add relevant keywords
   - Mark the audio draft as **DONE**
   - **OR** suggest rejection if the audio is unusable (must provide a reason) → Audio draft status becomes **REJECTION_SUGGESTED**
4. Optionally, suggest rejection for the entire task (with a reason) if the whole session seems unusable
5. Once all audio drafts are processed (all in DONE or REJECTION_SUGGESTED status, none still PENDING):
   - Submit the task for review → Status changes to **READY_FOR_REVIEW**
   - The task appears in the **review queue**

**Unassigning:** If a contributor cannot finish the work, they can unassign themselves. The task goes back to **OPEN** and returns to the backlog. Any work already done on individual audio drafts is **preserved** (audio drafts that were marked DONE remain DONE).

**Reviewer-initiated reassignment:** A Reviewer (or above) can unassign or reassign any IN_PROGRESS task — for example, if a contributor has been inactive or is unavailable.

### 7.3 Reviewing a Task

**Who:** Reviewer, Publisher, or System Admin

**Four-eyes rule:** A Reviewer cannot review a task they contributed to. A Publisher and System Admin are exempt from this rule.

**Steps:**
1. Navigate to the **Review Queue** — list of all READY_FOR_REVIEW tasks
2. Pick a task to review → Assign it to yourself → Status changes to **IN_REVIEW**
3. For each audio draft:
   - Listen to the audio clip
   - Read the description, check the theme and keywords
   - **Check the "new theme" flag** — If a contributor created a new theme, verify it doesn't duplicate an existing one. Accept, rename, or replace with an existing theme as needed.
   - **Approve** → Audio draft status becomes APPROVED
   - **Request corrections** → Audio draft status becomes CORRECTIONS_NEEDED (must leave a comment explaining what to fix)
   - **Reject** → Audio draft status becomes REJECTED (must provide a reason)
   - **Fix directly** → The reviewer can also directly edit the description/theme/keywords and approve it (faster for minor issues)
4. For audio drafts with **REJECTION_SUGGESTED** status:
   - **Confirm rejection** → Audio draft status becomes REJECTED
   - **Override** → The reviewer describes the audio themselves and marks it DONE/APPROVED
   - **Send back** → Audio draft status becomes CORRECTIONS_NEEDED with a comment asking the contributor to actually describe it
5. Check if the contributor suggested rejection for the entire task and decide whether to follow through
6. Once all audio drafts are reviewed (all in APPROVED, CORRECTIONS_NEEDED, or REJECTED):
   - If **all are APPROVED** (or REJECTED) → Approve the task → Task status becomes **APPROVED**
   - If **any need corrections** → Request corrections on the task → Task status becomes **CORRECTIONS_NEEDED** (see [Handling Corrections](#75-handling-corrections))

### 7.4 Publishing a Task

**Who:** Publisher or System Admin

**Steps:**
1. Navigate to the list of **APPROVED** tasks
2. Review the task one final time (optional)
3. Click **Publish** → Task status becomes **PUBLISHED**
4. All **APPROVED** audio drafts within the task are automatically converted into live audio entries on the public platform (with the session author and date inherited from the task)
5. **REJECTED** audio drafts are excluded from publication
6. The task remains **linked** to the published audios for traceability (see [Unpublishing](#77-unpublishing-a-task))

### 7.5 Handling Corrections

When a reviewer requests corrections:

1. Task status becomes **CORRECTIONS_NEEDED**
2. **By default**, the task is re-assigned to the previous contributor (the person who submitted it)
3. **Alternatively**, the reviewer can choose to **unassign the task** instead — it returns to **OPEN** status in the backlog, allowing any contributor to pick it up
4. The contributor (whoever picks it up) sees which audio drafts need corrections and reads the reviewer's comments
5. The contributor fixes the flagged audio drafts and marks them as **DONE** again
6. The contributor resubmits the task → Status changes to **READY_FOR_REVIEW**
7. The task re-enters the review queue (ideally picked up by the same reviewer for continuity, but any qualified reviewer can take it)

### 7.6 Rejecting a Task

Rejection is a **rare, terminal action**. It means the task as a whole is not suitable for publication (e.g., all audio clips are of poor quality, the session is a duplicate).

- The reviewer must provide a **reason** for rejection.
- A rejected task remains in the system for record-keeping but cannot be reactivated.
- If some clips are salvageable, the reviewer should approve those individual audio drafts and reject only the bad ones, rather than rejecting the entire task.
- A contributor can **suggest** task rejection, but the reviewer makes the final decision.

### 7.7 Unpublishing a Task

Unpublishing is an **exceptional operation** reserved for **System Admins only**. It reverts a published task and removes all its audios from the public platform.

**When would this be needed:**
- A serious error was discovered after publication (e.g., wrong author, incorrect content)
- Content needs to be temporarily taken down

**How it works:**
1. System Admin navigates to the published task
2. Clicks **Unpublish** → A strong confirmation dialog appears:
   - Shows how many live audios will be removed from the public platform
   - Requires typing the task description to confirm (prevents accidental unpublishing)
3. Upon confirmation:
   - Task status reverts to **APPROVED**
   - All associated live audios are removed from the public platform
   - The task can then be sent back for corrections, re-reviewed, or re-published

**Why keep the link between tasks and published audios:**
- **Traceability** — Always know where an audio came from (which session, who contributed, who reviewed)
- **Bulk operations** — Unpublishing a task removes all its audios at once, rather than hunting them down one by one
- **Audit trail** — The full history of the content lifecycle is preserved

---

## 8. Business Rules & Constraints

### Role & Permission Rules

| # | Rule |
|---|------|
| R1 | Only **Publishers** and **System Admins** can create tasks |
| R2 | Only **Publishers** and **System Admins** can publish tasks |
| R3 | Only **Publishers** and **System Admins** can hard-delete content (tasks, audio drafts, published audios) |
| R4 | Only **System Admins** can unpublish a task |
| R5 | Any admin can assign themselves a task from the backlog (Contributor and above) |
| R6 | Only **Reviewers** and above can pick tasks from the review queue |
| R7 | Only **Reviewers** and above can reassign or unassign any task |
| R8 | A **Reviewer** cannot review a task they contributed to (four-eyes principle) |
| R9 | **Publishers** and **System Admins** are exempt from rule R8 |

### Task Rules

| # | Rule |
|---|------|
| T1 | A task can only have **one assignee** at a time |
| T2 | A task can only be submitted for review when **all audio drafts are in DONE, REJECTION_SUGGESTED, or REJECTED status** (none still PENDING) |
| T3 | A task can only be approved when **all audio drafts are in APPROVED or REJECTED status** |
| T4 | A task can only be published when its status is **APPROVED** |
| T5 | When a task is sent back for corrections, it is **re-assigned to the previous contributor by default**, but the reviewer can choose to unassign it (back to OPEN in the backlog) |
| T6 | When a contributor unassigns from a task, it returns to **OPEN** and the assignee is cleared |
| T7 | A published task converts only **APPROVED** audio drafts into live content |
| T8 | A task always belongs to a **single recording session** (one author, one date) |
| T9 | A published task remains **linked** to its live audios for traceability and bulk operations |
| T10 | Unpublishing a task removes all its associated live audios from the public platform |

### Audio Draft Rules

| # | Rule |
|---|------|
| A1 | An audio draft can only be marked DONE when **description, theme, and keywords** are all filled |
| A2 | A correction request on an audio draft **must include a comment** explaining what to fix |
| A3 | A rejection of an audio draft **must include a reason** |
| A4 | A suggested rejection by a contributor **must include a reason** |
| A5 | Author and date are **inherited from the task**, not set per audio draft |
| A6 | When a contributor creates a new theme, the audio draft is **flagged with a "new theme" indicator** visible to the reviewer |
| A7 | The reviewer must validate, rename, or replace any new theme before approving the audio draft |

---

## 9. Activity Log

Every significant action on a task is recorded in an **activity log** to ensure full traceability. Each log entry contains:

| Field | Description |
|-------|-------------|
| **Timestamp** | When the action occurred |
| **Actor** | Which admin performed the action |
| **Action** | What was done (e.g., "assigned task", "approved audio draft #3", "requested corrections") |
| **Details** | Additional context (e.g., review comment, rejection reason, suggested rejection reason) |

**Logged actions include:**
- Task created
- Task assigned / unassigned / reassigned
- Task submitted for review
- Task approved / corrections requested / rejected
- Task published / unpublished
- Audio draft marked as done
- Audio draft rejection suggested (by contributor)
- Audio draft approved / corrections requested / rejected
- Audio draft edited (during review)
- New theme created / validated / replaced / renamed

---

## 10. User Experience & Interface Requirements

Beyond the core workflow, the admin interface must provide a smooth, efficient, and user-friendly experience for day-to-day content work.

### 10.1 Task Lists & Navigation

The admin dashboard should provide clear, filterable views:

- **Task Backlog** — All OPEN tasks, sorted by creation date (oldest first by default)
- **My Tasks** — Tasks assigned to the current user (IN_PROGRESS, CORRECTIONS_NEEDED)
- **Review Queue** — All READY_FOR_REVIEW tasks, sorted by submission date (oldest first)
- **My Reviews** — Tasks the current user is currently reviewing (IN_REVIEW)
- **Approved Tasks** — Tasks awaiting publication
- **All Tasks** — Full list with filters for any admin to get an overview

### 10.2 Filtering & Sorting

All task lists should support:

| Filter | Options |
|--------|---------|
| **Status** | Any combination of statuses |
| **Author** | Filter by session author |
| **Assignee** | Filter by assigned admin |
| **Creator** | Filter by task creator |
| **Date range** | Filter by session date or creation date |
| **Has new themes** | Show only tasks containing audio drafts with new themes |
| **Has suggested rejections** | Show only tasks with contributor rejection suggestions |

Sorting options: by date (creation, session, last update), by number of audio drafts, by progress (% done).

### 10.3 Task Detail View

When opening a task, the admin should see:

- **Task header** — Description, author, date, status, assignee, content state progress bar
- **Audio draft list** — All audio drafts with their status, description preview, and action buttons
- **Status indicators** — Clear visual distinction between PENDING, DONE, APPROVED, CORRECTIONS_NEEDED, REJECTION_SUGGESTED, and REJECTED audio drafts
- **New theme badges** — Audio drafts with new themes should have a visible badge/tag
- **Review comments** — Inline display of reviewer feedback on each audio draft
- **Rejection suggestions** — Clearly visible contributor suggestions with their reasons
- **Activity log** — Expandable history of all actions on this task

### 10.4 Audio Draft Work View

When a contributor works on an audio draft:

- **Audio player** — Embedded player to listen to the clip without leaving the page
- **Description field** — Text area for the French summary
- **Theme selector** — Dropdown of existing themes with an option to "Add new theme"
- **Keywords field** — Text input for search terms
- **Quick actions** — "Mark as Done" and "Suggest Rejection" buttons
- **Progress indicator** — Show how many audio drafts are done vs. remaining in the task

### 10.5 Review Interface

When a reviewer reviews an audio draft:

- **Side-by-side view** — Audio player on one side, contributor's work on the other
- **New theme highlight** — Any new themes should be prominently highlighted with options to accept, rename, or replace
- **Suggested rejections** — Clearly flagged with the contributor's reason, with quick actions to confirm or override
- **Inline editing** — Ability to directly fix descriptions/themes/keywords for minor corrections
- **Comment field** — For leaving feedback when requesting corrections
- **Batch actions** — "Approve all remaining" for efficient processing when most drafts are good

### 10.6 General UX Principles

- **Clear ownership** — At a glance, it should be obvious who is working on what. Use assignee avatars/names prominently.
- **Progress visibility** — Show task progress (e.g., "8/12 audio drafts done") in list views.
- **Real-time updates** — If another admin changes a task's status or assignee, the interface should reflect this promptly (e.g., via polling or WebSocket).
- **Responsive design** — The admin interface should work well on desktop and tablet.
- **Confirmation dialogs** — For destructive actions (reject, delete, unpublish), always require explicit confirmation.
- **Notifications** — Admins should be notified when a task assigned to them changes status (e.g., corrections requested, task approved).

---

## 11. Impact on Existing Features

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

### Published Audio — Task Link

Published audios created through the task workflow maintain a **reference back to their source task**. This link:
- Is **read-only** in normal operations — it doesn't affect how audios behave on the public platform.
- Enables **bulk unpublishing** — A System Admin can unpublish an entire task at once.
- Provides **traceability** — Any published audio can be traced back to its task, contributor, and reviewer.

Audios created through the direct upload path (not via tasks) do not have a task reference and are unaffected by this feature.

### Existing Public Features

The public-facing features (browsing, searching, listening, downloading, sharing) are **not affected**. Published audio entries appear exactly the same to end users regardless of whether they were created directly or through the task workflow.

---

*This document defines the functional aspects of the collaborative task workflow. For implementation details, see [Task Feature — Technical Documentation](./TASK_FEATURE_TECHNICAL.md).*
