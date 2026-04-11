# Task Feature — Technical Documentation

> **Reference**: [Functional Documentation](./FUNCTIONAL.md)
>
> This document provides all the technical details needed to implement the collaborative task workflow feature. It covers the target architecture, data models, API design, backend and frontend changes, infrastructure updates, and a migration strategy from the current codebase.

---

## Table of Contents

1. [Current Architecture Analysis & Issues](#1-current-architecture-analysis--issues)
2. [Target Architecture](#2-target-architecture)
3. [Backend Refactoring](#3-backend-refactoring)
4. [Data Models & Database Design](#4-data-models--database-design)
5. [API Design](#5-api-design)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [Business Logic & Services](#7-business-logic--services)
8. [Frontend Architecture](#8-frontend-architecture)
9. [Infrastructure Changes](#9-infrastructure-changes)
10. [Migration Strategy](#10-migration-strategy)
11. [Environment Variables](#11-environment-variables)
12. [Error Handling Strategy](#12-error-handling-strategy)
13. [Testing Strategy](#13-testing-strategy)
14. [Implementation Phases](#14-implementation-phases)

---

## 1. Current Architecture Analysis & Issues

### 1.1 Current Backend Structure

```
backend/api/src/
├── config/
│   └── server.config.ts          # All constants in one file
├── controller/
│   ├── admin.controller.ts        # Admin CRUD + login (343 lines)
│   ├── audio.controller.ts        # Audio CRUD + file ops (310 lines)
│   └── utils/
│       ├── common.ts              # Error types
│       ├── verify-token.ts        # JWT middleware
│       ├── admin/
│       │   └── admin-request-validator.ts
│       └── audio/
│           ├── audio-file-handler.ts
│           ├── audio-request-validator.ts
│           └── s3-audio-file-uploader.ts
├── model/
│   ├── admin.model.ts             # Admin class + DB operations (280 lines)
│   ├── audio.model.ts             # Audio class + DB operations (297 lines)
│   ├── user.model.ts
│   ├── analytic.model.ts
│   ├── db-connection.ts           # Mongoose connection
│   ├── db-crud.ts                 # Generic CRUD helper
│   └── schema/
│       ├── admin.schema.ts
│       ├── audio.schema.ts
│       ├── user.schema.ts
│       └── analytic.schema.ts
├── routes/
│   ├── admin.router.ts
│   ├── audio.router.ts
│   ├── user.router.ts
│   └── analytic.router.ts
└── server.ts                      # Express entry point
```

### 1.2 Identified Issues & Refactoring Needs

| # | Issue | Location | Impact | Recommendation |
|---|-------|----------|--------|----------------|
| 1 | **No layered architecture** — Models contain both data representation AND database operations. Controllers handle validation, business logic, and response formatting all in one place. | `*.model.ts`, `*.controller.ts` | Hard to test, hard to extend | Introduce **Service layer** between controllers and models |
| 2 | **Authorization mixed into routes** — `isSuperAdmin` checks are inline in router files and controller methods with inconsistent patterns | `admin.router.ts:18`, `admin.controller.ts:178` | Not scalable for 4 roles | Extract to dedicated **RBAC middleware** |
| 3 | **Binary role system** — Only `isSuperAdmin: boolean` exists. No support for granular roles. | `admin.schema.ts:36-40`, `verify-token.ts:17-20` | Blocks the entire task feature | Replace with `role: enum` field |
| 4 | **JWT payload too limited** — Only carries `{id, isSuperAdmin}` | `verify-token.ts:17-20` | Cannot carry role info | Extend to `{id, role}` |
| 5 | **`connectToDB()` called on every DB operation** — Each CRUD method calls `connectToDB()` | `db-crud.ts` (every method) | Redundant overhead, connection should be established once at startup | Connect once at server startup |
| 6 | **Validation inconsistency** — Audio validators use manual checks, Admin validators use Joi. Two different patterns. | `audio-request-validator.ts` vs `admin-request-validator.ts` | Inconsistent, harder to maintain | Standardize on **one validation library** (Zod recommended) |
| 7 | **Class-based models with manual mapping** — Audio/Admin classes manually map to/from Mongoose documents with verbose boilerplate | `audio.model.ts`, `admin.model.ts` | Lots of repetitive code | Use Mongoose directly with lean queries + type interfaces |
| 8 | **Error handling not centralized** — Every controller method has its own try/catch with duplicated error formatting | All controllers | Inconsistent error responses | Add **global error handler middleware** + custom error classes |
| 9 | **No request logging** — No middleware for request/response logging | `server.ts` | Hard to debug in production | Add structured logging (e.g., `pino` or `winston`) |
| 10 | **`body-parser` is deprecated** — Using separate `body-parser` package | `server.ts:2`, `package.json:21` | Unnecessary dependency | Use `express.json()` built-in |
| 11 | **Root admin hardcoded in env** — Special root admin constructed from env vars with a hardcoded `_id` | `admin.model.ts:266-279` | Fragile, not standard | Seed root admin via a migration/seed script instead |
| 12 | **Frontend uses class components** — React class components (`React.Component`) throughout | All frontend components | Outdated pattern, harder to reuse logic | Migrate to **functional components + hooks** |
| 13 | **Frontend state passed via route state** — Auth info (`adminLoginInfos`) passed through React Router's `location.state` | `app-provider.component.tsx`, `audio-creator.component.tsx` | Fragile, lost on refresh | Use **React Context** or state management for auth |
| 14 | **No API versioning** — Routes are directly under `/audios`, `/admins` | `server.ts:47-50` | Breaking changes affect all clients | Add `/api/v1/` prefix |
| 15 | **`strictNullChecks: false`** — TypeScript null safety disabled | Both `tsconfig.json` files | Potential runtime null errors | Enable `strictNullChecks: true` |
| 16 | **`moment.js` used everywhere** — Heavy library, maintenance-mode | Backend + Frontend | Bundle size, no new features | Replace with `date-fns` or native `Intl` |
| 17 | **`@hapi/joi` for validation** — Older, heavier validation library | `admin-request-validator.ts` | Less TypeScript-friendly | Replace with `zod` for better TS integration |
| 18 | **`deleteAdmin` logic is inverted** — Deletes when admin is NOT found, returns 404 when found | `admin.controller.ts:139-162` | Bug | Fix the logic inversion |

---

## 2. Target Architecture

### 2.1 Backend — Layered Architecture

```
backend/api/src/
├── config/
│   ├── server.config.ts           # Server, pagination, file size constants
│   ├── database.config.ts         # DB connection config
│   └── s3.config.ts               # S3 client config
│
├── middleware/
│   ├── auth.middleware.ts          # JWT verification
│   ├── rbac.middleware.ts          # Role-based access control
│   ├── error-handler.middleware.ts # Global error handler
│   ├── request-logger.middleware.ts# Request/response logging
│   └── validate.middleware.ts      # Generic Zod validation middleware
│
├── routes/
│   └── v1/
│       ├── index.ts               # Aggregates all v1 routes
│       ├── audio.routes.ts
│       ├── admin.routes.ts
│       ├── user.routes.ts
│       ├── task.routes.ts          # NEW
│       ├── theme.routes.ts         # NEW
│       └── analytic.routes.ts
│
├── controllers/
│   ├── audio.controller.ts        # Thin — delegates to service
│   ├── admin.controller.ts
│   ├── task.controller.ts         # NEW
│   ├── theme.controller.ts        # NEW
│   └── analytic.controller.ts
│
├── services/                       # NEW — Business logic layer
│   ├── audio.service.ts
│   ├── admin.service.ts
│   ├── task.service.ts            # NEW — Task workflow engine
│   ├── theme.service.ts           # NEW — Theme management
│   ├── auth.service.ts            # NEW — Login, token creation
│   └── storage.service.ts         # NEW — S3 abstraction
│
├── repositories/                   # NEW — Data access layer
│   ├── base.repository.ts         # Generic CRUD (replaces db-crud.ts)
│   ├── audio.repository.ts
│   ├── admin.repository.ts
│   ├── task.repository.ts         # NEW
│   ├── audio-draft.repository.ts  # NEW
│   ├── theme.repository.ts        # NEW
│   └── activity-log.repository.ts # NEW
│
├── models/                         # Mongoose schemas + TS interfaces
│   ├── audio.model.ts
│   ├── admin.model.ts             # Updated: role field
│   ├── task.model.ts              # NEW
│   ├── audio-draft.model.ts       # NEW
│   ├── theme.model.ts             # NEW
│   ├── activity-log.model.ts      # NEW
│   └── user.model.ts
│
├── validators/                     # NEW — Zod schemas
│   ├── audio.validator.ts
│   ├── admin.validator.ts
│   ├── task.validator.ts          # NEW
│   ├── theme.validator.ts         # NEW
│   └── common.validator.ts
│
├── errors/                         # NEW — Custom error classes
│   ├── app-error.ts
│   ├── not-found.error.ts
│   ├── validation.error.ts
│   ├── authorization.error.ts
│   └── conflict.error.ts
│
├── types/                          # NEW — Shared TypeScript types
│   ├── enums.ts                   # TaskStatus, AudioDraftStatus, AdminRole
│   ├── request.types.ts           # Extended Request types
│   └── response.types.ts          # Standardized API responses
│
├── utils/
│   └── helpers.ts                 # Pure utility functions
│
└── server.ts                      # Express setup + middleware chain
```

### 2.2 Data Flow

```
Request
  → Request Logger Middleware
  → Auth Middleware (JWT verify, attach user to req)
  → RBAC Middleware (check role permissions)
  → Validation Middleware (Zod schema)
  → Controller (parse req, call service, format response)
  → Service (business logic, orchestration, call repositories)
  → Repository (data access, Mongoose queries)
  → MongoDB

Error at any layer
  → Global Error Handler Middleware
  → Standardized error response
```

### 2.3 Frontend — Target Structure

```
frontend/samwaktou-react-app/src/
├── main.tsx                        # Entry point with RouterProvider
├── App.tsx                         # NEW — Root layout with auth context
│
├── api/                            # NEW — API client layer
│   ├── client.ts                  # Axios/fetch wrapper with interceptors
│   ├── audio.api.ts
│   ├── admin.api.ts
│   ├── task.api.ts                # NEW
│   └── theme.api.ts               # NEW
│
├── contexts/                       # NEW — React Context providers
│   ├── AuthContext.tsx             # Auth state, login/logout, token refresh
│   └── NotificationContext.tsx    # Toast/snackbar notifications
│
├── hooks/                          # NEW — Custom hooks
│   ├── useAuth.ts
│   ├── useTasks.ts
│   ├── useAudioDrafts.ts
│   └── usePagination.ts
│
├── pages/                          # NEW — Page-level components
│   ├── public/
│   │   ├── HomePage.tsx
│   │   └── AudioLinkPage.tsx
│   ├── auth/
│   │   └── LoginPage.tsx
│   └── admin/
│       ├── DashboardPage.tsx      # NEW — Admin landing
│       ├── TaskListPage.tsx       # NEW — Backlog, my tasks, review queue
│       ├── TaskDetailPage.tsx     # NEW — Task view + audio draft list
│       ├── AudioDraftWorkPage.tsx # NEW — Edit audio draft metadata
│       ├── TaskCreatePage.tsx     # NEW — Create task with file upload
│       ├── AudioCreatePage.tsx    # Existing audio creation (direct path)
│       ├── ThemeManagementPage.tsx # NEW
│       └── AdminManagementPage.tsx
│
├── components/                     # NEW — Reusable UI components
│   ├── layout/
│   │   ├── AdminLayout.tsx        # Sidebar + topbar + content area
│   │   ├── Sidebar.tsx
│   │   └── TopBar.tsx
│   ├── task/
│   │   ├── TaskCard.tsx
│   │   ├── TaskStatusBadge.tsx
│   │   ├── TaskProgressBar.tsx
│   │   └── TaskFilters.tsx
│   ├── audio-draft/
│   │   ├── AudioDraftCard.tsx
│   │   ├── AudioDraftForm.tsx
│   │   ├── AudioDraftStatusBadge.tsx
│   │   └── NewThemeBadge.tsx
│   ├── common/
│   │   ├── DataTable.tsx
│   │   ├── SearchBar.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── EmptyState.tsx
│   └── audio/                     # Existing refactored
│       ├── AudioCard.tsx
│       └── AudioPlayer.tsx
│
├── types/                          # Shared TS types (mirrors backend enums)
│   ├── task.types.ts
│   ├── admin.types.ts
│   ├── audio.types.ts
│   └── api.types.ts
│
├── utils/
│   ├── date.utils.ts              # date-fns helpers
│   └── format.utils.ts
│
└── styles/                         # Global styles / theme
    └── theme.ts                   # MUI theme customization
```

---

## 3. Backend Refactoring

### 3.1 Replace `body-parser` with Built-in Express

**Current** (`server.ts:18`):
```typescript
import bodyParser from 'body-parser';
server.use(bodyParser.json());
```

**Target**:
```typescript
server.use(express.json());
```

Remove `body-parser` from `package.json`.

### 3.2 Database Connection — Connect Once at Startup

**Current** (`db-crud.ts`): `connectToDB()` is called before every single DB operation.

**Target**: Connect once when the server starts, fail fast if connection fails.

```typescript
// src/config/database.config.ts
import mongoose from 'mongoose';

export const connectToDatabase = async (): Promise<void> => {
  await mongoose.connect(process.env.DB_CONNECTION!, {
    authSource: 'admin',
    user: process.env.MONGODB_USERNAME,
    pass: process.env.MONGODB_PASSWORD,
    dbName: process.env.MONGODB_DB_NAME,
  });
  console.log('Connected to MongoDB');
};
```

```typescript
// src/server.ts
import { connectToDatabase } from './config/database.config';

const startServer = async () => {
  await connectToDatabase();
  // ... middleware setup ...
  server.listen(SERVEUR_CONFIG.PORT);
};

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
```

### 3.3 Repository Pattern — Replace `db-crud.ts`

**Current**: A global `DB` object with generic methods that call `connectToDB()` on every operation. Models (e.g., `Audio`) directly call `DB.postToDB()`, `DB.findOne()`, etc.

**Target**: A `BaseRepository<T>` class that each entity repository extends. No more per-call `connectToDB()`.

```typescript
// src/repositories/base.repository.ts
import { Model, FilterQuery, UpdateQuery, ProjectionType, QueryOptions } from 'mongoose';

export class BaseRepository<T> {
  constructor(protected model: Model<T>) {}

  async create(data: Partial<T>): Promise<T> {
    const doc = new this.model(data);
    return doc.save();
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findById(id).lean().exec();
  }

  async findOne(filter: FilterQuery<T>): Promise<T | null> {
    return this.model.findOne(filter).lean().exec();
  }

  async findMany(
    filter: FilterQuery<T>,
    projection?: ProjectionType<T>,
    options?: QueryOptions
  ): Promise<T[]> {
    return this.model.find(filter, projection, options).lean().exec();
  }

  async updateById(id: string, update: UpdateQuery<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, update, { new: true }).lean().exec();
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.model.deleteOne({ _id: id } as FilterQuery<T>);
    return result.deletedCount > 0;
  }

  async distinct(field: string): Promise<unknown[]> {
    return this.model.distinct(field).exec();
  }

  async countDocuments(filter: FilterQuery<T>): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }
}
```

### 3.4 Service Layer

Each service encapsulates business logic and orchestrates repository calls.

```typescript
// src/services/audio.service.ts
import { AudioRepository } from '../repositories/audio.repository';
import { StorageService } from './storage.service';
import { NotFoundError } from '../errors/not-found.error';

export class AudioService {
  constructor(
    private audioRepo: AudioRepository,
    private storageService: StorageService
  ) {}

  async createAudio(data: CreateAudioDto, file: UploadedFile): Promise<IAudio> {
    const audio = await this.audioRepo.create(data);
    try {
      const uri = await this.storageService.uploadFile(file, audio._id);
      return this.audioRepo.updateById(audio._id, { uri });
    } catch (err) {
      await this.audioRepo.deleteById(audio._id);
      throw err;
    }
  }

  async deleteAudio(id: string): Promise<void> {
    const audio = await this.audioRepo.findById(id);
    if (!audio) throw new NotFoundError('Audio not found');
    await this.audioRepo.deleteById(id);
    await this.storageService.deleteFile(audio.uri);
  }
  // ...
}
```

### 3.5 Centralized Error Handling

```typescript
// src/errors/app-error.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public reason?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation error', details?: unknown) {
    super(message, 400, 'Validation failed', details);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409);
  }
}
```

```typescript
// src/middleware/error-handler.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-error';

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      reason: err.reason,
      details: err.details,
    });
    return;
  }

  // Unexpected errors
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
};
```

### 3.6 Validation with Zod

Replace both the manual validators (`audio-request-validator.ts`) and Joi-based validators (`admin-request-validator.ts`) with Zod.

```typescript
// src/validators/audio.validator.ts
import { z } from 'zod';

export const createAudioSchema = z.object({
  theme: z.string().min(2).max(30),
  author: z.string().min(1).max(30).optional().default('Inconnu'),
  description: z.string().min(10).max(500),
  keywords: z.string().min(10).max(500),
  date: z.string().regex(/^\d{2}-\d{2}-\d{4}$/).optional(),
});

export type CreateAudioDto = z.infer<typeof createAudioSchema>;
```

```typescript
// src/middleware/validate.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ValidationError } from '../errors/app-error';

export const validate = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      throw new ValidationError('Invalid request data', result.error.flatten());
    }
    req[source] = result.data; // Replace with parsed/transformed data
    next();
  };
};
```

### 3.7 API Versioning

```typescript
// src/routes/v1/index.ts
import { Router } from 'express';
import audioRoutes from './audio.routes';
import adminRoutes from './admin.routes';
import taskRoutes from './task.routes';
import themeRoutes from './theme.routes';
import analyticRoutes from './analytic.routes';

const v1Router = Router();
v1Router.use('/audios', audioRoutes);
v1Router.use('/admins', adminRoutes);
v1Router.use('/tasks', taskRoutes);
v1Router.use('/themes', themeRoutes);
v1Router.use('/analytics', analyticRoutes);

export default v1Router;
```

```typescript
// src/server.ts
import v1Router from './routes/v1';
// ...
server.use('/api/v1', v1Router);

// Backward compatibility (temporary, remove after frontend migration)
server.use('/audios', audioRoutes);
server.use('/admins', adminRoutes);
```

---

## 4. Data Models & Database Design

### 4.1 Enums

```typescript
// src/types/enums.ts

export enum AdminRole {
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',     // Level 0 — Full system access
  PUBLISHER = 'PUBLISHER',           // Level 1 — Can publish, hard-delete
  REVIEWER = 'REVIEWER',             // Level 2 — Can review, approve, reject
  CONTRIBUTOR = 'CONTRIBUTOR',       // Level 3 — Can work on tasks
}

// Role hierarchy for permission checks
export const ROLE_HIERARCHY: Record<AdminRole, number> = {
  [AdminRole.SYSTEM_ADMIN]: 0,
  [AdminRole.PUBLISHER]: 1,
  [AdminRole.REVIEWER]: 2,
  [AdminRole.CONTRIBUTOR]: 3,
};

export enum TaskStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  READY_FOR_REVIEW = 'READY_FOR_REVIEW',
  IN_REVIEW = 'IN_REVIEW',
  CORRECTIONS_NEEDED = 'CORRECTIONS_NEEDED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PUBLISHED = 'PUBLISHED',
}

export enum AudioDraftStatus {
  PENDING = 'PENDING',
  DONE = 'DONE',
  REJECTION_SUGGESTED = 'REJECTION_SUGGESTED',
  APPROVED = 'APPROVED',
  CORRECTIONS_NEEDED = 'CORRECTIONS_NEEDED',
  REJECTED = 'REJECTED',
}
```

### 4.2 Admin Model (Updated)

**Current schema** has `isSuperAdmin: boolean`. This must be replaced with `role: AdminRole`.

```typescript
// src/models/admin.model.ts
import mongoose, { Schema, Document } from 'mongoose';
import { AdminRole } from '../types/enums';

export interface IAdmin extends Document {
  surname: string;
  name: string;
  email: string;
  password: string;
  role: AdminRole;
  isActive: boolean;        // NEW — soft disable accounts
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema = new Schema<IAdmin>(
  {
    surname: { type: String, required: true, trim: true, maxlength: 255 },
    name: { type: String, required: true, trim: true, maxlength: 255 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: Object.values(AdminRole),
      required: true,
      default: AdminRole.CONTRIBUTOR,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }  // auto createdAt, updatedAt
);

AdminSchema.index({ email: 1 }, { unique: true });
AdminSchema.index({ role: 1 });

export default mongoose.model<IAdmin>('Admin', AdminSchema);
```

**Migration note**: Existing admins with `isSuperAdmin: true` → `role: SYSTEM_ADMIN`. Others → `role: CONTRIBUTOR` (or `PUBLISHER` depending on their actual function). See [Section 10](#10-migration-strategy).

### 4.3 Task Model (NEW)

```typescript
// src/models/task.model.ts
import mongoose, { Schema, Document, Types } from 'mongoose';
import { TaskStatus } from '../types/enums';

export interface IContentState {
  total: number;
  done: number;
  approved: number;
  rejected: number;
  correctionNeeded: number;
  pending: number;
}

export interface ITask extends Document {
  description: string;                    // Task-level description
  sessionAuthor: string;                  // The scholar/author of the original session
  sessionDate: Date;                      // Date of the original recording session
  status: TaskStatus;
  assignee: Types.ObjectId | null;        // Current worker (contributor or reviewer)
  previousAssignee: Types.ObjectId | null;// Last contributor who worked on it
  createdBy: Types.ObjectId;              // Admin who created the task (Publisher+)
  reviewedBy: Types.ObjectId | null;      // Reviewer who last reviewed
  contentState: IContentState;            // Denormalized counts
  rejectionReason: string | null;         // If task-level rejection
  taskRejectionSuggested: boolean;        // Contributor suggested task rejection
  taskRejectionSuggestedReason: string | null;
  publishedAudioIds: Types.ObjectId[];    // Links to published Audio docs (after publish)
  createdAt: Date;
  updatedAt: Date;
}

const ContentStateSchema = new Schema<IContentState>(
  {
    total: { type: Number, default: 0 },
    done: { type: Number, default: 0 },
    approved: { type: Number, default: 0 },
    rejected: { type: Number, default: 0 },
    correctionNeeded: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
  },
  { _id: false }
);

const TaskSchema = new Schema<ITask>(
  {
    description: { type: String, required: true, maxlength: 1000 },
    sessionAuthor: { type: String, required: true, trim: true },
    sessionDate: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.OPEN,
    },
    assignee: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
    previousAssignee: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
    contentState: { type: ContentStateSchema, default: () => ({}) },
    rejectionReason: { type: String, default: null },
    taskRejectionSuggested: { type: Boolean, default: false },
    taskRejectionSuggestedReason: { type: String, default: null },
    publishedAudioIds: [{ type: Schema.Types.ObjectId, ref: 'Audio' }],
  },
  { timestamps: true }
);

// Indexes for common query patterns
TaskSchema.index({ status: 1 });
TaskSchema.index({ assignee: 1 });
TaskSchema.index({ createdBy: 1 });
TaskSchema.index({ status: 1, assignee: 1 });
TaskSchema.index({ sessionAuthor: 1 });
TaskSchema.index({ sessionDate: -1 });

export default mongoose.model<ITask>('Task', TaskSchema);
```

### 4.4 AudioDraft Model (NEW)

```typescript
// src/models/audio-draft.model.ts
import mongoose, { Schema, Document, Types } from 'mongoose';
import { AudioDraftStatus } from '../types/enums';

export interface IAudioDraft extends Document {
  task: Types.ObjectId;                   // Parent task reference
  uri: string;                            // S3 key for the audio file
  originalFileName: string;               // Original file name for display
  description: string;                    // French translation/summary
  theme: string;
  keywords: string;
  status: AudioDraftStatus;
  isNewTheme: boolean;                    // Flagged if contributor added a new theme
  rejectionSuggestedReason: string | null;// Contributor's suggestion reason
  reviewComment: string | null;           // Reviewer's feedback
  correctionComment: string | null;       // Reason for CORRECTIONS_NEEDED
  order: number;                          // Display order within the task
  createdAt: Date;
  updatedAt: Date;
}

const AudioDraftSchema = new Schema<IAudioDraft>(
  {
    task: { type: Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    uri: { type: String, required: true },
    originalFileName: { type: String, required: true },
    description: { type: String, default: '', maxlength: 500 },
    theme: { type: String, default: '', maxlength: 30 },
    keywords: { type: String, default: '', maxlength: 500 },
    status: {
      type: String,
      enum: Object.values(AudioDraftStatus),
      default: AudioDraftStatus.PENDING,
    },
    isNewTheme: { type: Boolean, default: false },
    rejectionSuggestedReason: { type: String, default: null },
    reviewComment: { type: String, default: null },
    correctionComment: { type: String, default: null },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

AudioDraftSchema.index({ task: 1, order: 1 });
AudioDraftSchema.index({ task: 1, status: 1 });

export default mongoose.model<IAudioDraft>('AudioDraft', AudioDraftSchema);
```

### 4.5 Theme Model (NEW)

Currently themes are just strings stored on Audio documents. For the new workflow, themes need to be a managed entity with validation status.

```typescript
// src/models/theme.model.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITheme extends Document {
  name: string;                          // Theme name (uppercase, trimmed)
  isValidated: boolean;                  // false = pending review
  createdBy: Types.ObjectId;             // Admin who created/suggested it
  validatedBy: Types.ObjectId | null;    // Reviewer who validated
  createdAt: Date;
  updatedAt: Date;
}

const ThemeSchema = new Schema<ITheme>(
  {
    name: { type: String, required: true, unique: true, uppercase: true, trim: true },
    isValidated: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
    validatedBy: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
  },
  { timestamps: true }
);

ThemeSchema.index({ name: 1 }, { unique: true });
ThemeSchema.index({ isValidated: 1 });

export default mongoose.model<ITheme>('Theme', ThemeSchema);
```

**Migration note**: Extract distinct themes from existing Audio documents and seed the `themes` collection with `isValidated: true`.

### 4.6 Activity Log Model (NEW)

```typescript
// src/models/activity-log.model.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IActivityLog extends Document {
  entityType: 'task' | 'audio_draft' | 'theme';
  entityId: Types.ObjectId;
  action: string;                        // e.g., 'STATUS_CHANGED', 'ASSIGNED', 'COMMENT_ADDED'
  performedBy: Types.ObjectId;
  details: Record<string, unknown>;      // Flexible payload (old/new status, comment, etc.)
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    entityType: { type: String, required: true, enum: ['task', 'audio_draft', 'theme'] },
    entityId: { type: Schema.Types.ObjectId, required: true },
    action: { type: String, required: true },
    performedBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
    details: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ActivityLogSchema.index({ entityType: 1, entityId: 1 });
ActivityLogSchema.index({ performedBy: 1 });
ActivityLogSchema.index({ createdAt: -1 });

export default mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
```

### 4.7 Audio Model (Updated)

Add an optional `taskId` reference field to link published audio back to its source task:

```typescript
// Add to existing AudioSchema:
taskId: { type: Schema.Types.ObjectId, ref: 'Task', default: null, index: true },
```

### 4.8 Entity-Relationship Diagram

```
┌──────────┐     1:N      ┌──────────────┐
│   Admin   │──────────────│     Task     │ (createdBy, assignee, previousAssignee, reviewedBy)
└──────────┘              └──────┬───────┘
                                 │ 1:N
                                 ▼
                          ┌──────────────┐
                          │  AudioDraft  │
                          └──────┬───────┘
                                 │ (theme ref)
                                 ▼
                          ┌──────────────┐
                          │    Theme     │
                          └──────────────┘

┌──────────────┐   published    ┌──────────┐
│     Task     │───────────────▶│  Audio   │ (publishedAudioIds / audio.taskId)
└──────────────┘                └──────────┘

┌──────────────┐
│ ActivityLog  │ (references Task, AudioDraft, or Theme by entityId)
└──────────────┘
```

### 4.9 MongoDB Indexes Summary

| Collection | Index | Purpose |
|------------|-------|---------|
| `admins` | `{ email: 1 }` unique | Login lookup |
| `admins` | `{ role: 1 }` | Filter by role |
| `tasks` | `{ status: 1 }` | Task list views |
| `tasks` | `{ assignee: 1 }` | "My Tasks" view |
| `tasks` | `{ status: 1, assignee: 1 }` | Backlog (OPEN + null assignee) |
| `tasks` | `{ sessionAuthor: 1 }` | Filter by session author |
| `tasks` | `{ sessionDate: -1 }` | Sort by session date |
| `audiodrafts` | `{ task: 1, order: 1 }` | Ordered list within a task |
| `audiodrafts` | `{ task: 1, status: 1 }` | Count by status per task |
| `themes` | `{ name: 1 }` unique | Unique theme names |
| `themes` | `{ isValidated: 1 }` | Filter unvalidated themes |
| `activitylogs` | `{ entityType: 1, entityId: 1 }` | Activity for an entity |
| `activitylogs` | `{ createdAt: -1 }` | Recent activity |
| `audios` | `{ taskId: 1 }` | Find audios from a task |

---

## 5. API Design

### 5.1 Base URL & Response Format

**Base URL**: `/api/v1`

**Standard success response**:
```json
{
  "success": true,
  "data": { ... }
}
```

**Standard paginated response**:
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "total": 142,
    "skip": 0,
    "limit": 20,
    "hasMore": true
  }
}
```

**Standard error response**:
```json
{
  "success": false,
  "message": "Human-readable message",
  "reason": "Machine-readable error code",
  "details": { ... }
}
```

### 5.2 Task Endpoints

| Method | Path | Auth | Min Role | Description |
|--------|------|------|----------|-------------|
| `POST` | `/tasks` | ✅ | Publisher | Create a task (upload audio files) |
| `GET` | `/tasks` | ✅ | Contributor | List tasks (with filters) |
| `GET` | `/tasks/:taskId` | ✅ | Contributor | Get task details |
| `PATCH` | `/tasks/:taskId/assign` | ✅ | Contributor | Self-assign a task from backlog |
| `PATCH` | `/tasks/:taskId/unassign` | ✅ | Reviewer | Unassign a task (back to OPEN) |
| `PATCH` | `/tasks/:taskId/reassign` | ✅ | Reviewer | Reassign a task to a different admin |
| `PATCH` | `/tasks/:taskId/submit` | ✅ | Contributor | Submit task for review (→ READY_FOR_REVIEW) |
| `PATCH` | `/tasks/:taskId/pick-for-review` | ✅ | Reviewer | Pick task from review queue (→ IN_REVIEW) |
| `PATCH` | `/tasks/:taskId/approve` | ✅ | Reviewer | Approve task (→ APPROVED) |
| `PATCH` | `/tasks/:taskId/request-corrections` | ✅ | Reviewer | Send back for corrections (→ CORRECTIONS_NEEDED) |
| `PATCH` | `/tasks/:taskId/reject` | ✅ | Reviewer | Reject task (→ REJECTED) |
| `PATCH` | `/tasks/:taskId/suggest-rejection` | ✅ | Contributor | Suggest task rejection |
| `POST` | `/tasks/:taskId/publish` | ✅ | Publisher | Publish task (→ PUBLISHED, creates Audio docs) |
| `POST` | `/tasks/:taskId/unpublish` | ✅ | System Admin | Unpublish (removes published audios, → APPROVED) |
| `DELETE` | `/tasks/:taskId` | ✅ | Publisher | Hard-delete task and its audio drafts |
| `GET` | `/tasks/:taskId/activity-log` | ✅ | Contributor | Get activity log for a task |

**Query parameters for `GET /tasks`**:
```
?status=OPEN,IN_PROGRESS    # Comma-separated statuses
&assignee=<adminId>          # Filter by assignee
&createdBy=<adminId>         # Filter by creator
&sessionAuthor=<name>        # Filter by session author
&minDate=2024-01-01           # Session date range
&maxDate=2024-12-31
&hasNewThemes=true            # Only tasks with new themes
&hasSuggestedRejections=true  # Only tasks with rejection suggestions
&sort=sessionDate             # Sort field
&order=desc                   # Sort direction
&skip=0&limit=20              # Pagination
```

**Shortcut views** (thin wrappers over `GET /tasks`):
- `GET /tasks?status=OPEN&assignee=null` → **Backlog**
- `GET /tasks?assignee=<currentUser>` → **My Tasks**
- `GET /tasks?status=READY_FOR_REVIEW` → **Review Queue**
- `GET /tasks?status=APPROVED` → **Approved** (ready to publish)

### 5.3 AudioDraft Endpoints

| Method | Path | Auth | Min Role | Description |
|--------|------|------|----------|-------------|
| `GET` | `/tasks/:taskId/audio-drafts` | ✅ | Contributor | List audio drafts for a task |
| `GET` | `/tasks/:taskId/audio-drafts/:draftId` | ✅ | Contributor | Get single audio draft |
| `PATCH` | `/tasks/:taskId/audio-drafts/:draftId` | ✅ | Contributor | Update metadata (description, theme, keywords) |
| `PATCH` | `/tasks/:taskId/audio-drafts/:draftId/mark-done` | ✅ | Contributor | Mark as DONE |
| `PATCH` | `/tasks/:taskId/audio-drafts/:draftId/suggest-rejection` | ✅ | Contributor | Suggest rejection (with reason) |
| `PATCH` | `/tasks/:taskId/audio-drafts/:draftId/approve` | ✅ | Reviewer | Approve audio draft |
| `PATCH` | `/tasks/:taskId/audio-drafts/:draftId/request-corrections` | ✅ | Reviewer | Send back for corrections |
| `PATCH` | `/tasks/:taskId/audio-drafts/:draftId/reject` | ✅ | Reviewer | Reject audio draft |
| `GET` | `/tasks/:taskId/audio-drafts/:draftId/stream` | ✅ | Contributor | Stream audio file (for playback) |

### 5.4 Theme Endpoints

| Method | Path | Auth | Min Role | Description |
|--------|------|------|----------|-------------|
| `GET` | `/themes` | ✅ | Contributor | List all themes (with `isValidated` filter) |
| `POST` | `/themes` | ✅ | Contributor | Create a new theme (auto-flagged if Contributor) |
| `PATCH` | `/themes/:themeId/validate` | ✅ | Reviewer | Validate a theme |
| `PATCH` | `/themes/:themeId` | ✅ | Reviewer | Update theme name (fix typos) |
| `DELETE` | `/themes/:themeId` | ✅ | Publisher | Delete a theme |

### 5.5 Admin Endpoints (Updated)

| Method | Path | Auth | Min Role | Description |
|--------|------|------|----------|-------------|
| `POST` | `/admins` | ✅ | System Admin | Create admin (with `role` field) |
| `GET` | `/admins` | ✅ | Reviewer | List admins |
| `GET` | `/admins/:adminId` | ✅ | Contributor | Get admin profile |
| `GET` | `/admins/me` | ✅ | Contributor | Get current user's profile |
| `PUT` | `/admins/:adminId` | ✅ | System Admin | Update admin (incl. role change) |
| `PUT` | `/admins/:adminId/password` | ✅ | Self | Change own password |
| `DELETE` | `/admins/:adminId` | ✅ | System Admin | Deactivate admin |
| `POST` | `/admins/login` | ❌ | — | Login |

### 5.6 Audio Endpoints (Existing — Backward Compatible)

No breaking changes. Add optional `taskId` to the response.

---

## 6. Authentication & Authorization

### 6.1 JWT Payload Update

**Current**:
```typescript
{ id: string, isSuperAdmin: boolean }
```

**Target**:
```typescript
{
  id: string,
  role: AdminRole,
  email: string
}
```

### 6.2 Auth Middleware

```typescript
// src/middleware/auth.middleware.ts
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../types/request.types';
import { AppError } from '../errors/app-error';

export const authenticate = (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
  const token = req.header('auth-token') || req.header('authorization')?.replace('Bearer ', '');
  if (!token) throw new AppError('Authentication required', 401);

  try {
    const decoded = jwt.verify(token, process.env.ADMIN_TOKEN_SECRET!) as {
      id: string;
      role: string;
      email: string;
    };
    req.user = decoded;

    // Issue a refreshed token
    const newToken = jwt.sign(
      { id: decoded.id, role: decoded.role, email: decoded.email },
      process.env.ADMIN_TOKEN_SECRET!,
      { expiresIn: '24h' }
    );
    _res.header('auth-token', newToken);

    next();
  } catch {
    throw new AppError('Invalid or expired token', 401);
  }
};
```

### 6.3 RBAC Middleware

```typescript
// src/middleware/rbac.middleware.ts
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/request.types';
import { AdminRole, ROLE_HIERARCHY } from '../types/enums';
import { AuthorizationError } from '../errors/app-error';

/**
 * Checks if the authenticated user's role level is <= the required level.
 * Lower number = higher privilege. SYSTEM_ADMIN=0, PUBLISHER=1, REVIEWER=2, CONTRIBUTOR=3.
 */
export const requireRole = (...allowedRoles: AdminRole[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    const userRole = req.user?.role as AdminRole;
    if (!userRole) throw new AuthorizationError();

    const userLevel = ROLE_HIERARCHY[userRole];
    const isAllowed = allowedRoles.some(role => userLevel <= ROLE_HIERARCHY[role]);

    if (!isAllowed) throw new AuthorizationError('Insufficient permissions');
    next();
  };
};

// Convenience helpers
export const requireContributor = requireRole(AdminRole.CONTRIBUTOR);
export const requireReviewer = requireRole(AdminRole.REVIEWER);
export const requirePublisher = requireRole(AdminRole.PUBLISHER);
export const requireSystemAdmin = requireRole(AdminRole.SYSTEM_ADMIN);
```

### 6.4 Four-Eyes Principle

The four-eyes rule (reviewer cannot approve a task they worked on) is enforced in the **TaskService**, not in middleware, because it requires checking task-specific data:

```typescript
// In TaskService.approveTask():
async approveTask(taskId: string, reviewerId: string, reviewerRole: AdminRole): Promise<ITask> {
  const task = await this.taskRepo.findById(taskId);
  if (!task) throw new NotFoundError('Task not found');

  // Four-eyes: Reviewers cannot approve their own work
  if (
    ROLE_HIERARCHY[reviewerRole] >= ROLE_HIERARCHY[AdminRole.REVIEWER] &&
    task.previousAssignee?.toString() === reviewerId
  ) {
    throw new AuthorizationError(
      'Four-eyes principle: you cannot approve a task you previously worked on'
    );
  }
  // ... proceed with approval
}
```

Publishers and System Admins are exempt (their `ROLE_HIERARCHY` level is < REVIEWER).

---

## 7. Business Logic & Services

### 7.1 Task Service — State Machine

The `TaskService` enforces all status transition rules as defined in the functional documentation.

**Allowed transitions**:

```
OPEN → IN_PROGRESS                     (contributor assigns)
IN_PROGRESS → READY_FOR_REVIEW         (contributor submits)
IN_PROGRESS → OPEN                     (contributor unassigns self)
READY_FOR_REVIEW → IN_REVIEW           (reviewer picks)
READY_FOR_REVIEW → OPEN                (reviewer unassigns to backlog)
IN_REVIEW → APPROVED                   (reviewer approves)
IN_REVIEW → CORRECTIONS_NEEDED         (reviewer requests corrections)
IN_REVIEW → REJECTED                   (reviewer rejects)
IN_REVIEW → READY_FOR_REVIEW           (reviewer releases without decision)
CORRECTIONS_NEEDED → IN_PROGRESS       (contributor picks up corrections)
APPROVED → PUBLISHED                   (publisher publishes)
PUBLISHED → APPROVED                   (system admin unpublishes)
```

```typescript
// src/services/task.service.ts (key methods)

const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  [TaskStatus.OPEN]: [TaskStatus.IN_PROGRESS],
  [TaskStatus.IN_PROGRESS]: [TaskStatus.READY_FOR_REVIEW, TaskStatus.OPEN],
  [TaskStatus.READY_FOR_REVIEW]: [TaskStatus.IN_REVIEW, TaskStatus.OPEN],
  [TaskStatus.IN_REVIEW]: [
    TaskStatus.APPROVED,
    TaskStatus.CORRECTIONS_NEEDED,
    TaskStatus.REJECTED,
    TaskStatus.READY_FOR_REVIEW,
  ],
  [TaskStatus.CORRECTIONS_NEEDED]: [TaskStatus.IN_PROGRESS],
  [TaskStatus.APPROVED]: [TaskStatus.PUBLISHED],
  [TaskStatus.REJECTED]: [],         // Terminal
  [TaskStatus.PUBLISHED]: [TaskStatus.APPROVED],  // Unpublish only
};

private assertTransition(currentStatus: TaskStatus, targetStatus: TaskStatus): void {
  const allowed = VALID_TRANSITIONS[currentStatus];
  if (!allowed?.includes(targetStatus)) {
    throw new ConflictError(
      `Cannot transition from ${currentStatus} to ${targetStatus}`
    );
  }
}
```

### 7.2 Task Service — Key Operations

#### Create Task (Publisher+)

1. Validate request (description, sessionAuthor, sessionDate, audio files)
2. Upload each audio file to S3 (use a dedicated prefix: `drafts/<taskId>/<filename>`)
3. Create `Task` document with status `OPEN`
4. Create one `AudioDraft` per uploaded file with status `PENDING`
5. Update `contentState.total` and `contentState.pending`
6. Log activity

#### Self-Assign Task (Contributor+)

1. Assert task status is `OPEN`
2. Assert `assignee` is `null`
3. Set `assignee` to current user, status → `IN_PROGRESS`
4. Log activity

#### Submit for Review (Contributor+)

1. Assert task status is `IN_PROGRESS`
2. Assert current user is the `assignee`
3. Assert all audio drafts are in a terminal-for-contributor state (`DONE` or `REJECTION_SUGGESTED`)
4. Set `previousAssignee` to current `assignee`
5. Set `assignee` to `null`, status → `READY_FOR_REVIEW`
6. Log activity

#### Pick for Review (Reviewer+)

1. Assert task status is `READY_FOR_REVIEW`
2. Four-eyes check (if Reviewer role)
3. Set `assignee` to current user, `reviewedBy` to current user, status → `IN_REVIEW`
4. Log activity

#### Approve Task (Reviewer+)

1. Assert task status is `IN_REVIEW`
2. Assert current user is `assignee`
3. Four-eyes check
4. All audio drafts must be either `APPROVED` or `REJECTED` (no `PENDING`, `DONE`, etc.)
5. Status → `APPROVED`, clear `assignee`
6. Log activity

#### Request Corrections (Reviewer+)

1. Assert task status is `IN_REVIEW`
2. Require a correction comment
3. Status → `CORRECTIONS_NEEDED`
4. **Default**: Reassign to `previousAssignee`. **Optional**: reviewer can choose to set `assignee = null` (back to backlog as `OPEN`)
5. Reset relevant audio draft statuses back to `PENDING` or `CORRECTIONS_NEEDED`
6. Log activity

#### Publish Task (Publisher+)

1. Assert task status is `APPROVED`
2. For each `APPROVED` audio draft:
   a. Copy the audio file from `drafts/<taskId>/` to the main audio bucket location
   b. Create a new `Audio` document (published) with metadata from the draft + `taskId` reference
3. Store created `Audio` IDs in `task.publishedAudioIds`
4. Task status → `PUBLISHED`
5. Log activity

#### Unpublish Task (System Admin only)

1. Assert task status is `PUBLISHED`
2. Require explicit confirmation (task name must match)
3. For each `Audio` in `publishedAudioIds`:
   a. Delete `Audio` document from DB
   b. Delete audio file from S3 (main bucket location)
4. Clear `publishedAudioIds`
5. Task status → `APPROVED`
6. Log activity

### 7.3 ContentState Recalculation

The `contentState` on a Task is a **denormalized aggregate** of its audio draft statuses. It must be recalculated every time an audio draft's status changes.

```typescript
async recalculateContentState(taskId: string): Promise<IContentState> {
  const drafts = await this.audioDraftRepo.findMany({ task: taskId });
  const state: IContentState = {
    total: drafts.length,
    pending: drafts.filter(d => d.status === AudioDraftStatus.PENDING).length,
    done: drafts.filter(d =>
      [AudioDraftStatus.DONE, AudioDraftStatus.REJECTION_SUGGESTED].includes(d.status)
    ).length,
    approved: drafts.filter(d => d.status === AudioDraftStatus.APPROVED).length,
    rejected: drafts.filter(d => d.status === AudioDraftStatus.REJECTED).length,
    correctionNeeded: drafts.filter(d => d.status === AudioDraftStatus.CORRECTIONS_NEEDED).length,
  };
  await this.taskRepo.updateById(taskId, { contentState: state });
  return state;
}
```

### 7.4 Theme Service

```typescript
// src/services/theme.service.ts
export class ThemeService {
  async createTheme(name: string, createdById: string, creatorRole: AdminRole): Promise<ITheme> {
    const normalized = name.toUpperCase().trim();

    // Check for existing theme (exact match or fuzzy)
    const existing = await this.themeRepo.findOne({ name: normalized });
    if (existing) throw new ConflictError(`Theme "${normalized}" already exists`);

    const isValidated = ROLE_HIERARCHY[creatorRole] <= ROLE_HIERARCHY[AdminRole.REVIEWER];

    return this.themeRepo.create({
      name: normalized,
      isValidated,
      createdBy: createdById,
      validatedBy: isValidated ? createdById : null,
    });
  }

  async getOrCreateTheme(name: string, createdById: string, creatorRole: AdminRole): Promise<ITheme> {
    const normalized = name.toUpperCase().trim();
    const existing = await this.themeRepo.findOne({ name: normalized });
    if (existing) return existing;
    return this.createTheme(name, createdById, creatorRole);
  }
}
```

### 7.5 Storage Service

Abstract S3 operations behind a service interface. This replaces the current `audio-file-handler.ts` + `s3-audio-file-uploader.ts`.

```typescript
// src/services/storage.service.ts
export class StorageService {
  private s3: S3;
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.S3_ACCESS_POINT_ARN!;
    // S3 client init based on PROFILE env var
  }

  async uploadFile(data: Buffer, key: string): Promise<string> { ... }
  async getFile(key: string, range?: { start: number; end: number }): Promise<Uint8Array> { ... }
  async getFileMetadata(key: string): Promise<HeadObjectCommandOutput> { ... }
  async deleteFile(key: string): Promise<void> { ... }
  async downloadFile(key: string): Promise<PassThrough> { ... }
  async copyFile(sourceKey: string, destKey: string): Promise<void> { ... }
  async downloadBucket(): Promise<PassThrough> { ... }
}
```

S3 key naming conventions:
- **Draft audio files**: `drafts/<taskId>/<draftId>.<ext>`
- **Published audio files**: `audios/<audioId>.<ext>` (same as current)

---

## 8. Frontend Architecture

### 8.1 Key Refactoring Decisions

| Change | From | To | Reason |
|--------|------|----|--------|
| Component style | Class components | Functional components + hooks | Modern React, better code reuse |
| State management | `location.state` for auth | React Context (`AuthContext`) | Survives page refresh, centralized |
| HTTP client | Custom `fetch` wrapper | Same pattern but with token interceptor | Auto-attach token, auto-refresh |
| Date library | `moment` | `date-fns` | Tree-shakeable, smaller bundle |
| Routing | Flat routes | Nested routes with layout | Admin layout wraps all admin pages |
| UI framework | MUI 5 (keep) | MUI 5 (keep, upgrade later) | Already in use, upgrade separately |

### 8.2 Auth Context

```typescript
// src/contexts/AuthContext.tsx
interface AuthState {
  user: { id: string; role: AdminRole; email: string; name: string } | null;
  token: string | null;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}
```

Token is stored in `localStorage` (or `sessionStorage` for higher security). The `AuthContext` reads it on mount to restore sessions.

### 8.3 Routing Structure

```typescript
const router = createBrowserRouter([
  // Public routes
  { path: '/', element: <HomePage /> },
  { path: '/audio', element: <AudioLinkPage /> },

  // Auth
  { path: '/login', element: <LoginPage /> },

  // Admin routes (protected, with layout)
  {
    path: '/admin',
    element: <ProtectedRoute><AdminLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'tasks', element: <TaskListPage /> },
      { path: 'tasks/create', element: <TaskCreatePage /> },
      { path: 'tasks/:taskId', element: <TaskDetailPage /> },
      { path: 'tasks/:taskId/drafts/:draftId', element: <AudioDraftWorkPage /> },
      { path: 'audios/create', element: <AudioCreatePage /> },
      { path: 'themes', element: <ThemeManagementPage /> },
      { path: 'admins', element: <AdminManagementPage /> },
    ],
  },

  { path: '*', element: <Navigate to="/" /> },
]);
```

### 8.4 Key Frontend Pages

#### Task List Page (`TaskListPage.tsx`)

- **Tab navigation**: Backlog | My Tasks | Review Queue | Approved | All Tasks
- Each tab applies different default filters to the same `GET /tasks` endpoint
- **Filters panel**: Status, Author, Assignee, Date range, Has new themes, Has suggested rejections
- **Sort**: By date, progress, update time
- **Task cards** showing: description, author, date, status badge, progress bar, assignee
- **Actions**: Assign to me (backlog), Open task detail

#### Task Detail Page (`TaskDetailPage.tsx`)

- **Header**: Task info, status, assignee, action buttons (submit, approve, etc.)
- **Progress bar**: Visual representation of content state
- **Audio draft list**: Cards for each draft with status badge, description preview, new theme badge
- **Activity log**: Collapsible timeline
- **Rejection suggestions**: Highlighted section if `taskRejectionSuggested` is true

#### Audio Draft Work Page (`AudioDraftWorkPage.tsx`)

- **Audio player**: Embedded player for the draft audio
- **Form**: Description (textarea), Theme (autocomplete with new-theme detection), Keywords
- **Status controls**: Mark as Done, Suggest Rejection (with reason input)
- **Navigation**: Previous/Next draft buttons

#### Task Create Page (`TaskCreatePage.tsx`)

- **Form**: Session author (autocomplete), Session date, Description
- **File upload zone**: Drag-and-drop or file picker for multiple audio files
- **Preview**: List of selected files with ability to remove/reorder
- **Submit**: Creates task + uploads all files

### 8.5 API Client

```typescript
// src/api/client.ts
const API_BASE = import.meta.env.VITE_API_SERVER_URL + '/api/v1';

export const apiClient = {
  async request<T>(method: string, path: string, data?: unknown): Promise<T> {
    const token = localStorage.getItem('auth-token');
    const headers: Record<string, string> = {};
    if (token) headers['auth-token'] = token;
    if (!(data instanceof FormData)) headers['Content-Type'] = 'application/json';

    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: data instanceof FormData ? data : data ? JSON.stringify(data) : undefined,
    });

    // Refresh token from response
    const newToken = res.headers.get('auth-token');
    if (newToken) localStorage.setItem('auth-token', newToken);

    if (!res.ok) {
      const error = await res.json();
      throw new ApiError(res.status, error.message, error.details);
    }

    return res.json();
  },

  get: <T>(path: string) => apiClient.request<T>('GET', path),
  post: <T>(path: string, data: unknown) => apiClient.request<T>('POST', path, data),
  patch: <T>(path: string, data?: unknown) => apiClient.request<T>('PATCH', path, data),
  put: <T>(path: string, data: unknown) => apiClient.request<T>('PUT', path, data),
  del: <T>(path: string) => apiClient.request<T>('DELETE', path),
};
```

---

## 9. Infrastructure Changes

### 9.1 Docker Compose — Development

Add nothing new — MongoDB and MinIO already exist. The new collections are just created automatically by Mongoose.

### 9.2 MongoDB Migration Script

```javascript
// infrastructure/database/migrate_admin_roles.js

// Step 1: Migrate isSuperAdmin → role
db.admins.updateMany(
  { isSuperAdmin: true },
  { $set: { role: 'SYSTEM_ADMIN' }, $unset: { isSuperAdmin: '' } }
);
db.admins.updateMany(
  { isSuperAdmin: { $ne: true } },
  { $set: { role: 'CONTRIBUTOR' }, $unset: { isSuperAdmin: '' } }
);

// Step 2: Add isActive field
db.admins.updateMany(
  { isActive: { $exists: false } },
  { $set: { isActive: true } }
);

// Step 3: Seed themes from existing audios
db.audios.distinct('theme').forEach(function(theme) {
  if (theme && theme.trim()) {
    db.themes.insertOne({
      name: theme.toUpperCase().trim(),
      isValidated: true,
      createdBy: ObjectId('<system-admin-id>'),
      validatedBy: ObjectId('<system-admin-id>'),
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
});

// Step 4: Create indexes
db.tasks.createIndex({ status: 1 });
db.tasks.createIndex({ assignee: 1 });
db.tasks.createIndex({ status: 1, assignee: 1 });
db.tasks.createIndex({ sessionAuthor: 1 });
db.tasks.createIndex({ sessionDate: -1 });
db.audiodrafts.createIndex({ task: 1, order: 1 });
db.audiodrafts.createIndex({ task: 1, status: 1 });
db.themes.createIndex({ name: 1 }, { unique: true });
db.themes.createIndex({ isValidated: 1 });
db.activitylogs.createIndex({ entityType: 1, entityId: 1 });
db.activitylogs.createIndex({ createdAt: -1 });
db.audios.createIndex({ taskId: 1 });
```

### 9.3 S3 Bucket Structure

```
<bucket>/
├── drafts/                      # NEW — Task audio draft files
│   ├── <taskId>/
│   │   ├── <draftId>.mp3
│   │   ├── <draftId>.mp3
│   │   └── ...
│   └── ...
├── <audioId>.mp3                # Existing — Published audio files
├── <audioId>.mp3
└── ...
```

No bucket changes needed — just a naming convention. The `StorageService` handles the path logic.

---

## 10. Migration Strategy

### 10.1 Phase Approach

The migration follows a **backward-compatible incremental approach** to avoid breaking changes:

1. **Phase 0** — Backend refactoring (new architecture without new features)
   - Restructure folders
   - Introduce service/repository layers
   - Replace validators with Zod
   - Centralize error handling
   - Connect DB once at startup
   - Keep existing API paths working

2. **Phase 1** — Admin role migration
   - Add `role` field to admin schema
   - Run migration script (`isSuperAdmin → role`)
   - Update JWT payload
   - Add RBAC middleware
   - Keep backward compat: `isSuperAdmin` still works in JWT until frontend is updated

3. **Phase 2** — New models & APIs
   - Add Task, AudioDraft, Theme, ActivityLog models
   - Implement TaskService, ThemeService
   - Add all new API endpoints under `/api/v1/`
   - Existing `/audios`, `/admins` endpoints still work

4. **Phase 3** — Frontend refactoring
   - Migrate to functional components
   - Add AuthContext
   - Build admin dashboard and task pages
   - Update API client to use `/api/v1/`

5. **Phase 4** — Deprecate old paths
   - Remove old route aliases
   - Remove `isSuperAdmin` from codebase

### 10.2 Data Migration Checklist

| Step | Action | Reversible |
|------|--------|------------|
| 1 | Backup MongoDB | N/A |
| 2 | Run `migrate_admin_roles.js` | Yes (keep `isSuperAdmin` temporarily) |
| 3 | Seed themes collection from existing audios | Yes (drop collection) |
| 4 | Create new indexes | Yes (drop indexes) |
| 5 | Deploy new backend (both old + new routes active) | Yes (rollback deploy) |
| 6 | Deploy new frontend | Yes (rollback deploy) |
| 7 | Remove old route aliases | No (breaking for old clients) |

---

## 11. Environment Variables

### 11.1 Updated `.env.sample`

```env
# ─── Database ───
DB_CONNECTION=mongodb://localhost:27017
MONGODB_USERNAME=root
MONGODB_PASSWORD=mypass
MONGODB_DB_NAME=samwaktou

# ─── Auth ───
ADMIN_TOKEN_SECRET=<your-secret>
USER_TOKEN_SECRET=<your-secret>

# ─── S3 / Object Storage ───
S3_ACCESS_KEY=<access-key>
S3_SECRET_ACCESS_KEY=<secret-key>
S3_ACCESS_POINT_ARN=<bucket-name-or-arn>
S3_HOST=http://localhost:9000           # Only for dev (MinIO)
S3_REGION=us-east-2

# ─── Root Admin (seed — used only for initial setup) ───
ROOT_ADMIN_ID=<objectid>
ROOT_ADMIN_SURNAME=Super
ROOT_ADMIN_NAME=Admin
ROOT_ADMIN_EMAIL=admin@example.com
ROOT_ADMIN_DATE=2024-01-01
ROOT_ADMIN_PASSWORD=<bcrypt-hashed-password>

# ─── CORS ───
APP_HOST=http://localhost
APP_LOAD_BALANCER_HOST=
APP_CORS_EXTRA_WHITLISTS=

# ─── Profile ───
PROFILE=dev                             # dev | prod

# ─── Server ───
PORT=8080                               # NEW — configurable via env
LOG_LEVEL=info                          # NEW — for structured logging
```

### 11.2 Frontend `.env.development`

```env
VITE_API_SERVER_URL=http://localhost:8080
VITE_APP_URL=http://localhost:3000
VITE_LOGIN_PATH=/login
VITE_ADMIN_PATH=/admin
VITE_CREATE_AUDIO_PATH=/admin/audios/create
VITE_AUDIO_LINK_PATH=/audio
```

---

## 12. Error Handling Strategy

### 12.1 Error Flow

```
Service throws AppError (or subclass)
  → Controller doesn't catch (no try/catch needed)
  → Express passes to error-handler middleware
  → Middleware formats standardized response
```

### 12.2 Error Codes Mapping

| Error Class | HTTP Status | When |
|-------------|-------------|------|
| `ValidationError` | 400 | Bad request data |
| `AppError('...', 401)` | 401 | Missing/invalid token |
| `AuthorizationError` | 403 | Insufficient role/permissions |
| `NotFoundError` | 404 | Resource not found |
| `ConflictError` | 409 | Invalid state transition, duplicate |
| Unhandled `Error` | 500 | Unexpected errors |

### 12.3 Controller Pattern

With centralized error handling, controllers become thin:

```typescript
// src/controllers/task.controller.ts
export class TaskController {
  constructor(private taskService: TaskService) {}

  createTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const task = await this.taskService.createTask(req.body, req.files, req.user!);
    res.status(201).json({ success: true, data: task });
  };

  getTasks = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const result = await this.taskService.getTasks(req.query);
    res.json({ success: true, ...result });
  };

  assignTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const task = await this.taskService.assignTask(req.params.taskId, req.user!.id);
    res.json({ success: true, data: task });
  };
  // ... all methods follow the same pattern
}
```

Using `express-async-errors` (or wrapping with `asyncHandler`) ensures async errors propagate to the error handler.

---

## 13. Testing Strategy

> **Note**: Full test implementation is deferred to a later phase. This section defines the strategy.

### 13.1 Test Structure

```
backend/api/
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   │   ├── task.service.test.ts
│   │   │   ├── theme.service.test.ts
│   │   │   └── audio.service.test.ts
│   │   ├── middleware/
│   │   │   ├── rbac.middleware.test.ts
│   │   │   └── auth.middleware.test.ts
│   │   └── validators/
│   │       ├── task.validator.test.ts
│   │       └── admin.validator.test.ts
│   ├── integration/
│   │   ├── task.api.test.ts
│   │   ├── admin.api.test.ts
│   │   └── theme.api.test.ts
│   └── helpers/
│       ├── db.helper.ts          # In-memory MongoDB (mongodb-memory-server)
│       └── auth.helper.ts        # Token generation for tests
```

### 13.2 Testing Tools

| Tool | Purpose |
|------|---------|
| `vitest` or `jest` | Test runner |
| `mongodb-memory-server` | In-memory MongoDB for integration tests |
| `supertest` | HTTP assertions for API tests |

### 13.3 Key Test Scenarios

**Task State Machine**:
- Valid transitions succeed
- Invalid transitions throw `ConflictError`
- Four-eyes principle enforced for Reviewers
- Four-eyes principle NOT enforced for Publishers/SystemAdmins

**RBAC**:
- Contributors cannot publish
- Reviewers cannot hard-delete
- Publishers cannot unpublish
- System Admin can do everything

**Theme Management**:
- Contributor creates theme → `isValidated: false`
- Reviewer creates theme → `isValidated: true`
- Duplicate theme names rejected

**Publish/Unpublish**:
- Publish creates Audio documents + copies S3 files
- Unpublish deletes Audio documents + S3 files + requires confirmation

---

## 14. Implementation Phases

### Phase 0 — Backend Refactoring (no new features)
1. Restructure backend into layered architecture (folders, base classes)
2. Replace `body-parser` with `express.json()`
3. Move DB connection to startup
4. Implement `BaseRepository`, migrate Audio and Admin to use it
5. Replace manual validators + Joi with Zod
6. Add centralized error handling middleware
7. Add API versioning (`/api/v1/`)
8. Add request logging middleware
9. Keep existing routes as aliases for backward compatibility

### Phase 1 — Admin Role System
1. Update Admin schema: `isSuperAdmin` → `role: AdminRole`
2. Write and run migration script
3. Update JWT payload to include `role`
4. Implement `authenticate` + `requireRole` middleware
5. Update all existing routes to use new middleware
6. Update admin CRUD to handle roles

### Phase 2 — Task & AudioDraft Backend
1. Create Task, AudioDraft, Theme, ActivityLog models
2. Implement repositories for each
3. Implement `TaskService` with full state machine
4. Implement `ThemeService`
5. Update `StorageService` with `copyFile` and draft key convention
6. Implement all Task, AudioDraft, Theme API endpoints
7. Implement publish/unpublish logic
8. Seed themes from existing audio data

### Phase 3 — Frontend Refactoring
1. Set up AuthContext, API client, routing structure
2. Migrate Login page to functional component
3. Build AdminLayout (sidebar, topbar)
4. Build DashboardPage
5. Build TaskListPage with tabs and filters
6. Build TaskDetailPage
7. Build AudioDraftWorkPage
8. Build TaskCreatePage (multi-file upload)
9. Build ThemeManagementPage
10. Migrate existing audio browsing pages to functional components

### Phase 4 — Polish & Cleanup
1. Remove backward-compatible route aliases
2. Remove `isSuperAdmin` from codebase
3. Final testing and QA
4. Update documentation

---

*This document provides the technical blueprint for implementing the collaborative task workflow. For the functional requirements, see [Functional Documentation](./FUNCTIONAL.md).*
