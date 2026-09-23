import ExcelJS from 'exceljs';
import { z } from 'zod';
const HEADER_ALIASES = {
    name: 'name',
    nombre: 'name',
    secundaryname: 'secundaryName',
    'secondary name': 'secundaryName',
    'nombre secundario': 'secundaryName',
    'nombre alternativo': 'secundaryName',
    url: 'url',
    link: 'url',
    lastchapter: 'lastChapter',
    'ultimo capitulo': 'lastChapter',
    'último capítulo': 'lastChapter',
    capitulo: 'lastChapter',
    capítulo: 'lastChapter',
};
export const bookRowSchema = z.object({
    name: z.string().trim().min(1),
    secundaryName: z.string().trim().min(1).optional(),
    url: z.string().trim().min(1),
    lastChapter: z.number().int().min(0).default(0),
    status: z.union([z.literal(0), z.literal(1)]),
});
function richTextToText(value) {
    if (value !== null && typeof value === 'object' && 'richText' in value) {
        const richText = value.richText;
        if (Array.isArray(richText)) {
            return richText
                .map((part) => {
                const text = part.text;
                return typeof text === 'string' ? text : '';
            })
                .join('');
        }
    }
    return undefined;
}
function cellToText(value) {
    if (value === null || value === undefined)
        return undefined;
    if (typeof value === 'string')
        return value;
    if (typeof value === 'number' || typeof value === 'boolean')
        return String(value);
    if (value instanceof Date)
        return value.toISOString();
    if (typeof value === 'object') {
        const record = value;
        const text = record.text;
        if (typeof text === 'string')
            return text;
        const fromText = richTextToText(text);
        if (fromText !== undefined)
            return fromText;
        if (typeof record.hyperlink === 'string')
            return record.hyperlink;
        if ('result' in record && record.result !== null && record.result !== undefined) {
            return String(record.result);
        }
        const fromRichText = richTextToText(record);
        if (fromRichText !== undefined)
            return fromRichText;
    }
    return undefined;
}
function toNumber(value) {
    if (value === undefined || value.trim() === '')
        return undefined;
    const normalized = value.trim().replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
}
function optionalText(value) {
    if (value === undefined || value.trim() === '')
        return undefined;
    return value;
}
export async function parseExcel(buffer) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const sheet = workbook.worksheets[0];
    if (!sheet)
        return { books: [], errors: [{ row: 1, error: 'El archivo no contiene hojas' }] };
    const headers = [];
    sheet.getRow(1).eachCell({ includeEmpty: true }, (cell, col) => {
        const value = cellToText(cell.value);
        headers[col - 1] = value?.trim() ? value.trim().toLowerCase() : null;
    });
    const rows = [];
    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1)
            return;
        const raw = {};
        row.eachCell({ includeEmpty: false }, (cell, col) => {
            const header = headers[col - 1];
            if (!header)
                return;
            const key = HEADER_ALIASES[header];
            if (!key)
                return;
            raw[key] = cellToText(cell.value) ?? '';
        });
        rows.push(raw);
    });
    const books = [];
    const errors = [];
    rows.forEach((raw, index) => {
        const rowNumber = index + 2;
        const chapter = toNumber(raw.lastChapter);
        const hasChapter = raw.lastChapter !== undefined && raw.lastChapter.trim() !== '';
        const result = bookRowSchema.safeParse({
            name: optionalText(raw.name),
            secundaryName: optionalText(raw.secundaryName),
            url: optionalText(raw.url),
            lastChapter: chapter ?? 0,
            status: hasChapter ? 1 : 0,
        });
        if (!result.success) {
            errors.push({
                row: rowNumber,
                error: result.error.issues
                    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
                    .join(' | '),
            });
        }
        else {
            books.push(result.data);
        }
    });
    return { books, errors };
}
//# sourceMappingURL=excel.js.map