import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { ZodError } from 'zod';
import { booksRoutes } from './routes/books.js';
import { coversRoutes, MAX_UPLOAD_BYTES } from './routes/covers.js';
import { tagsRoutes } from './routes/tags.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = Fastify({ logger: true });
await app.register(cors, { origin: true });
await app.register(multipart, {
    limits: { files: 1, fileSize: MAX_UPLOAD_BYTES, fields: 5 },
});
const coversDir = process.env.COVERS_DIR ?? path.join(__dirname, '../../data/covers');
await app.register(fastifyStatic, { root: coversDir, prefix: '/covers' });
await app.register(booksRoutes, { prefix: '/api', coversDir });
await app.register(coversRoutes, { prefix: '/api', coversDir });
await app.register(tagsRoutes, { prefix: '/api' });
app.get('/api/health', async () => ({ status: 'ok' }));
app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
        return reply.status(400).send({
            error: 'VALIDATION_ERROR',
            issues: error.issues.map((issue) => ({
                path: issue.path.join('.'),
                message: issue.message,
            })),
        });
    }
    if (error instanceof Error && 'statusCode' in error) {
        const statusCode = error.statusCode;
        if (statusCode !== undefined) {
            return reply.status(statusCode).send({ error: error.message });
        }
    }
    app.log.error(error);
    return reply.status(500).send({ error: 'INTERNAL_ERROR' });
});
const port = Number(process.env.PORT ?? 3000);
await app.listen({ port, host: '0.0.0.0' });
//# sourceMappingURL=server.js.map