import { z } from 'zod';
export declare const bookRowSchema: z.ZodObject<{
    name: z.ZodString;
    secundaryName: z.ZodOptional<z.ZodString>;
    url: z.ZodString;
    lastChapter: z.ZodDefault<z.ZodNumber>;
    status: z.ZodUnion<readonly [z.ZodLiteral<0>, z.ZodLiteral<1>]>;
}, z.core.$strip>;
export type BookInput = z.infer<typeof bookRowSchema>;
export interface ExcelError {
    row: number;
    error: string;
}
export declare function parseExcel(buffer: Buffer): Promise<{
    books: BookInput[];
    errors: ExcelError[];
}>;
//# sourceMappingURL=excel.d.ts.map