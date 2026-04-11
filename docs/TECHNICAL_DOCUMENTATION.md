# Laajal Sa Diine — Technical Documentation

> **Repository:** `samwaktou`
> **Live URL:** [https://www.laajalsadiine.com](https://www.laajalsadiine.com)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Backend API](#4-backend-api)
   - 4.1 [Overview](#41-overview)
   - 4.2 [Entry Point & Middleware](#42-entry-point--middleware)
   - 4.3 [API Routes](#43-api-routes)
   - 4.4 [Layered Architecture](#44-layered-architecture)
   - 4.5 [Authentication & Authorization](#45-authentication--authorization)
   - 4.6 [Audio File Handling & Storage](#46-audio-file-handling--storage)
   - 4.7 [Audio Streaming](#47-audio-streaming)
   - 4.8 [Validation](#48-validation)
   - 4.9 [Configuration](#49-configuration)
5. [Frontend Web Application](#5-frontend-web-application)
   - 5.1 [Overview](#51-overview)
   - 5.2 [Routing](#52-routing)
   - 5.3 [Component Architecture](#53-component-architecture)
   - 5.4 [HTTP Communication](#54-http-communication)
   - 5.5 [Analytics](#55-analytics)
   - 5.6 [Environment Configuration](#56-environment-configuration)
6. [Database](#6-database)
   - 6.1 [MongoDB Collections](#61-mongodb-collections)
   - 6.2 [Schemas](#62-schemas)
   - 6.3 [Indexes](#63-indexes)
   - 6.4 [Database Access Layer](#64-database-access-layer)
7. [Infrastructure & Deployment](#7-infrastructure--deployment)
   - 7.1 [Docker Setup](#71-docker-setup)
   - 7.2 [Environments](#72-environments)
   - 7.3 [Database Backup](#73-database-backup)
8. [Environment Variables](#8-environment-variables)
9. [Development Setup](#9-development-setup)
10. [API Reference](#10-api-reference)

---

## 1. Architecture Overview

The project follows a **client-server architecture** with a clear separation between the frontend and backend, connected through a REST API.

```
┌──────────────────────┐         HTTP / REST          ┌──────────────────────┐
│                      │  ◄──────────────────────────► │                      │
│   Frontend (React)   │                               │  Backend (Express)   │
│   Vite + TypeScript  │                               │  Node.js + TypeScript│
│   Port: 3000         │                               │  Port: 8080          │
│                      │                               │                      │
└──────────────────────┘                               └──────────┬───────────┘
                                                                  │
                                                    ┌─────────────┴─────────────┐
                                                    │                           │
                                              ┌─────▼─────┐             ┌───────▼───────┐
                                              │  MongoDB   │             │  Amazon S3    │
                                              │ (Metadata) │             │ (Audio Files) │
                                              └────────────┘             └───────────────┘
```

**Key design decisions:**

- **REST API backend** — Designed to serve multiple clients (web app now, mobile app in the future)
- **Separate frontend/backend** — Independent deployment and scaling
- **Cloud file storage (S3)** — Audio files are stored in Amazon S3, keeping the application server stateless
- **MongoDB** — Document database for flexible schema and full-text search capabilities

---

## 2. Tech Stack

### Backend

| Technology      | Version | Purpose                                  |
|-----------------|---------|------------------------------------------|
| Node.js         | 20      | Runtime environment                      |
| Express.js      | 4.19    | HTTP server framework                    |
| TypeScript      | 5.4     | Type-safe JavaScript                     |
| Mongoose        | 8.3     | MongoDB ODM                              |
| AWS SDK (S3)    | 3.583   | Audio file storage in Amazon S3          |
| JSON Web Token  | 9.0     | Authentication tokens                    |
| bcryptjs        | 2.4     | Password hashing                         |
| Joi (@hapi/joi) | 17.1    | Request validation                       |
| Archiver        | 7.0     | ZIP archive creation for backups         |
| Moment.js       | 2.30    | Date manipulation                        |
| Lodash          | 4.17    | Utility functions                        |

### Frontend

| Technology         | Version | Purpose                                |
|--------------------|---------|----------------------------------------|
| React              | 18.3    | UI framework                           |
| TypeScript         | 5.4     | Type-safe JavaScript                   |
| Vite               | 5.2     | Build tool and dev server              |
| React Router DOM   | 6.23    | Client-side routing                    |
| Material UI (MUI)  | 5.15    | UI component library                   |
| MUI X Date Pickers | 6.20    | Date picker components                 |
| React Player       | 2.16    | Audio playback                         |
| Moment.js          | 2.30    | Date manipulation                      |
| js-file-download   | 0.4     | Client-side file download              |

### Infrastructure

| Technology     | Purpose                                |
|----------------|----------------------------------------|
| Docker         | Containerization                       |
| Docker Compose | Multi-container orchestration          |
| MongoDB        | Document database                      |
| Amazon S3      | Audio file storage                     |
| MinIO          | S3-compatible local storage (dev only) |
| Mongo Express  | Database admin UI (dev only)           |

---

## 3. Project Structure

```
samwaktou/
├── backend/
│   └── api/
│       ├── src/
│       │   ├── config/              # Server configuration constants
│       │   │   └── server.config.ts
│       │   ├── controller/          # Request handlers (business logic)
│       │   │   ├── admin.controller.ts
│       │   │   ├── analytic.controller.ts
│       │   │   ├── audio.controller.ts
│       │   │   ├── user.controller.ts
│       │   │   └── utils/           # Controller utilities
│       │   │       ├── common.ts
│       │   │       ├── verify-token.ts
│       │   │       ├── admin/       # Admin-specific validators
│       │   │       ├── audio/       # Audio file handling & validators
│       │   │       └── user/        # User-specific validators
│       │   ├── model/               # Data models and DB interaction
│       │   │   ├── admin.model.ts
│       │   │   ├── analytic.model.ts
│       │   │   ├── audio.model.ts
│       │   │   ├── user.model.ts
│       │   │   ├── db-connection.ts # MongoDB connection handler
│       │   │   ├── db-crud.ts       # Generic CRUD operations
│       │   │   └── schema/          # Mongoose schemas
│       │   │       ├── admin.schema.ts
│       │   │       ├── analytic.schema.ts
│       │   │       ├── audio.schema.ts
│       │   │       └── user.schema.ts
│       │   ├── routes/              # Express route definitions
│       │   │   ├── admin.router.ts
│       │   │   ├── analytic.router.ts
│       │   │   ├── audio.router.ts
│       │   │   └── user.router.ts
│       │   └── server.ts           # Application entry point
│       ├── Dockerfile
│       ├── .env.sample
│       ├── package.json
│       └── tsconfig.json
│
├── frontend/
│   └── samwaktou-react-app/
│       ├── src/
│       │   ├── js/
│       │   │   ├── app-provider.component.tsx    # Route providers
│       │   │   ├── app-body.component.tsx         # Main layout
│       │   │   ├── serach-bar.component.tsx        # Search bar
│       │   │   ├── advance-search.component.tsx    # Advanced search popup
│       │   │   ├── audio-creator.component.tsx     # Audio upload form (admin)
│       │   │   ├── login.component.tsx             # Admin login page
│       │   │   ├── popup-view.component.tsx        # Audio info popup
│       │   │   ├── options-bar.component.tsx        # Options bar
│       │   │   ├── snack-bar.component.tsx          # Notification bar
│       │   │   ├── message.component.tsx            # Error/info messages
│       │   │   ├── audioCardComponents/            # Audio card UI
│       │   │   │   ├── audios-cards-container.component.tsx
│       │   │   │   ├── audio-card.component.tsx
│       │   │   │   ├── audio-player-card.component.tsx
│       │   │   │   ├── card-header.component.tsx
│       │   │   │   ├── card-body.component.tsx
│       │   │   │   ├── card-bottom.component.tsx
│       │   │   │   └── card-bottom-admin.component.tsx
│       │   │   ├── common/                         # Shared utilities
│       │   │   │   ├── http-request-handler.ts
│       │   │   │   ├── analytic-handler.ts
│       │   │   │   └── utils/
│       │   │   └── model/                          # Frontend data models
│       │   │       ├── admin.model.ts
│       │   │       ├── audio.model.ts
│       │   │       └── type-definition/
│       │   ├── style/                              # CSS stylesheets
│       │   └── main.tsx                            # App entry point & router
│       ├── index.html
│       ├── Dockerfile
│       ├── vite.config.ts
│       ├── .env.development
│       └── package.json
│
├── infrastructure/
│   ├── database/
│   │   ├── mongo_create_indexes.js    # MongoDB index definitions
│   │   └── mongo_backup_script.sh     # Backup/restore commands
│   └── docker/
│       ├── docker-compose.yml             # Production compose
│       ├── docker-compose-dev.yml         # Development compose
│       └── docker-compose-pre_prod.yml    # Pre-production compose
│
├── docs/
│   ├── FUNCTIONAL_DOCUMENTATION.md
│   └── TECHNICAL_DOCUMENTATION.md
│
└── .gitignore
```

---

## 4. Backend API

### 4.1 Overview

The backend is a **Node.js / Express** REST API written in **TypeScript**. It follows a layered architecture pattern: **Routes → Controllers → Models → Database**.

- **Package name:** `laajalsadiine-backend-api`
- **Entry point:** `src/server.ts`
- **Default port:** `8080`
- **Build output:** `dist/` (compiled TypeScript → JavaScript)

### 4.2 Entry Point & Middleware

The server (`src/server.ts`) sets up the following middleware stack:

1. **body-parser** — Parses JSON request bodies
2. **express-fileupload** — Handles file uploads with a max size of 100 MB
3. **CORS** — Configured with a whitelist of allowed origins (defined via environment variables)

CORS is configured to accept requests from:
- `APP_HOST` — Primary frontend host
- `APP_LOAD_BALANCER_HOST` — Load balancer host
- `APP_CORS_EXTRA_WHITLISTS` — Additional allowed hosts (space-separated)

### 4.3 API Routes

The API exposes four route groups:

| Base Path      | Router File          | Description                     |
|----------------|---------------------|---------------------------------|
| `/audios`      | `audio.router.ts`   | Audio content CRUD & streaming  |
| `/admins`      | `admin.router.ts`   | Admin management & login        |
| `/users`       | `user.router.ts`    | User management & login         |
| `/analytics`   | `analytic.router.ts`| Usage analytics tracking        |

### 4.4 Layered Architecture

Each domain (audio, admin, user, analytic) follows the same layered pattern:

```
Route (*.router.ts)
  │   Defines HTTP endpoints, applies middleware (e.g., auth)
  ▼
Controller (*.controller.ts)
  │   Contains business logic, validates requests, orchestrates operations
  ▼
Model (*.model.ts)
  │   Data objects with DB operations (save, update, delete, find)
  ▼
Schema (schema/*.schema.ts) + DB CRUD (db-crud.ts)
      Mongoose schema definitions and generic database operations
```

**Model classes** (e.g., `Audio`, `Admin`, `User`) are not just data containers — they encapsulate database operations:
- `saveToDB()` — Persist to MongoDB
- `updateToDB()` — Update in MongoDB
- `deleteFromDB()` — Delete from MongoDB
- Static finder methods (e.g., `findOneAudioFromDBById()`, `findAudiosFromDB()`)

### 4.5 Authentication & Authorization

Authentication uses **JSON Web Tokens (JWT)** with the following flow:

```
1. User/Admin sends credentials  ──►  POST /admins/login  or  POST /users/login
2. Server validates credentials  ──►  Returns JWT token
3. Client includes token in header ──►  auth-token: <JWT>
4. Server validates token via middleware ──►  Grants or denies access
```

**Token details:**
- **Duration:** 24 hours per token
- **Token refresh:** On each authenticated request, a new token is issued in the response `auth-token` header
- **Separate secrets:** Admin and user tokens use different secrets (`ADMIN_TOKEN_SECRET` and `USER_TOKEN_SECRET`)

**Admin JWT payload:**
```typescript
{ id: string, isSuperAdmin: boolean }
```

**User JWT payload:**
```typescript
{ id: string, username: string }
```

**Authorization middleware:**

| Middleware                  | Purpose                                           |
|---------------------------|---------------------------------------------------|
| `verifyAdminToken`         | Validates admin JWT, rejects if invalid           |
| `verifyUserToken`          | Validates user JWT, rejects if invalid            |
| `verifyTokenForDeleteUser` | Accepts either admin or user token (for user deletion) |

**Role-based access in routes:**
- **Super Admin only:** Creating admins, deleting admins
- **Super Admin or self:** Updating an admin's own profile
- **Any Admin:** CRUD operations on audio content
- **Public:** Reading/streaming audio, browsing, searching

**Root Admin:**
A special root admin is defined entirely through environment variables and always exists in the system. It cannot be deleted and is always a super admin. This ensures there is always at least one admin who can access the system.

### 4.6 Audio File Handling & Storage

Audio files are stored in **Amazon S3** (or MinIO for local development):

```
Upload flow:
1. Admin sends POST /audios with audio file + metadata
2. Metadata is saved to MongoDB first
3. Audio file is uploaded to S3 with name: <audioId>.<extension>
4. The S3 URI is saved back to the audio document
5. If S3 upload fails, the MongoDB entry is rolled back (deleted)
```

**S3 Configuration** (via environment variables):
- `S3_ACCESS_KEY` — AWS access key
- `S3_SECRET_ACCESS_KEY` — AWS secret key
- `S3_ACCESS_POINT_ARN` — S3 access point ARN (bucket identifier)
- `S3_HOST` — Custom S3 host (for MinIO in development)

**File operations:**
- `uploadAudioFileInternal()` — Uploads audio to S3
- `getAudioFileInternal()` — Retrieves audio byte range from S3
- `getAudioFileMetadataInternal()` — Gets file metadata (size, etc.)
- `removeAudioFileInternal()` — Deletes audio from S3
- `downloadAudioFileInternal()` — Downloads complete audio as stream
- `downloadAudioBucket()` — Downloads all audios as ZIP archive

### 4.7 Audio Streaming

Audio is served using **HTTP range requests** (partial content / byte-range streaming):

```
Client requests:  GET /audios/file/<fileName>
                  Range: bytes=0-499999

Server responds:  HTTP 206 Partial Content
                  Content-Range: bytes 0-499999/1234567
                  Content-Type: audio/mpeg
                  [500KB chunk of audio data]
```

- **Chunk size:** ~500 KB per request
- This enables efficient streaming without loading entire files into memory
- The browser's audio element handles range requests automatically for seeking

### 4.8 Validation

Request validation is implemented using **@hapi/joi** with dedicated validator utilities:

- `audio-request-validator.ts` — Validates audio creation and update requests
- `admin/` — Admin-specific validators
- `user/` — User-specific validators

Validation rules are defined in `server.config.ts`:

| Entity  | Field         | Min Length | Max Length |
|---------|---------------|-----------|-----------|
| Audio   | description   | 10        | 500       |
| Audio   | keywords      | 10        | 500       |
| Audio   | theme         | 2         | 30        |
| Audio   | author        | 1         | 30        |
| Admin   | surname       | 1         | 255       |
| Admin   | name          | 1         | 255       |
| Admin   | email         | 1         | 255       |
| Admin   | password      | 5         | 1024      |
| User    | username      | 1         | 255       |
| User    | tel           | 5         | 20        |
| User    | email         | 1         | 255       |

### 4.9 Configuration

All configuration constants are centralized in `src/config/server.config.ts`:

- **Server settings** — Port (8080)
- **HTTP status codes** — Reusable constants
- **File parameters** — Max upload size (100 MB)
- **Pagination defaults** — Default skip (0), default limit (20 for audios, 10 for admins/users), max limit (100)
- **Validation rules** — Min/max character lengths per field
- **Date format** — `DD-MM-YYYY`

---

## 5. Frontend Web Application

### 5.1 Overview

The frontend is a **React 18** single-page application built with **TypeScript** and **Vite**.

- **Package name:** `laajalsadiine-web-app`
- **Build tool:** Vite 5.2
- **UI library:** Material UI (MUI) 5
- **Dev server port:** 3000
- **Production serving:** Static files served via `serve` (in Docker)

### 5.2 Routing

Routing is handled by **React Router v6** with the following routes:

| Path                          | Component               | Description                              |
|-------------------------------|-------------------------|------------------------------------------|
| `/`                           | `UserAppProvider`       | Main public page — audio browsing        |
| `/login`                      | `AdminLoginProvider`    | Admin login page                         |
| `/admin`                      | `AdminAppProvider`      | Admin view — same as public but with admin controls |
| `/create`                     | `AudioCreatorProvider`  | Audio creation/editing form (admin only) |
| `/audio?id=<audioId>`         | `AudioLinkHandlerProvider` | Deep link to a specific audio         |
| `*` (catch-all)               | `UserAppProvider`       | Fallback to main page                   |

Route paths are configured via environment variables (`VITE_LOGIN_PATH`, `VITE_ADMIN_PATH`, etc.).

### 5.3 Component Architecture

Components are organized by feature with a class-based React pattern:

```
main.tsx (Router setup)
  │
  ├── UserAppProvider ──────► AppBody (main layout)
  │                              ├── SearchBar
  │                              │     └── AdvanceSearch (popup)
  │                              └── AudiosCardsContainer
  │                                    ├── AudioCard (one per audio)
  │                                    │     ├── Header (theme + duration)
  │                                    │     ├── Body (description + download)
  │                                    │     ├── Bottom (author + date)
  │                                    │     └── CardBottomAdmin (edit/delete — admin only)
  │                                    ├── AudioPlayerCard (persistent player)
  │                                    └── PopupView (audio details modal)
  │
  ├── AdminLoginProvider ───► Login (email/password form)
  │
  ├── AudioCreatorProvider ─► AudioCreator (upload form)
  │
  └── AudioLinkHandlerProvider ► AppBody (single audio view)
```

**Key components:**

- **`AppBody`** — Main layout that assembles the search bar and audio cards. Handles navigation between user and admin views.
- **`AudiosCardsContainer`** — Manages the list of audio cards, fetching, infinite scrolling, search queries, audio playback, and admin actions (edit/delete).
- **`AudioCard`** — Individual audio card with metadata display. Loads audio metadata (duration) via a hidden `<audio>` element.
- **`AudioPlayerCard`** — Persistent audio player shown at the bottom when an audio is playing.
- **`SearchBar`** — Simple keyword search with an advanced search toggle.
- **`AdvanceSearch`** — Popup modal with filters for keywords, author, theme, and date range.
- **`AudioCreator`** — Form for admins to create or edit audio entries (file upload + metadata).
- **`Login`** — Admin login form (email + password).

### 5.4 HTTP Communication

All API calls go through a centralized HTTP handler (`common/http-request-handler.ts`):

```typescript
httpGet<T>(path, responseTransformer?, token?, contentType?)
httpPost<T>(path, data, token?, contentType?)
httpPut<T>(path, data, token?, contentType?)
httpDelete<T>(path, token?, contentType?)
```

**Key behaviors:**
- Base URL is configured via `VITE_API_SERVER_URL`
- Auth token is sent in the `auth-token` header
- FormData requests automatically omit `Content-Type` (browser sets multipart boundary)
- Error handling classifies errors into user-friendly French messages:
  - `TypeError` → Network error
  - `SyntaxError` → Invalid server data
  - `4xx` → Resource not found
  - `503` → Service unavailable
  - `5xx` → Internal server error

### 5.5 Analytics

Client-side analytics (`common/analytic-handler.ts`) tracks three events:

| Event Name              | Trigger                           |
|-------------------------|-----------------------------------|
| `PAGE_LOAD`             | On component mount (page load)    |
| `START_LISTENING_AUDIO` | When user clicks play on an audio |
| `AUDIO_DOWNLOADED`      | When user downloads an audio      |

An **anonymous client ID** (UUID v4) is generated and stored in `localStorage` on first visit. All events are sent via `POST /analytics` with the client ID, timestamp, and event name.

### 5.6 Environment Configuration

Frontend environment variables (prefixed with `VITE_`):

| Variable                  | Description                          |
|---------------------------|--------------------------------------|
| `VITE_API_SERVER_URL`     | Backend API base URL                 |
| `VITE_APP_URL`            | Frontend application URL             |
| `VITE_LOGIN_PATH`         | Path for admin login page            |
| `VITE_ADMIN_PATH`         | Path for admin view                  |
| `VITE_CREATE_AUDIO_PATH`  | Path for audio creation page         |
| `VITE_AUDIO_LINK_PATH`    | Path for shared audio links          |

---

## 6. Database

### 6.1 MongoDB Collections

| Collection   | Description                        | Used By         |
|-------------|-------------------------------------|-----------------|
| `audios`    | Audio content metadata              | `Audio` model   |
| `admins`    | Administrator accounts              | `Admin` model   |
| `users`     | Registered user accounts            | `User` model    |
| `analytics` | Usage tracking events               | `Analytic` model|

### 6.2 Schemas

#### Audios Collection

```javascript
{
  _id:         ObjectId,        // Auto-generated
  uri:         String,          // S3 file path (required)
  theme:       String,          // Topic category (required, 2-30 chars)
  author:      String,          // Teacher name (optional, default: "Inconnu")
  description: String,          // Content summary (required, 10-500 chars)
  keywords:    String,          // Search keywords (required, 10-500 chars)
  date:        Date             // Record/publish date (default: now)
}
```

#### Admins Collection

```javascript
{
  _id:          ObjectId,       // Auto-generated
  surname:      String,         // First name (required)
  name:         String,         // Last name (required)
  email:        String,         // Login email (required, unique)
  password:     String,         // Bcrypt-hashed password (required)
  date:         Date,           // Registration date (default: now)
  isSuperAdmin: Boolean         // Super admin flag (default: false)
}
```

#### Users Collection

```javascript
{
  _id:      ObjectId,           // Auto-generated
  username: String,             // Display name (required)
  tel:      String,             // Phone number (required)
  email:    String,             // Email (optional)
  date:     Date                // Registration date (default: now)
}
```

#### Analytics Collection

```javascript
{
  _id:       ObjectId,          // Auto-generated
  clientId:  String,            // Anonymous browser UUID (required)
  date:      Date,              // Event timestamp
  eventName: String             // Event type: PAGE_LOAD | START_LISTENING_AUDIO | AUDIO_DOWNLOADED
}
```

### 6.3 Indexes

MongoDB indexes are defined in `infrastructure/database/mongo_create_indexes.js`:

| Index Name          | Collection | Fields & Type                                          | Purpose                        |
|--------------------|------------|--------------------------------------------------------|--------------------------------|
| `text_search_index`| `audios`   | `keywords` (text, weight 5), `author` (text, weight 3), `theme` (text, weight 3), `description` (text, weight 2) | Full-text search (French language) |
| `date_index`       | `audios`   | `date` (descending)                                    | Sort by date performance       |
| `author_index`     | `audios`   | `author` (ascending)                                   | Author filter performance      |
| `theme_index`      | `audios`   | `theme` (ascending)                                    | Theme filter performance       |

The full-text search index uses **French language** configuration and **weighted scoring** — keywords match highest, then author/theme, then description.

### 6.4 Database Access Layer

All database operations go through a **generic CRUD module** (`db-crud.ts`) that provides:

| Method                    | Description                                        |
|---------------------------|----------------------------------------------------|
| `postToDB<T>(document)`   | Insert a new document                              |
| `deleteFromDB<T>(model, id)` | Delete a document by ID                        |
| `updateOne<T>(model, id, update)` | Update a document by ID                   |
| `findOne<T>(model, query)` | Find a single document                           |
| `findMany<T>(model, query, fields, sort, skip, limit)` | Paginated query |
| `getDistinctValuesForField<T>(model, field)` | Get distinct values     |
| `findLatestRecords<T>(model, query, fields, skip, limit)` | Latest records by date |

Each method **connects to MongoDB** before executing (via `db-connection.ts`), which uses the connection string and credentials from environment variables.

---

## 7. Infrastructure & Deployment

### 7.1 Docker Setup

Both the backend and frontend have **multi-stage Dockerfiles** optimized for production:

**Backend Dockerfile:**
1. **Build stage** — Installs all dependencies, compiles TypeScript
2. **Production stage** — Copies only compiled JS + production dependencies, copies `.env`, exposes port 8080

**Frontend Dockerfile:**
1. **Build stage** — Installs dependencies, builds Vite app
2. **Production stage** — Uses `serve` to host static files, exposes port 3000

### 7.2 Environments

Three Docker Compose configurations are provided:

#### Development (`docker-compose-dev.yml`)
Services: MongoDB + Mongo Express (DB UI) + MinIO (S3 mock)
- MongoDB on port `27017`
- Mongo Express on port `8081`
- MinIO on ports `9000` (API) and `9001` (Console)
- Persistent volume for MongoDB data

#### Pre-Production (`docker-compose-pre_prod.yml`)
Services: MongoDB + Mongo Express + Backend API + Frontend
- Builds backend and frontend from source
- Full stack in a single Docker network

#### Production (`docker-compose.yml`)
Services: Backend API + Frontend
- Uses pre-built Docker images
- Backend on port `8080`, Frontend on port `3000`
- External database (not included in compose — uses cloud MongoDB)

### 7.3 Database Backup

Backup and restore commands are documented in `infrastructure/database/mongo_backup_script.sh`:

```bash
# Dump (backup)
mongodump --host=<host> --port=<port> --username=<user> --password=<pass> \
  --collection=audios --db=fatwa --authenticationDatabase=admin --out=<output_dir>

# Restore
mongorestore --host=<host> --port=<port> --username=<user> --password=<pass> \
  --authenticationDatabase=admin <dump_dir>

# Export to JSON
mongoexport --host=<host> --port=<port> --username=<user> --password=<pass> \
  --collection=audios --db=fatwa --authenticationDatabase=admin --out=<file>.json

# Import from JSON
mongoimport --host=<host> --port=<port> --username=<user> --password=<pass> \
  --collection=audios --db=fatwa --authenticationDatabase=admin --file=<file>.json
```

Additionally, the API provides a **backup download endpoint** (`GET /audios/backup/download`) that allows super admins to download all audio files as a ZIP archive through the application.

---

## 8. Environment Variables

### Backend (`.env` / `.env.development`)

| Variable                    | Description                                              |
|-----------------------------|----------------------------------------------------------|
| `DB_CONNECTION`             | MongoDB connection string                                |
| `MONGODB_USERNAME`          | MongoDB username                                         |
| `MONGODB_PASSWORD`          | MongoDB password                                         |
| `MONGODB_DB_NAME`           | MongoDB database name                                    |
| `ADMIN_TOKEN_SECRET`        | Secret key for signing admin JWT tokens                  |
| `USER_TOKEN_SECRET`         | Secret key for signing user JWT tokens                   |
| `S3_ACCESS_KEY`             | AWS S3 access key                                        |
| `S3_SECRET_ACCESS_KEY`      | AWS S3 secret access key                                 |
| `S3_ACCESS_POINT_ARN`       | S3 access point ARN (bucket)                             |
| `S3_HOST`                   | Custom S3 host (for MinIO in dev only)                   |
| `ROOT_ADMIN_ID`             | Root super admin MongoDB ObjectId                        |
| `ROOT_ADMIN_SURNAME`        | Root super admin first name                              |
| `ROOT_ADMIN_NAME`           | Root super admin last name                               |
| `ROOT_ADMIN_EMAIL`          | Root super admin email (login)                           |
| `ROOT_ADMIN_PASSWORD`       | Root super admin hashed password                         |
| `ROOT_ADMIN_DATE`           | Root super admin creation date                           |
| `APP_HOST`                  | Allowed CORS origin (primary frontend)                   |
| `APP_LOAD_BALANCER_HOST`    | Allowed CORS origin (load balancer)                      |
| `APP_CORS_EXTRA_WHITLISTS`  | Additional CORS origins (space-separated)                |
| `PROFILE`                   | Application profile                                      |

### Frontend (`.env.development` / `.env.production`)

| Variable                    | Description                                              |
|-----------------------------|----------------------------------------------------------|
| `VITE_API_SERVER_URL`       | Backend API base URL (e.g., `http://localhost:8080`)     |
| `VITE_APP_URL`              | Frontend base URL (e.g., `http://localhost:3000`)        |
| `VITE_LOGIN_PATH`           | Login page route (e.g., `/login`)                        |
| `VITE_ADMIN_PATH`           | Admin page route (e.g., `/admin`)                        |
| `VITE_CREATE_AUDIO_PATH`    | Audio creation page route (e.g., `/create`)              |
| `VITE_AUDIO_LINK_PATH`      | Audio deep link route (e.g., `/audio`)                   |

---

## 9. Development Setup

### Prerequisites

- **Node.js** 20+
- **Docker** and **Docker Compose**
- **npm**

### Start Development Infrastructure

```bash
# Start MongoDB, Mongo Express, and MinIO
cd infrastructure/docker
docker-compose -f docker-compose-dev.yml up -d
```

This provides:
- MongoDB at `localhost:27017`
- Mongo Express (DB admin UI) at `localhost:8081`
- MinIO (S3 mock) at `localhost:9000` (API) / `localhost:9001` (console)

### Create MongoDB Indexes

Connect to MongoDB and run the index creation script:

```bash
# Using mongosh
mongosh --host localhost --port 27017 -u root -p mypass --authenticationDatabase admin
use fatwa
load("infrastructure/database/mongo_create_indexes.js")
```

### Start Backend

```bash
cd backend/api

# Copy and configure environment variables
cp .env.sample .env.development
# Edit .env.development with your values

# Install dependencies
npm install

# Start in development mode (with hot reload)
npm run dev
```

The backend will start on `http://localhost:8080`.

### Start Frontend

```bash
cd frontend/samwaktou-react-app

# Install dependencies
npm install

# Start development server
npm start
```

The frontend will start on `http://localhost:3000`.

### Build for Production

```bash
# Backend
cd backend/api
npm run tsc                    # Compile TypeScript
npm run start-production       # Run production build

# Frontend
cd frontend/samwaktou-react-app
npm run build                  # Production build
npm run build-for-testing      # Development build (with dev env vars)
```

### Docker Build & Run

```bash
# Full stack with pre-production compose
cd infrastructure/docker
docker-compose -f docker-compose-pre_prod.yml up --build
```

---

## 10. API Reference

### Audio Endpoints

| Method   | Endpoint                         | Auth     | Description                                     |
|----------|----------------------------------|----------|-------------------------------------------------|
| `GET`    | `/audios`                        | Public   | List audios with pagination and filters          |
| `GET`    | `/audios/:audioId`               | Public   | Get a single audio by ID                         |
| `GET`    | `/audios/file/:fileName`         | Public   | Stream audio file (supports range requests)      |
| `GET`    | `/audios/download/:fileName`     | Public   | Download audio file                              |
| `GET`    | `/audios/extra/theme`            | Public   | Get all distinct theme values                    |
| `GET`    | `/audios/extra/author`           | Public   | Get all distinct author values                   |
| `GET`    | `/audios/backup/download`        | Admin    | Download all audios as ZIP (super admin)         |
| `GET`    | `/audios/check/healthy`          | Public   | Health check endpoint                            |
| `POST`   | `/audios`                        | Admin    | Create a new audio (file upload + metadata)      |
| `PUT`    | `/audios/:audioId`               | Admin    | Update audio metadata                            |
| `DELETE` | `/audios/:audioId`               | Admin    | Delete an audio (file + metadata)                |

**Query parameters for `GET /audios`:**

| Parameter  | Type    | Description                              |
|-----------|---------|------------------------------------------|
| `skip`    | number  | Number of records to skip (default: 0)   |
| `limit`   | number  | Max records to return (default: 20, max: 100) |
| `keywords`| string  | Full-text search query                   |
| `theme`   | string  | Filter by theme (exact match)            |
| `author`  | string  | Filter by author (exact match)           |
| `minDate` | string  | Filter by minimum date (DD-MM-YYYY)      |
| `maxDate` | string  | Filter by maximum date (DD-MM-YYYY)      |

### Admin Endpoints

| Method   | Endpoint                         | Auth          | Description                              |
|----------|----------------------------------|---------------|------------------------------------------|
| `POST`   | `/admins/login`                  | Public        | Admin login (returns JWT)                |
| `GET`    | `/admins`                        | Admin         | List admins with filters                 |
| `GET`    | `/admins/:adminId`               | Admin         | Get admin by ID                          |
| `POST`   | `/admins`                        | Super Admin   | Create a new admin                       |
| `PUT`    | `/admins/:adminId`               | Super Admin or Self | Update admin info                  |
| `PUT`    | `/admins/password/:adminId`      | Admin         | Change admin password                    |
| `DELETE` | `/admins/:adminId`               | Super Admin   | Delete an admin                          |

### User Endpoints

| Method   | Endpoint                         | Auth          | Description                              |
|----------|----------------------------------|---------------|------------------------------------------|
| `POST`   | `/users/login`                   | Public        | User login (returns JWT)                 |
| `GET`    | `/users`                         | Admin         | List users with filters                  |
| `GET`    | `/users/:userId`                 | Public        | Get user by ID                           |
| `POST`   | `/users`                         | Public        | Register a new user                      |
| `PUT`    | `/users/:userId`                 | User (self)   | Update user info                         |
| `DELETE` | `/users/:userId`                 | User or Admin | Delete a user                            |

### Analytics Endpoints

| Method   | Endpoint                         | Auth     | Description                              |
|----------|----------------------------------|----------|------------------------------------------|
| `POST`   | `/analytics`                     | Public   | Record an analytics event                |

**Analytics event body:**
```json
{
  "clientId": "uuid-v4-string",
  "date": "2024-11-03T12:00:00Z",
  "eventName": "PAGE_LOAD | START_LISTENING_AUDIO | AUDIO_DOWNLOADED"
}
```

---

*This documentation describes the technical architecture and design of the Laajal Sa Diine project. For a non-technical overview of the project's purpose and features, please refer to the [Functional Documentation](./FUNCTIONAL_DOCUMENTATION.md).*
