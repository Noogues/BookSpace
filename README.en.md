# BookSpace

Reading tracker for books and web novels. Manage your library with chapters, ratings, tags and covers, and import data from Excel files.

[Versión en español](README.md)

## Features

- **Library**: create, edit and organize books with name, alternative name, link, current chapter, status and rating.
- **Chapters**: add chapters in bulk and advance a book's progress.
- **Tags**: organize books by tags and filter the library.
- **Covers**: upload cover images or use a URL.
- **Excel import**: add many books at once from a `.xlsx` file.
- **Dark mode**: light/dark theme following system preference.
- **Internationalization**: interface in Spanish and English.
- **Docker**: full deployment with a single command.

## Stack

| Layer | Technology |
|---|---|
| Backend | Node.js 24, TypeScript (ESM), Fastify 5, Prisma 7 + PostgreSQL, Zod, ExcelJS, Sharp |
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS v4, react-router-dom 7, i18next, Axios |
| Infra | Docker Compose, GitHub Actions (CI: lint + typecheck + build) |

## Structure

```
backend/            REST API (Fastify + Prisma)
frontend/           Web app (React + Vite)
data/covers/        Covers served under /covers
docker-compose.yml  Production stack (port 8080)
docker-compose.override.yml  Development stack (hot reload)
```

## Requirements

- Docker and Docker Compose (for containerized deployment).
- Node.js 24+ and PostgreSQL (for local development without Docker).

## Quick start

### With Docker

1. Copy and fill in the environment variables:

   ```bash
   cp .env.example .env
   ```

2. Start the stack:

   ```bash
   docker compose up -d
   ```

3. Open the app at [http://localhost:8080](http://localhost:8080).

In development, `docker-compose.override.yml` is applied automatically: it exposes the backend on port 3000 and the frontend (with live reload) on port 5173.

### Local development

Backend:

```bash
cd backend
npm install
cp .env.example .env   # DATABASE_URL points to your local PostgreSQL
npm run prisma:generate
npm run migrate:dev
npm run dev            # http://localhost:3000
```

Frontend (Vite proxies `/api` and `/covers` to `http://backend:3000`):

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```

## Commands

### Backend

| Command | Description |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run start` | Run server |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run migrate:deploy` | Apply migrations in production |
| `npm run migrate:dev` | Create/apply migrations in development |
| `npm run prisma:generate` | Regenerate the Prisma client |

### Frontend

| Command | Description |
|---|---|
| `npm run dev` | Development server (port 5173) |
| `npm run build` | `tsc -b && vite build` |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc -b` |
| `npm run preview` | Preview the production build |

## Environment variables

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection | `postgresql://books:books@localhost:5433/bookspace` |
| `PORT` | Backend port | `3000` |
| `COVERS_DIR` | Covers directory | `../../data/covers` |

## API

```
GET    /api/health          Health check
GET    /api/books           List/pagination/filters (name, status, tag, page, pageSize)
GET    /api/books/:id       Book by id
POST   /api/books           Create book
PATCH  /api/books/:id       Update book
DELETE /api/books/:id       Delete book (204)
POST   /api/books/import    Import books from Excel (multipart)
GET    /api/tags            List tags with book counts
POST   /api/tags            Create/upsert tag
DELETE /api/tags/:id        Delete tag
POST   /api/covers          Upload cover (multipart)
GET    /covers/*            Static cover files
```

`POST /api/books/import` returns 201 (all ok), 207 (partial import) or 400 (no valid books).

## CI

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs lint, typecheck and build for both backend and frontend on pushes and pull requests to `main`.