# BookSpace

Seguimiento de lecturas para libros y novelas web. Gestiona tu biblioteca con capítulos, valoraciones, etiquetas y portadas, e importa datos desde archivos Excel.

[English version](README.en.md)

## Características

- **Biblioteca**: crea, edita y organiza libros con nombre, nombre alternativo, enlace, capítulo actual, estado y valoración.
- **Capítulos**: añade capítulos de golpe y avanza el progreso del libro.
- **Etiquetas**: organiza los libros por etiquetas y filtra la biblioteca.
- **Portadas**: sube imágenes de portada o usa una URL.
- **Importación Excel**: añade varios libros a la vez desde un archivo `.xlsx`.
- **Modo oscuro**: tema claro/oscuro con preferencia del sistema.
- **Internacionalización**: interfaz en español e inglés.
- **Docker**: despliegue completo con un solo comando.

## Stack

| Capa | Tecnología |
|---|---|
| Backend | Node.js 24, TypeScript (ESM), Fastify 5, Prisma 7 + PostgreSQL, Zod, ExcelJS, Sharp |
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS v4, react-router-dom 7, i18next, Axios |
| Infra | Docker Compose, GitHub Actions (CI: lint + typecheck + build) |

## Estructura

```
backend/            API REST (Fastify + Prisma)
frontend/           Aplicación web (React + Vite)
data/covers/        Portadas servidas en /covers
docker-compose.yml  Stack de producción (puerto 8080)
docker-compose.override.yml  Stack de desarrollo (hot reload)
```

## Requisitos

- Docker y Docker Compose (para el despliegue con contenedores).
- Node.js 24+ y PostgreSQL (para desarrollo local sin Docker).

## Inicio rápido

### Con Docker

1. Copia y rellena las variables de entorno:

   ```bash
   cp .env.example .env
   ```

2. Arranca el stack:

   ```bash
   docker compose up -d
   ```

3. Accede a la aplicación en [http://localhost:8080](http://localhost:8080).

En desarrollo, `docker-compose.override.yml` se aplica automáticamente: expone el backend en el puerto 3000 y el frontend (con live reload) en el 5173.

### Desarrollo local

Backend:

```bash
cd backend
npm install
cp .env.example .env   # DATABASE_URL apunta a tu PostgreSQL local
npm run prisma:generate
npm run migrate:dev
npm run dev            # http://localhost:3000
```

Frontend (Vite hace proxy de `/api` y `/covers` a `http://backend:3000`):

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```

## Comandos

### Backend

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con hot reload |
| `npm run start` | Ejecutar servidor |
| `npm run build` | Compilar TypeScript a `dist/` |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run migrate:deploy` | Aplicar migraciones en producción |
| `npm run migrate:dev` | Crear/aplicar migraciones en desarrollo |
| `npm run prisma:generate` | Regenerar el cliente Prisma |

### Frontend

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo (puerto 5173) |
| `npm run build` | `tsc -b && vite build` |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc -b` |
| `npm run preview` | Previsualizar build de producción |

## Variables de entorno

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `DATABASE_URL` | Conexión PostgreSQL | `postgresql://books:books@localhost:5433/bookspace` |
| `PORT` | Puerto del backend | `3000` |
| `COVERS_DIR` | Directorio de portadas | `../../data/covers` |

## API

```
GET    /api/health          Health check
GET    /api/books           Lista/paginado/filtros (name, status, tag, page, pageSize)
GET    /api/books/:id       Libro por id
POST   /api/books           Crear libro
PATCH  /api/books/:id       Actualizar libro
DELETE /api/books/:id       Borrar libro (204)
POST   /api/books/import    Importar libros desde Excel (multipart)
GET    /api/tags            Lista etiquetas con conteo de libros
POST   /api/tags            Crear/upsert etiqueta
DELETE /api/tags/:id        Borrar etiqueta
POST   /api/covers          Subir portada (multipart)
GET    /covers/*            Archivos estáticos de portadas
```

`POST /api/books/import` devuelve 201 (todo correcto), 207 (importación parcial) o 400 (sin libros válidos).

## CI

El workflow de GitHub Actions (`.github/workflows/ci.yml`) ejecuta lint, typecheck y build de backend y frontend en pushes y pull requests hacia `main`.