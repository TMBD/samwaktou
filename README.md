# Laajal Sa Diine

> An Islamic Q&A audio library — short audio recordings where people ask questions about Islam and a knowledgeable teacher answers.

🌐 **Live:** [https://www.laajalsadiine.com](https://www.laajalsadiine.com)

---

## About

**Laajal Sa Diine** is a web application that hosts a collection of short Islamic religious audio content in a question-and-answer format. The recordings cover practical daily-life topics such as prayer, fasting, marriage, behavior, zakat, and more. Each audio is typically a few seconds to 5 minutes long.

The platform allows anyone to **browse, search, listen to, and download** audio content — no account required. Administrators can manage the content library through a dedicated admin interface.

## Features

- 🎧 **Browse & listen** — Grid of audio cards with theme, author, description, and duration
- 🔍 **Search** — Keyword search and advanced filters (author, theme, date range)
- ⬇️ **Download** — Download any audio as MP3
- 🔗 **Share** — Shareable deep links to individual audios
- 📜 **Infinite scroll** — Audios load automatically as you scroll
- 🔐 **Admin panel** — Create, edit, and delete audio content (login required)
- 📊 **Analytics** — Anonymous tracking of page loads, plays, and downloads

## Tech Stack

| Layer          | Technology                                      |
|----------------|--------------------------------------------------|
| **Frontend**   | React 18, TypeScript, Vite, Material UI          |
| **Backend**    | Node.js, Express, TypeScript                     |
| **Database**   | MongoDB (Mongoose ODM)                           |
| **Storage**    | Amazon S3 (audio files)                          |
| **Auth**       | JSON Web Tokens (JWT)                            |
| **Infra**      | Docker, Docker Compose                           |

## Project Structure

```
samwaktou/
├── backend/api/          # Express REST API (Node.js + TypeScript)
├── frontend/             # React web application (Vite + TypeScript)
│   └── samwaktou-react-app/
├── infrastructure/
│   ├── database/         # MongoDB index & backup scripts
│   └── docker/           # Docker Compose files (dev, pre-prod, prod)
└── docs/                 # Project documentation
```

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Docker](https://www.docker.com/) & Docker Compose
- npm

### 1. Start development infrastructure

```bash
cd infrastructure/docker
docker-compose -f docker-compose-dev.yml up -d
```

This starts **MongoDB** (port 27017), **Mongo Express** (port 8081), and **MinIO** — an S3-compatible local storage (ports 9000/9001).

### 2. Create MongoDB indexes

```bash
mongosh --host localhost --port 27017 -u root -p mypass --authenticationDatabase admin
```
```javascript
use fatwa
load("infrastructure/database/mongo_create_indexes.js")
```

### 3. Start the backend

```bash
cd backend/api
cp .env.sample .env.development   # Configure your environment variables
npm install
npm run dev
```

API will be available at `http://localhost:8080`.

### 4. Start the frontend

```bash
cd frontend/samwaktou-react-app
npm install
npm start
```

App will be available at `http://localhost:3000`.

## Documentation

| Document | Description |
|----------|-------------|
| [Functional Documentation](docs/FUNCTIONAL_DOCUMENTATION.md) | Business overview — what the app does, who it's for, features, and user roles |
| [Technical Documentation](docs/TECHNICAL_DOCUMENTATION.md) | Architecture, code structure, API reference, database schemas, and deployment |

## Author

**Thierno DIALLO**

## License

ISC
