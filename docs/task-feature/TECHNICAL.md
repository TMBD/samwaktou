# Task Feature — Technical Documentation

> **Reference**: [Functional Documentation](./FUNCTIONAL.md)
>
> This document provides all the technical details needed to implement the collaborative task workflow feature. It covers the target architecture, technology stack upgrades, data models, API design, backend and frontend changes, infrastructure updates, and a migration strategy from the current codebase.
>
> **Design goals**: Database-agnostic data access, native ESM modules, latest stable dependencies, maximum use of new framework features, and a clean layered architecture that follows current best practices.

---

## Table of Contents

1. [Current Architecture Analysis & Issues](#1-current-architecture-analysis--issues)
2. [Technology Stack Upgrade](#2-technology-stack-upgrade)
3. [Target Architecture](#3-target-architecture)
4. [Backend Refactoring](#4-backend-refactoring)
5. [Data Models & Database Design](#5-data-models--database-design)
6. [API Design](#6-api-design)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Business Logic & Services](#8-business-logic--services)
9. [Frontend Architecture](#9-frontend-architecture)
10. [Infrastructure Changes](#10-infrastructure-changes)
11. [Migration Strategy](#11-migration-strategy)
12. [Environment Variables](#12-environment-variables)
13. [Error Handling Strategy](#13-error-handling-strategy)
14. [Testing Strategy](#14-testing-strategy)
15. [Implementation Phases](#15-implementation-phases)

---

## 1. Current Architecture Analysis & Issues

### 1.1 Current Backend Structure

```
backend/api/src/
├── config/server.config.ts
├── controller/
│   ├── admin.controller.ts        # Admin CRUD + login (343 lines)
│   ├── audio.controller.ts        # Audio CRUD + file ops (310 lines)
│   └── utils/
│       ├── common.ts, verify-token.ts
│       ├── admin/admin-request-validator.ts
│       └── audio/audio-request-validator.ts, audio-file-handler.ts, s3-audio-file-uploader.ts
├── model/
│   ├── admin.model.ts, audio.model.ts, user.model.ts, analytic.model.ts
│   ├── db-connection.ts, db-crud.ts
│   └── schema/admin.schema.ts, audio.schema.ts, user.schema.ts, analytic.schema.ts
├── routes/admin.router.ts, audio.router.ts, user.router.ts, analytic.router.ts
└── server.ts
```

### 1.2 Identified Issues

| # | Issue | Impact | Recommendation |
|---|-------|--------|----------------|
| 1 | **No layered architecture** — Models mix data + DB ops. Controllers mix validation + business logic + response. | Hard to test/extend | **Service + Repository layers** |
| 2 | **DB tightly coupled** — Mongoose calls scattered in models. Changing DB = rewrite everything. | Impossible to swap DB | **DB-agnostic Repository pattern with interfaces** |
| 3 | **CommonJS modules** — `"module": "CommonJS"` in tsconfig | Cannot use ESM-only packages | Switch to **native ESM** |
| 4 | **Binary role system** — Only `isSuperAdmin: boolean` | Blocks task feature | Replace with `role: AdminRole` enum |
| 5 | **JWT payload limited** — `{id, isSuperAdmin}` only | Cannot carry role | Extend to `{id, role, email}` |
| 6 | **`connectToDB()` per operation** — Every CRUD call reconnects | Redundant overhead | Connect once at startup |
| 7 | **Validation inconsistency** — Manual checks (audio) vs `@hapi/joi` (admin) | Maintenance burden | Standardize on **Zod 4** |
| 8 | **No centralized error handling** — try/catch in every controller method | Inconsistent responses | Express 5 native async errors + global handler |
| 9 | **No logging** — No request/response logging | Hard to debug | **Pino** structured logging |
| 10 | **`body-parser` deprecated** — Separate package | Unnecessary dep | Use `express.json()` |
| 11 | **Root admin hardcoded in env** — Constructed from env vars with hardcoded `_id` | Fragile | Seed via migration script |
| 12 | **Frontend: class components** — `React.Component` everywhere | No hooks, no React 19 features | **Functional components** |
| 13 | **Frontend: auth via route state** — `location.state` for admin info | Lost on refresh | **React Context + localStorage** |
| 14 | **No server state management** — Raw fetch, no caching | Poor UX | **TanStack Query 5** |
| 15 | **No API versioning** — Routes under `/audios`, `/admins` directly | Breaking change risk | `/api/v1/` prefix |
| 16 | **`strictNullChecks: false`** | Runtime null errors | Enable |
| 17 | **`moment.js`** — 330KB, maintenance mode | Bundle bloat | **`date-fns` v4** |
| 18 | **`deleteAdmin` logic inverted** — Bug in controller | Data loss risk | Fix |
| 19 | **React Router: no data loading** — Not using loaders/actions | Missing pending UI | **React Router 7 data mode** |
| 20 | **No env validation** — `process.env.X!` non-null assertions | Silent failures | Validate at startup with Zod |

---

## 2. Technology Stack Upgrade

### 2.1 Complete Dependency Matrix

| Category | Current | Target | Why |
|----------|---------|--------|-----|
| **Runtime** | Node ~18 | **Node.js 22 LTS** | Native ESM, `--watch`, built-in test runner, stable `fetch`, `--env-file` |
| **Backend** | Express 4.18 | **Express 5.x** | **Native async error handling** — rejected promises auto-forwarded to error middleware, no try/catch needed |
| **Language** | TypeScript 5.4 | **TypeScript 5.8+** | Better ESM emit, `verbatimModuleSyntax` |
| **ORM** | Mongoose 7 | **Mongoose 8.x** | Improved TS generics, `HydratedDocument`, better lean typing |
| **Validation** | `@hapi/joi` + manual | **Zod 4** | 7-15x faster than Zod 3, native TS inference, JSON Schema, Zod Mini (2KB) for frontend |
| **Logging** | None | **Pino 9** + `pino-http` | Fastest Node.js logger, structured JSON, `pino-pretty` for dev |
| **Date** | `moment` 2.30 | **`date-fns` v4** | Tree-shakeable, ESM-native, ~10x smaller |
| **JWT** | `jsonwebtoken` | **`jose`** | ESM-native, Web Crypto API, lighter, Edge-compatible |
| **React** | 18.3 | **React 19** | `useActionState`, `useOptimistic`, `use()`, Actions, `ref` as prop |
| **Router** | React Router 6.23 | **React Router 7** | Data mode with `loader`/`action`, `useFetcher`, `useNavigation`, lazy routes |
| **UI** | MUI 5.15 | **Mantine 7** | Lighter (~30% less than MUI), built-in `@mantine/form` with Zod, `@mantine/hooks`, `@mantine/dates`, `@mantine/notifications`, CSS Modules, React 19 support, excellent admin/dashboard components |
| **Build** | Vite 5.2 | **Vite 6** | Rolldown bundler, faster builds |
| **Server State** | None | **TanStack Query 5** | Caching, background refetch, optimistic updates, devtools |
| **Testing** | None | **Vitest** + `supertest` + `mongodb-memory-server` | ESM-native, Vite-compatible, fast |
| **Dev runner** | `ts-node-dev` | **`tsx`** | ESM-compatible TS execution, works with `--watch` |

### 2.2 Packages to Remove

`body-parser`, `@hapi/joi`, `moment`, `jsonwebtoken`, `ts-node-dev`, `@types/jsonwebtoken`, `lodash` (full — replace with `lodash-es` or native), `web-vitals`, `@mui/material`, `@mui/icons-material`, `@mui/x-date-pickers`, `@emotion/react`, `@emotion/styled`.

### 2.3 Packages to Add

**Backend**: `zod` v4, `pino`, `pino-http`, `pino-pretty` (dev), `jose`, `date-fns`, `tsx` (dev), `vitest` (dev), `supertest` (dev), `mongodb-memory-server` (dev).

**Frontend**: `@mantine/core`, `@mantine/hooks`, `@mantine/form`, `@mantine/dates`, `@mantine/notifications`, `@tabler/icons-react`, `@tanstack/react-query` v5, `@tanstack/react-query-devtools` (dev), `zod/mini`, `date-fns`, `vitest` (dev).

### 2.4 Key Features We Must Leverage

**Express 5 — Native async errors** (no more try/catch in routes):
```typescript
// Rejected promises auto-forwarded to error handler
router.get('/:id', async (req, res) => {
  const result = await service.findById(req.params.id); // Throws → error handler
  res.json({ success: true, data: result });
});
```

**React 19 — `useActionState` + `useOptimistic`**:
```tsx
const [state, submitAction, isPending] = useActionState(async (_prev, formData) => {
  const error = await updateDraft(formData);
  return error ? { error } : { success: true };
}, null);

const [optimisticStatus, setOptimisticStatus] = useOptimistic(task.status);
```

**React Router 7 — Data mode loaders**:
```typescript
{ path: 'tasks', Component: TaskListPage, loader: ({ request }) => fetchTasks(new URL(request.url).searchParams) }
// Component: const { tasks } = useLoaderData(); const nav = useNavigation(); // pending state
```

**TanStack Query 5 — Caching + auto-refetch**:
```typescript
const { data, isLoading } = useQuery({ queryKey: ['tasks', filters], queryFn: () => api.getTasks(filters), staleTime: 30_000 });
```

**`jose` — ESM-native JWT**:
```typescript
import { SignJWT, jwtVerify } from 'jose';
const token = await new SignJWT({ id, role, email }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('24h').sign(secret);
```

---

## 3. Target Architecture

### 3.1 Backend — Layered Architecture with Dependency Inversion

```
backend/api/src/
├── config/
│   ├── env.config.ts              # Zod-validated env vars (fail fast)
│   ├── server.config.ts           # Constants
│   ├── database.config.ts         # DB connection factory
│   ├── logger.config.ts           # Pino setup
│   └── s3.config.ts               # S3 client
├── middleware/
│   ├── auth.middleware.ts          # JWT (jose)
│   ├── rbac.middleware.ts          # Role checks
│   ├── error-handler.middleware.ts # Global handler
│   ├── request-logger.middleware.ts# pino-http
│   └── validate.middleware.ts      # Zod 4
├── routes/v1/
│   ├── index.ts
│   ├── audio.routes.ts, admin.routes.ts, task.routes.ts, theme.routes.ts, analytic.routes.ts
├── controllers/
│   ├── audio.controller.ts, admin.controller.ts, task.controller.ts, theme.controller.ts
├── services/                       # Business logic
│   ├── audio.service.ts, admin.service.ts, auth.service.ts
│   ├── task.service.ts, theme.service.ts, storage.service.ts
├── repositories/
│   ├── interfaces/                 # ← Pure TS interfaces (NO Mongoose dependency)
│   │   ├── base.repository.interface.ts
│   │   ├── admin.repository.interface.ts, audio.repository.interface.ts
│   │   ├── task.repository.interface.ts, audio-draft.repository.interface.ts
│   │   ├── theme.repository.interface.ts, activity-log.repository.interface.ts
│   └── mongoose/                   # ← Mongoose implementations
│       ├── base.repository.ts
│       ├── admin.repository.ts, audio.repository.ts
│       ├── task.repository.ts, audio-draft.repository.ts
│       ├── theme.repository.ts, activity-log.repository.ts
├── models/
│   ├── interfaces/                 # ← Pure TS interfaces (NO Mongoose dependency)
│   │   ├── admin.interface.ts, audio.interface.ts, task.interface.ts
│   │   ├── audio-draft.interface.ts, theme.interface.ts, activity-log.interface.ts
│   └── mongoose/                   # ← Mongoose schemas
│       ├── admin.schema.ts, audio.schema.ts, task.schema.ts
│       ├── audio-draft.schema.ts, theme.schema.ts, activity-log.schema.ts
├── validators/                     # Zod 4 schemas
├── errors/                         # Custom error classes
├── types/enums.ts, request.types.ts, response.types.ts
├── container.ts                    # Dependency injection composition root
└── server.ts                       # Express 5 setup
```

### 3.2 Database-Agnostic Repository Pattern

Repository interfaces define pure TS contracts with **zero ORM dependency**:

```typescript
// repositories/interfaces/base.repository.interface.ts
export interface PaginatedResult<T> {
  data: T[];  total: number;  skip: number;  limit: number;  hasMore: boolean;
}

export interface IBaseRepository<T, CreateDto, UpdateDto> {
  create(data: CreateDto): Promise<T>;
  findById(id: string): Promise<T | null>;
  findMany(filter: Partial<T>, options?: PaginationOptions): Promise<PaginatedResult<T>>;
  updateById(id: string, data: UpdateDto): Promise<T | null>;
  deleteById(id: string): Promise<boolean>;
  countDocuments(filter: Partial<T>): Promise<number>;
}
```

Mongoose implementations live in `repositories/mongoose/`. **To swap to PostgreSQL/Prisma**: create `repositories/prisma/`, implement same interfaces, change `container.ts`. No service/controller changes.

### 3.3 Composition Root (Manual DI)

```typescript
// container.ts — swap DB implementations here
import { MongooseTaskRepository } from './repositories/mongoose/task.repository.js';
// ...
const taskRepo = new MongooseTaskRepository();
const taskService = new TaskService(taskRepo, audioDraftRepo, themeService, storageService, audioRepo, activityLogRepo);
export const taskController = new TaskController(taskService);
```

### 3.4 Data Flow

```
Request → pino-http logger → Auth (jose) → RBAC → Zod validation
  → Controller → Service → Repository Interface → Mongoose Impl → MongoDB
Error anywhere → Express 5 auto-forwards → Global error handler → JSON response
```

### 3.5 Frontend Target Structure

```
frontend/samwaktou-react-app/src/
├── main.tsx                    # RR7 data mode + QueryClient + AuthProvider
├── api/client.ts, task.api.ts, admin.api.ts, theme.api.ts, audio.api.ts
├── contexts/AuthContext.tsx, NotificationContext.tsx
├── hooks/useAuth.ts, useTasks.ts, useAudioDrafts.ts, useThemes.ts
├── pages/
│   ├── public/HomePage.tsx, AudioLinkPage.tsx
│   ├── auth/LoginPage.tsx
│   └── admin/DashboardPage.tsx, TaskListPage.tsx, TaskDetailPage.tsx,
│          AudioDraftWorkPage.tsx, TaskCreatePage.tsx, AudioCreatePage.tsx,
│          ThemeManagementPage.tsx, AdminManagementPage.tsx
├── components/
│   ├── layout/AdminLayout.tsx, Sidebar.tsx, TopBar.tsx
│   ├── task/TaskCard.tsx, TaskStatusBadge.tsx, TaskProgressBar.tsx, TaskFilters.tsx
│   ├── audio-draft/AudioDraftCard.tsx, AudioDraftForm.tsx, NewThemeBadge.tsx
│   ├── common/DataTable.tsx, SearchBar.tsx, ConfirmDialog.tsx, LoadingSpinner.tsx
│   └── audio/AudioCard.tsx, AudioPlayer.tsx
├── types/task.types.ts, admin.types.ts, audio.types.ts, api.types.ts
├── utils/date.utils.ts, format.utils.ts
└── styles/theme.ts             # Mantine 7 theme
```

---

## 4. Backend Refactoring

### 4.1 Native ESM

- `package.json`: `"type": "module"`
- `tsconfig.json`: `"module": "NodeNext"`, `"moduleResolution": "NodeNext"`, `"target": "ES2022"`, `"verbatimModuleSyntax": true`, `"strictNullChecks": true`
- All imports use `.js` extension: `import { TaskService } from './services/task.service.js';`

### 4.2 Environment Validation (Zod 4)

```typescript
// config/env.config.ts
import { z } from 'zod';
const envSchema = z.object({
  DB_CONNECTION: z.string().url(),
  MONGODB_USERNAME: z.string().min(1),
  MONGODB_PASSWORD: z.string().min(1),
  MONGODB_DB_NAME: z.string().min(1),
  ADMIN_TOKEN_SECRET: z.string().min(32),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  S3_ACCESS_POINT_ARN: z.string().min(1),
  S3_HOST: z.string().url().optional(),
  PORT: z.coerce.number().default(8080),
  PROFILE: z.enum(['dev', 'prod']).default('dev'),
  LOG_LEVEL: z.enum(['fatal','error','warn','info','debug','trace']).default('info'),
  APP_HOST: z.string(),
  // ... other vars
});
export const env = envSchema.parse(process.env); // Fails fast on missing/invalid
```

### 4.3 DB Connection — Once at Startup

```typescript
// config/database.config.ts
import mongoose from 'mongoose';
import { env } from './env.config.js';
export const connectToDatabase = async () => {
  await mongoose.connect(env.DB_CONNECTION, { authSource: 'admin', user: env.MONGODB_USERNAME, pass: env.MONGODB_PASSWORD, dbName: env.MONGODB_DB_NAME });
};
```

### 4.4 Logging (Pino)

```typescript
// config/logger.config.ts
import pino from 'pino';
import { env } from './env.config.js';
export const logger = pino({
  level: env.LOG_LEVEL,
  transport: env.PROFILE === 'dev' ? { target: 'pino-pretty', options: { colorize: true } } : undefined,
});
```

### 4.5 Express 5 Server

```typescript
// server.ts
import express from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { env } from './config/env.config.js';
import { connectToDatabase } from './config/database.config.js';
import { errorHandler } from './middleware/error-handler.middleware.js';
import { logger } from './config/logger.config.js';
import v1Router from './routes/v1/index.js';

const app = express();
app.use(pinoHttp({ logger }));
app.use(cors({ origin: [env.APP_HOST], exposedHeaders: ['auth-token'] }));
app.use(express.json());
app.use('/api/v1', v1Router);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use(errorHandler); // Must be last

const start = async () => {
  await connectToDatabase();
  app.listen(env.PORT, () => logger.info(`Server on port ${env.PORT}`));
};
start().catch(err => { logger.fatal(err); process.exit(1); });
export default app;
```

### 4.6 JWT with `jose`

```typescript
// services/auth.service.ts
import { SignJWT, jwtVerify } from 'jose';
export class AuthService {
  private secret = new TextEncoder().encode(env.ADMIN_TOKEN_SECRET);

  async createToken(payload: TokenPayload): Promise<string> {
    return new SignJWT({ ...payload }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('24h').sign(this.secret);
  }
  async verifyToken(token: string): Promise<TokenPayload> {
    const { payload } = await jwtVerify(token, this.secret);
    return payload as TokenPayload;
  }
}
```

---

## 5. Data Models & Database Design

### 5.1 Enums

```typescript
// types/enums.ts
export enum AdminRole { SYSTEM_ADMIN='SYSTEM_ADMIN', PUBLISHER='PUBLISHER', REVIEWER='REVIEWER', CONTRIBUTOR='CONTRIBUTOR' }
export const ROLE_HIERARCHY: Record<AdminRole, number> = { SYSTEM_ADMIN:0, PUBLISHER:1, REVIEWER:2, CONTRIBUTOR:3 };
export enum TaskStatus { OPEN='OPEN', IN_PROGRESS='IN_PROGRESS', READY_FOR_REVIEW='READY_FOR_REVIEW', IN_REVIEW='IN_REVIEW', CORRECTIONS_NEEDED='CORRECTIONS_NEEDED', APPROVED='APPROVED', REJECTED='REJECTED', PUBLISHED='PUBLISHED' }
export enum AudioDraftStatus { PENDING='PENDING', DONE='DONE', REJECTION_SUGGESTED='REJECTION_SUGGESTED', APPROVED='APPROVED', CORRECTIONS_NEEDED='CORRECTIONS_NEEDED', REJECTED='REJECTED' }
```

### 5.2 Model Interfaces (DB-Agnostic, under `models/interfaces/`)

**IAdmin**: `id, surname, name, email, password, role: AdminRole, isActive: boolean, createdAt, updatedAt`

**ITask**: `id, description, sessionAuthor, sessionDate, status: TaskStatus, assignee: string|null, previousAssignee: string|null, createdBy, reviewedBy: string|null, contentState: IContentState, rejectionReason: string|null, taskRejectionSuggested: boolean, taskRejectionSuggestedReason: string|null, publishedAudioIds: string[], createdAt, updatedAt`

**IContentState**: `total, done, approved, rejected, correctionNeeded, pending` (all numbers)

**IAudioDraft**: `id, task, uri, originalFileName, description, theme, keywords, status: AudioDraftStatus, isNewTheme: boolean, rejectionSuggestedReason, reviewComment, correctionComment, order: number, createdAt, updatedAt`

**ITheme**: `id, name, isValidated: boolean, createdBy, validatedBy: string|null, createdAt, updatedAt`

**IActivityLog**: `id, entityType: 'task'|'audio_draft'|'theme', entityId, action, performedBy, details: Record<string,unknown>, createdAt`

**IAudio** (updated): existing fields + `taskId: string|null` (link to source task after publish)

### 5.3 Mongoose Schemas (under `models/mongoose/`)

Each schema implements its interface, uses `timestamps: true`, transforms `_id` → `id` in `toJSON`/`toObject`.

**Admin**: `isSuperAdmin` removed → `role: { type: String, enum: AdminRole, default: 'CONTRIBUTOR' }`, added `isActive: Boolean`.

**Task**: All ITask fields with ObjectId refs to Admin. ContentState as embedded subdocument. Indexes: `{status:1}`, `{assignee:1}`, `{status:1,assignee:1}`, `{sessionAuthor:1}`, `{sessionDate:-1}`.

**AudioDraft**: All IAudioDraft fields with ObjectId ref to Task. Indexes: `{task:1,order:1}`, `{task:1,status:1}`.

**Theme**: name unique + uppercase. Indexes: `{name:1}` unique, `{isValidated:1}`.

**ActivityLog**: timestamps with `createdAt` only. Indexes: `{entityType:1,entityId:1}`, `{createdAt:-1}`.

---

## 6. API Design

**Base URL**: `/api/v1`

### 6.1 Task Endpoints

| Method | Path | Min Role | Description |
|--------|------|----------|-------------|
| `POST` | `/tasks` | Publisher | Create task + upload audio files |
| `GET` | `/tasks` | Contributor | List (filters: status, assignee, author, date, sort, pagination) |
| `GET` | `/tasks/:taskId` | Contributor | Get detail |
| `PATCH` | `/tasks/:taskId/assign` | Contributor | Self-assign from backlog |
| `PATCH` | `/tasks/:taskId/unassign` | Reviewer | Unassign → OPEN |
| `PATCH` | `/tasks/:taskId/reassign` | Reviewer | Reassign to another admin |
| `PATCH` | `/tasks/:taskId/submit` | Contributor | Submit → READY_FOR_REVIEW |
| `PATCH` | `/tasks/:taskId/pick-for-review` | Reviewer | Pick → IN_REVIEW |
| `PATCH` | `/tasks/:taskId/approve` | Reviewer | Approve → APPROVED |
| `PATCH` | `/tasks/:taskId/request-corrections` | Reviewer | → CORRECTIONS_NEEDED |
| `PATCH` | `/tasks/:taskId/reject` | Reviewer | → REJECTED |
| `PATCH` | `/tasks/:taskId/suggest-rejection` | Contributor | Flag for rejection |
| `POST` | `/tasks/:taskId/publish` | Publisher | → PUBLISHED |
| `POST` | `/tasks/:taskId/unpublish` | System Admin | → APPROVED |
| `DELETE` | `/tasks/:taskId` | Publisher | Hard-delete |
| `GET` | `/tasks/:taskId/activity-log` | Contributor | Activity log |

### 6.2 AudioDraft Endpoints

| Method | Path | Min Role | Description |
|--------|------|----------|-------------|
| `GET` | `/tasks/:taskId/audio-drafts` | Contributor | List drafts |
| `GET/PATCH` | `/tasks/:taskId/audio-drafts/:draftId` | Contributor | Get / Update metadata |
| `PATCH` | `.../:draftId/mark-done` | Contributor | → DONE |
| `PATCH` | `.../:draftId/suggest-rejection` | Contributor | → REJECTION_SUGGESTED |
| `PATCH` | `.../:draftId/approve` | Reviewer | → APPROVED |
| `PATCH` | `.../:draftId/request-corrections` | Reviewer | → CORRECTIONS_NEEDED |
| `PATCH` | `.../:draftId/reject` | Reviewer | → REJECTED |
| `GET` | `.../:draftId/stream` | Contributor | Stream audio file |

### 6.3 Theme Endpoints

`GET /themes`, `POST /themes` (Contributor+), `PATCH /themes/:id/validate` (Reviewer+), `PATCH /themes/:id` (Reviewer+), `DELETE /themes/:id` (Publisher+).

### 6.4 Admin Endpoints (Updated)

`POST /admins` (SysAdmin), `GET /admins` (Reviewer+), `GET /admins/me`, `GET /admins/:id`, `PUT /admins/:id` (SysAdmin), `PUT /admins/:id/password` (self), `DELETE /admins/:id` (SysAdmin), `POST /admins/login` (public).

---

## 7. Authentication & Authorization

### 7.1 JWT Payload

`{ id: string, role: AdminRole, email: string }` — signed with `jose`, 24h expiry, refreshed in response header.

### 7.2 RBAC Middleware

```typescript
export const requireRole = (...roles: AdminRole[]) => (req, _res, next) => {
  const userLevel = ROLE_HIERARCHY[req.user.role];
  if (!roles.some(r => userLevel <= ROLE_HIERARCHY[r])) throw new AuthorizationError();
  next();
};
```

### 7.3 Four-Eyes Principle

Enforced in TaskService: Reviewers cannot approve tasks they previously worked on. Publishers/SysAdmins exempt.

---

## 8. Business Logic & Services

### 8.1 Task State Machine

```
OPEN → IN_PROGRESS (assign)
IN_PROGRESS → READY_FOR_REVIEW (submit) | OPEN (unassign self)
READY_FOR_REVIEW → IN_REVIEW (pick) | OPEN (reviewer unassigns)
IN_REVIEW → APPROVED | CORRECTIONS_NEEDED | REJECTED | READY_FOR_REVIEW (release)
CORRECTIONS_NEEDED → IN_PROGRESS (re-pick)
APPROVED → PUBLISHED (publish)
PUBLISHED → APPROVED (unpublish, SysAdmin only)
REJECTED → (terminal)
```

### 8.2 Key Operations

- **Create** (Publisher+): Validate, upload files to `drafts/<taskId>/`, create Task + AudioDrafts, update contentState
- **Assign** (Contributor+): Assert OPEN + null assignee, set assignee, → IN_PROGRESS
- **Submit** (Contributor+): Assert IN_PROGRESS + all drafts DONE/REJECTION_SUGGESTED, set previousAssignee, → READY_FOR_REVIEW
- **Pick Review** (Reviewer+): Assert READY_FOR_REVIEW, four-eyes check, → IN_REVIEW
- **Approve** (Reviewer+): Assert IN_REVIEW, all drafts APPROVED or REJECTED, → APPROVED
- **Corrections** (Reviewer+): Assert IN_REVIEW, reassign to previousAssignee (or backlog), → CORRECTIONS_NEEDED
- **Publish** (Publisher+): Assert APPROVED, for each APPROVED draft: copy S3 file, create Audio doc with taskId, → PUBLISHED
- **Unpublish** (SysAdmin): Assert PUBLISHED, require confirmation, delete Audio docs + S3 files, → APPROVED

### 8.3 ContentState Recalculation

Recalculated after every AudioDraft status change by aggregating draft statuses per task.

### 8.4 Theme Service

`getOrCreate(name, createdById, role)`: normalize name, check duplicate, auto-validate if Reviewer+.

### 8.5 Storage Service

S3 abstraction: `uploadFile`, `getFile`, `deleteFile`, `copyFile`, `getFileMetadata`.
Keys: drafts → `drafts/<taskId>/<draftId>.<ext>`, published → `audios/<audioId>.<ext>`.

---

## 9. Frontend Architecture

### 9.1 Key Decisions

| Aspect | Decision |
|--------|----------|
| Components | Functional + hooks (React 19) |
| Auth state | React Context + localStorage |
| Server state | TanStack Query 5 (caching, refetch, optimistic) |
| Forms | React 19 Actions + `useActionState` |
| Optimistic UI | `useOptimistic` |
| Data loading | React Router 7 loaders (data ready on nav) |
| Non-nav mutations | `useFetcher` from RR7 |
| Dates | `date-fns` v4 |
| UI | Mantine 7 (`@mantine/core`, `@mantine/form` with Zod, `@mantine/dates`, `@mantine/notifications`, `@tabler/icons-react`) |
| Build | Vite 6 |
| Client validation | Zod Mini (2KB) |

### 9.2 Auth Context

Stores user + token in state + localStorage. `login()`, `logout()` methods. Auto-redirect on 401.

### 9.3 Routing (RR7 Data Mode)

```tsx
createBrowserRouter([
  { path: '/', lazy: () => import('./pages/public/HomePage') },
  { path: '/login', lazy: () => import('./pages/auth/LoginPage') },
  { path: '/admin', Component: AdminLayout, children: [
    { index: true, lazy: () => import('./pages/admin/DashboardPage') },
    { path: 'tasks', lazy: () => import('./pages/admin/TaskListPage'), loader: taskListLoader },
    { path: 'tasks/create', lazy: () => import('./pages/admin/TaskCreatePage') },
    { path: 'tasks/:taskId', lazy: () => import('./pages/admin/TaskDetailPage') },
    { path: 'tasks/:taskId/drafts/:draftId', lazy: () => import('./pages/admin/AudioDraftWorkPage') },
    // ... other admin routes
  ]},
]);
```

### 9.4 TanStack Query Hooks

Custom hooks wrap TanStack Query for each entity: `useTaskList(filters)`, `useTask(id)`, `useAssignTask()`, etc. Queries auto-cache and refetch on window focus.

### 9.5 API Client

Fetch wrapper with: auto auth-token header, token refresh from response, 401 auto-logout, JSON/FormData handling.

---

## 10. Infrastructure Changes

### 10.1 Dockerfiles

- Backend: `node:22-alpine`, multi-stage (build TS → run compiled JS). No `ts-node-dev`.
- Frontend: `node:22-alpine`, multi-stage (vite build → serve static).

### 10.2 Dev Scripts

- Backend: `"dev": "tsx watch src/server.ts"`, `"build": "tsc"`, `"start": "node dist/server.js"`
- Frontend: `"dev": "vite"`, `"build": "vite build"`

### 10.3 Migration Script (`infrastructure/database/migrate_v2.js`)

1. Admin roles: `isSuperAdmin:true` → `role:'SYSTEM_ADMIN'`, others → `role:'CONTRIBUTOR'`, add `isActive:true`, remove `isSuperAdmin`
2. Seed themes from `db.audios.distinct('theme')`
3. Add `taskId:null` to existing audios
4. Create all new indexes

### 10.4 S3 Structure

`<bucket>/drafts/<taskId>/<draftId>.<ext>` (drafts), `<bucket>/audios/<audioId>.<ext>` (published).

---

## 11. Migration Strategy

| Phase | Scope | Breaking? |
|-------|-------|-----------|
| **0** | Backend refactoring: ESM, Express 5, layered arch, deps upgrade, keep old routes as aliases | No |
| **1** | Admin role migration: schema + JWT + RBAC middleware | No (backward compat) |
| **2** | New models + APIs: Task, AudioDraft, Theme, ActivityLog under `/api/v1/` | No (additive) |
| **3** | Frontend rewrite: React 19, RR7, Mantine 7, TanStack Query, functional components | No (new pages) |
| **4** | Cleanup: remove old route aliases, remove `isSuperAdmin` | Yes (planned) |

---

## 12. Environment Variables

```env
# Database
DB_CONNECTION=mongodb://localhost:27017
MONGODB_USERNAME=root
MONGODB_PASSWORD=mypass
MONGODB_DB_NAME=samwaktou

# Auth
ADMIN_TOKEN_SECRET=<min-32-chars>
USER_TOKEN_SECRET=<min-32-chars>

# S3
S3_ACCESS_KEY=, S3_SECRET_ACCESS_KEY=, S3_ACCESS_POINT_ARN=
S3_HOST=http://localhost:9000  # Dev only (MinIO)
S3_REGION=us-east-2

# Server
PORT=8080
PROFILE=dev
LOG_LEVEL=info

# CORS
APP_HOST=http://localhost:3000
APP_LOAD_BALANCER_HOST=
APP_CORS_EXTRA_WHITLISTS=

# Root Admin Seed
ROOT_ADMIN_EMAIL=admin@example.com
ROOT_ADMIN_PASSWORD=<password>
ROOT_ADMIN_SURNAME=Super
ROOT_ADMIN_NAME=Admin
```

All validated at startup with Zod. Missing/invalid = server fails fast with clear error.

---

## 13. Error Handling Strategy

### 13.1 Custom Error Classes

`AppError(message, statusCode, reason?, details?)` → base class.
Subclasses: `ValidationError` (400), `AuthorizationError` (403), `NotFoundError` (404), `ConflictError` (409).

### 13.2 Global Handler

Express 5 auto-forwards rejected promises. Handler checks `instanceof AppError` for structured response, falls back to 500 for unexpected errors. All errors logged via Pino.

### 13.3 Controller Pattern (no try/catch)

```typescript
async createTask(req, res) {
  const task = await this.taskService.createTask(req.body, req.files, req.user);
  res.status(201).json({ success: true, data: task });
}
// If service throws → Express 5 catches → error handler responds
```

---

## 14. Testing Strategy

### 14.1 Tools

`vitest` (runner), `supertest` (HTTP), `mongodb-memory-server` (in-memory DB), `@testing-library/react` (components).

### 14.2 Structure

```
backend/api/tests/
├── unit/services/task.service.test.ts, theme.service.test.ts, ...
├── unit/middleware/rbac.middleware.test.ts, auth.middleware.test.ts
├── integration/task.api.test.ts, admin.api.test.ts, theme.api.test.ts
└── helpers/db.helper.ts, auth.helper.ts
```

### 14.3 Key Scenarios

- **State machine**: All valid transitions succeed, invalid throw ConflictError
- **Four-eyes**: Enforced for Reviewers, exempt for Publishers/SysAdmins
- **RBAC**: Each role tested against endpoints
- **Themes**: Contributor → unvalidated, Reviewer → validated, duplicates rejected
- **Publish/Unpublish**: Audio docs + S3 files created/deleted correctly

---

## 15. Implementation Phases

### Phase 0 — Backend Refactoring (no new features)
1. Upgrade Node.js 22, Express 5, TypeScript 5.8, Mongoose 8
2. Switch to ESM (`"type": "module"`, NodeNext)
3. Add Zod 4 env validation, replace Joi + manual validators
4. Restructure into layered architecture (services, repositories with interfaces, controllers)
5. Replace `body-parser`, `jsonwebtoken` → `jose`, `moment` → `date-fns`
6. Add Pino logging, centralized error handler
7. Add API versioning (`/api/v1/`), keep old routes as aliases
8. Connect DB once at startup
9. Enable `strictNullChecks: true`

### Phase 1 — Admin Role System
1. Update Admin schema: `isSuperAdmin` → `role: AdminRole`
2. Run migration script
3. Update JWT payload, implement RBAC middleware
4. Update all routes to use new middleware

### Phase 2 — Task & AudioDraft Backend
1. Create Task, AudioDraft, Theme, ActivityLog models + repository interfaces + Mongoose impls
2. Implement TaskService (full state machine), ThemeService
3. Update StorageService with `copyFile` and draft key convention
4. Implement all new API endpoints
5. Implement publish/unpublish logic
6. Seed themes from existing audio data

### Phase 3 — Frontend Rewrite
1. Upgrade React 19, React Router 7, Mantine 7, Vite 6, add TanStack Query
2. Replace `moment` → `date-fns`, `lodash` → native/lodash-es
3. Set up AuthContext, API client with interceptors
4. Migrate Login, existing pages to functional components
5. Build AdminLayout (sidebar, topbar)
6. Build TaskListPage, TaskDetailPage, AudioDraftWorkPage, TaskCreatePage
7. Build ThemeManagementPage, AdminManagementPage
8. Implement React 19 Actions, useOptimistic for status changes

### Phase 4 — Polish & Cleanup ✅
1. ✅ Remove backward-compatible route aliases (`/admin`, `/audio`, `/user`, `/analytic`)
2. ✅ Remove `isSuperAdmin` from entire codebase — deleted legacy `model/`, `controller/`, old `routes/*.router.ts`, and old frontend `src/js/`
3. ✅ Write tests (vitest + supertest) — 45 tests across 3 suites:
   - `AdminService` unit tests (19 tests): CRUD, password, login, JWT round-trip
   - Auth middleware unit tests (8 tests): token verification, RBAC `requireRole`
   - Admin API integration tests (18 tests): full HTTP pipeline via supertest
4. ✅ Final QA — zero TypeScript errors on both backend and frontend

---

*This document provides the technical blueprint for implementing the collaborative task workflow. For the functional requirements, see [Functional Documentation](./FUNCTIONAL.md).*
