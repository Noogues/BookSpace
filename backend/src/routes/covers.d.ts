import type { FastifyInstance } from 'fastify';
declare const MAX_UPLOAD_BYTES: number;
export { MAX_UPLOAD_BYTES };
export declare function deleteCoverFile(coversDir: string, coverPath: string): Promise<void>;
export declare function coversRoutes(app: FastifyInstance, opts: {
    coversDir: string;
}): Promise<void>;
//# sourceMappingURL=covers.d.ts.map