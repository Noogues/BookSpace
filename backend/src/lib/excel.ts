import ExcelJS from 'exceljs'
import { z } from 'zod'

const HEADER_ALIASES: Record<string, string> = {
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
}

export const bookRowSchema = z.object({
  name: z.string().trim().min(1),
  secundaryName: z.string().trim().min(1).optional(),
  url: z.string().trim().min(1),
  lastChapter: z.number().int().min(0).default(0),
  status: z.union([z.literal(0), z.literal(1)]),
})

export type BookInput = z.infer<typeof bookRowSchema>

export interface ExcelError {
  row: number
  error: string
}

type RawRow = Record<string, string>

function richTextToText(value: unknown): string | undefined {
  if (value !== null && typeof value === 'object' && 'richText' in value) {
    const richText = (value as { richText?: unknown }).richText
    if (Array.isArray(richText)) {
      return richText
        .map((part) => {
          const text = (part as { text?: unknown }).text
          return typeof text === 'string' ? text : ''
        })
        .join('')
    }
  }
  return undefined
}

function cellToText(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    const text = record.text
    if (typeof text === 'string') return text
    const fromText = richTextToText(text)
    if (fromText !== undefined) return fromText
    if (typeof record.hyperlink === 'string') return record.hyperlink
    if ('result' in record && record.result !== null && record.result !== undefined) {
      return String(record.result)
    }
    const fromRichText = richTextToText(record)
    if (fromRichText !== undefined) return fromRichText
  }
  return undefined
}

function toNumber(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === '') return undefined
  const normalized = value.trim().replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : undefined
}

function optionalText(value: string | undefined): string | undefined {
  if (value === undefined || value.trim() === '') return undefined
  return value
}

export async function parseExcel(
  buffer: Buffer,
): Promise<{ books: BookInput[]; errors: ExcelError[] }> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer as never)

  const sheet = workbook.worksheets[0]
  if (!sheet) return { books: [], errors: [{ row: 1, error: 'El archivo no contiene hojas' }] }

  const headers: (string | null)[] = []
  sheet.getRow(1).eachCell({ includeEmpty: true }, (cell, col) => {
    const value = cellToText(cell.value)
    headers[col - 1] = value?.trim() ? value.trim().toLowerCase() : null
  })

  const rows: RawRow[] = []
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return
    const raw: RawRow = {}
    row.eachCell({ includeEmpty: false }, (cell, col) => {
      const header = headers[col - 1]
      if (!header) return
      const key = HEADER_ALIASES[header]
      if (!key) return
      raw[key] = cellToText(cell.value) ?? ''
    })
    rows.push(raw)
  })

  const books: BookInput[] = []
  const errors: ExcelError[] = []

  rows.forEach((raw, index) => {
    const rowNumber = index + 2
    const chapter = toNumber(raw.lastChapter)
    const hasChapter = raw.lastChapter !== undefined && raw.lastChapter.trim() !== ''
    const result = bookRowSchema.safeParse({
      name: optionalText(raw.name),
      secundaryName: optionalText(raw.secundaryName),
      url: optionalText(raw.url),
      lastChapter: chapter ?? 0,
      status: hasChapter ? 1 : 0,
    })

    if (!result.success) {
      errors.push({
        row: rowNumber,
        error: result.error.issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join(' | '),
      })
    } else {
      books.push(result.data)
    }
  })

  return { books, errors }
}