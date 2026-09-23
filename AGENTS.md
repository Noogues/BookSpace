# AGENTS.md

Guía para agentes de IA que trabajen en el proyecto BookSpace.

## Resumen del proyecto

BookSpace es una aplicación full-stack para el seguimiento de lectura de libros/novelas web. Permite gestionar libros con capítulos, valoraciones, etiquetas y portadas, además de importar datos desde archivos Excel.

- **Backend**: Node.js + TypeScript (ESM), Fastify 5, Prisma 7 + PostgreSQL, Zod, ExcelJS.
- **Frontend**: React 19 + TypeScript, Vite 8, Tailwind CSS v4, react-router-dom 7, i18next, Axios.
- **Infra**: Docker Compose (Postgres + backend + frontend), CI con GitHub Actions.

No hay tests en el proyecto. La validación de calidad es `lint` + `typecheck`, más `build` en el frontend.

## Comandos comunes

### Backend (`backend/`)

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con hot reload (tsx watch) |
| `npm run start` | Ejecutar servidor (tsx) |
| `npm run build` | Compilar TypeScript a JS |
| `npm run lint` | ESLint en todo el proyecto |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run migrate:deploy` | Aplicar migraciones en producción |
| `npm run migrate:dev` | Crear/aplicar migraciones en desarrollo |
| `npm run prisma:generate` | Regenerar el cliente Prisma |

### Frontend (`frontend/`)

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo Vite (puerto 5173) |
| `npm run build` | `tsc -b && vite build` |
| `npm run lint` | ESLint en todo el proyecto |
| `npm run typecheck` | `tsc -b` (sin emitir) |
| `npm run preview` | Previsualizar build de producción |

Después de cualquier cambio, ejecutar `lint` y `typecheck` en la parte afectada (backend y/o frontend).

## Arquitectura

### Backend (`backend/`)

- **Entrada**: `src/server.ts` — instancia de Fastify, CORS abierto, multipart, estáticos en `/covers`, manejo global de errores (Zod → 400, error con `statusCode` → pase directo, resto → 500).
- **Rutas**: registradas como plugins de Fastify bajo `/api`.
- **Prisma v7 con driver adapter**: conexión vía `@prisma/adapter-pg` (`src/lib/prisma.ts`), cliente generado en `generated/prisma/` (no en `node_modules`). La config del CLI está en `prisma7.config.ts`.
- **Validación**: Zod inline en cada handler (no esquemas de Fastify).
- **ESM en todo el backend**: `"type": "module"`; los imports usan extensiones `.js` explícitas aunque el código fuente sea `.ts`.

### Frontend (`frontend/`)

- **Entrada**: `src/main.tsx` (inicializa i18n e importa estilos), `src/App.tsx` (Providers → `ThemeProvider`, `ToastProvider`, `BrowserRouter`).
- **Rutas**: `/` (ShelfPage), `/books/:id` (BookDetailPage), `/import` (ImportPage), `/tags` (TagsPage), catch-all redirige a `/`.
- **Estado**: React local (`useState`) + dos contextos: `theme/theme-context.ts` y `components/toast-context.ts`. Sin librerías de estado ni fetching externas (React Query/SWR no se usan).
- **Comunicación**: `src/lib/api.ts` (Axios, baseURL `/api`). En dev, Vite hace proxy de `/api` y `/covers` a `http://backend:3000`.
- **Estilos**: Tailwind v4 con tokens custom en `src/index.css` (`@theme` + clases de componente `glass`, `btn-*`, `chip`, etc.). Dark mode por clase `.dark` en `<html>`.
- **i18n**: i18next + react-i18next, español (por defecto) e inglés; `src/i18n/locales/{es,en}.json`. Las claves deben añadirse en ambos archivos.

## Modelo de datos

- **Book**: `id`, `name` (obligatorio), `secundaryName?` (ojo: el typo "secundary" es intencional y consistente en todo el repo), `url` (obligatorio), `lastChapter`, `status` (0=Pending, 1=In Progress, 2=Completed, 3=Dropped), `rating` (0-10), `coverPath`, `createdAt`, `updateAt`, `completedAt?`.
- **Tag**: `id`, `name` (único).
- **BookTag**: tabla puente M:N con PK compuesta `(bookId, tagId)` y borrado en cascada.

Migraciones en `backend/prisma/migrations/`. El esquema vive en `backend/prisma/schema.prisma`.

Nota: `BOOK_STATUS` (esquema de estados) está duplicado: en el backend como Zod/int del modelo y en el frontend en `src/lib/types.ts`.

## API

```
GET    /api/health          - Health check
GET    /api/books           - Lista/paginado/filtros (name, status, tag, page, pageSize)
GET    /api/books/:id       - Libro por id
POST   /api/books           - Crear libro
PATCH  /api/books/:id       - Actualizar libro
DELETE /api/books/:id       - Borrar libro (204)
POST   /api/books/import    - Importar libros desde Excel (multipart)
GET    /api/tags            - Lista etiquetas con conteo de libros
POST   /api/tags            - Crear/upsert etiqueta
DELETE /api/tags/:id        - Borrar etiqueta
GET    /covers/*            - Archivos estáticos de portadas
```

`POST /api/books/import` devuelve 201 (todo ok), 207 (importación parcial) o 400 (sin libros válidos).

## Estructura de directorios

```
backend/
  src/
    server.ts          # Entrada Fastify
    lib/prisma.ts      # Singleton de Prisma
    lib/excel.ts       # Parser de Excel (ExcelJS)
    routes/books.ts    # CRUD + import de libros
    routes/tags.ts     # CRUD de etiquetas
  prisma/schema.prisma # Modelos
  generated/prisma/    # Cliente Prisma generado (no editar)
  prisma7.config.ts    # Config del CLI de Prisma v7
  .env / .env.example  # Se usa DATABASE_URL, PORT, COVERS_DIR
frontend/
  src/
    App.tsx            # Providers + rutas + layout
    main.tsx           # Entrada React
    index.css          # Tailwind v4 + clases custom
    pages/             # Shelf, BookDetail, Import, Tags
    components/        # UI compartida
    lib/               # api.ts, types.ts, format.ts
    i18n/              # init y locales es/en
    theme/             # ThemeProvider + context
data/covers/           # Portadas servidas en /covers
docker-compose.yml     # Prod: postgres + backend + frontend (puerto 8080)
docker-compose.override.yml  # Dev: puertos expuestos + live reload
```

## Variables de entorno

- `DATABASE_URL` — conexión PostgreSQL (dev: `postgresql://books:books@localhost:5433/bookspace`).
- `PORT` — puerto del backend (default 3000).
- `COVERS_DIR` — directorio de portadas (default `../../data/covers`).

## Docker

- `docker-compose.yml`: stack completo. El frontend expone el puerto 8080.
- `docker-compose.override.yml`: se fusiona automáticamente en desarrollo; expone 5433 (postgres), 3000 (backend) y 5173 (frontend) con bind-mounts y live reload.
- Tanto el Dockerfile de backend como el de frontend ejecutan servidores de **desarrollo** (no multi-stage de producción).
- El backend ejecuta `prisma migrate deploy` al arrancar.

## Convenciones

- **Idioma**: las claves de i18n y los cambios visuales se hacen en español e inglés simultáneamente.
- **Imports**: en el backend usar extensiones `.js` en imports locales (patrón ESM de Node, aunque sea TS).
- **No comentarios**: no añadir comentarios al código salvo que se pidan explícitamente.
- **Estados de libro**: no introducir un nuevo status sin actualizar `BOOK_STATUS` del frontend y la validación Zod/Prisma del backend.
- **CAMEL_CASE vs snake_case**: respetar nombres existentes aunque contengan typos (`secundaryName`, `updateAt`).
- **Generado**: no editar `backend/generated/`.
- **Sin tests**: el repo no tiene infraestructura de testing; la verificación es lint/typecheck/build.

## CI

`.github/workflows/ci.yml` — en push/PR a `main`: job backend (lint + typecheck) y job frontend (lint + typecheck + build). No hay jobs de tests.

