import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { parseExcel } from '../lib/excel.js'
import { prisma } from '../lib/prisma.js'
import { deleteCoverFile } from './covers.js'
import type { Prisma } from '../../generated/prisma/client.js'

const bookInclude = { tags: { include: { tag: true } } } as const

const baseBookSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio'),
  secundaryName: z.string().trim().min(1).optional(),
  url: z.string().trim().min(1, 'La url es obligatoria'),
  lastChapter: z.number().int().min(0).default(0),
  status: z.number().int().min(0).max(3).default(0),
  rating: z.number().min(0).max(10).default(0),
  coverPath: z.string().trim().nullable().default(null),
  completedAt: z.coerce.date().optional(),
  tags: z.array(z.string().trim().min(1)).default([]),
})

const createBookSchema = baseBookSchema

const updateBookSchema = z.object({
  name: z.string().trim().min(1).optional(),
  secundaryName: z.string().trim().min(1).optional(),
  url: z.string().trim().min(1).optional(),
  lastChapter: z.number().int().min(0).optional(),
  status: z.number().int().min(0).max(3).optional(),
  rating: z.number().min(0).max(10).optional(),
  coverPath: z.string().trim().nullable().optional(),
  completedAt: z.coerce.date().optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
})

const listQuerySchema = z.object({
  name: z.string().trim().min(1).optional(),
  status: z.coerce.number().int().min(0).max(3).optional(),
  tag: z.union([z.string(), z.array(z.string())]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
})

async function resolveTags(names: string[]): Promise<number[]> {
  const tagIds = new Set<number>()
  for (const name of names) {
    const tag = await prisma.tag.upsert({
      where: { name },
      create: { name },
      update: {},
    })
    tagIds.add(tag.id)
  }
  return [...tagIds]
}

export async function booksRoutes(
  app: FastifyInstance,
  opts: { coversDir: string },
): Promise<void> {
  const dir = opts.coversDir

  app.get('/books', async (request) => {
    const { name, status, tag, page, pageSize } = listQuerySchema.parse(request.query)

    const tagList = (Array.isArray(tag) ? tag : tag ? [tag] : [])
      .map((value) => value.trim())
      .filter((value) => value.length > 0)

    const where: Prisma.BookWhereInput = {
      ...(name ? { name: { contains: name, mode: 'insensitive' as const } } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(tagList.length > 0
        ? { AND: tagList.map((name) => ({ tags: { some: { tag: { name } } } })) }
        : {}),
    }

    const [total, items] = await Promise.all([
      prisma.book.count({ where }),
      prisma.book.findMany({
        where,
        orderBy: { updateAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: bookInclude,
      }),
    ])

    return { total, page, pageSize, items }
  })

  app.get('/books/:id', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params)
    const book = await prisma.book.findUnique({
      where: { id },
      include: bookInclude,
    })
    if (!book) return reply.status(404).send({ error: 'Libro no encontrado' })
    return book
  })

  app.post('/books', async (request) => {
    const data = createBookSchema.parse(request.body)

    const tagIds = await resolveTags(data.tags)

    return prisma.book.create({
      data: {
        name: data.name,
        ...(data.secundaryName !== undefined ? { secundaryName: data.secundaryName } : {}),
        url: data.url,
        lastChapter: data.lastChapter,
        status: data.status,
        rating: data.rating,
        ...(data.coverPath !== null ? { coverPath: data.coverPath } : {}),
        ...(data.completedAt !== undefined ? { completedAt: data.completedAt } : {}),
        ...(tagIds.length > 0 ? { tags: { create: tagIds.map((tagId) => ({ tagId })) } } : {}),
      },
      include: bookInclude,
    })
  })

  app.patch('/books/:id', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params)
    const data = updateBookSchema.parse(request.body)

    const existing = await prisma.book.findUnique({ where: { id } })
    if (!existing) return reply.status(404).send({ error: 'Libro no encontrado' })

    const tagIds = data.tags !== undefined ? await resolveTags(data.tags) : undefined

    let coverPathToDelete: string | undefined
    if (data.coverPath !== undefined && data.coverPath !== existing?.coverPath) {
      coverPathToDelete = existing?.coverPath ?? undefined
    }

    const result = await prisma.book.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.secundaryName !== undefined ? { secundaryName: data.secundaryName } : {}),
        ...(data.url !== undefined ? { url: data.url } : {}),
        ...(data.lastChapter !== undefined ? { lastChapter: data.lastChapter } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.rating !== undefined ? { rating: data.rating } : {}),
        ...(data.coverPath !== undefined ? { coverPath: data.coverPath as string } : {}),
        ...(data.completedAt !== undefined ? { completedAt: data.completedAt } : {}),
        ...(tagIds !== undefined
          ? {
              tags: {
                deleteMany: {},
                create: tagIds.map((tagId) => ({ tagId })),
              },
            }
          : {}),
      },
      include: bookInclude,
    })

    if (coverPathToDelete) {
      await deleteCoverFile(dir, coverPathToDelete)
    }

    return result
  })

  app.delete('/books/:id', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params)
    const existing = await prisma.book.findUnique({ where: { id } })
    if (!existing) return reply.status(404).send({ error: 'Libro no encontrado' })
    if (existing.coverPath) {
      await deleteCoverFile(dir, existing.coverPath)
    }
    await prisma.book.delete({ where: { id } })
    return reply.status(204).send()
  })

  app.post('/books/import', async (request, reply) => {
    const file = await request.file()
    if (!file) {
      return reply.status(400).send({ error: 'No se recibió ningún archivo' })
    }

    const buffer = await file.toBuffer()
    const { books, errors } = await parseExcel(buffer)

    if (books.length === 0) {
      return reply
        .status(400)
        .send({ imported: 0, error: 'No se pudo importar ningún libro', errors })
    }

    const { created } = await prisma.$transaction(async (tx) => {
      let createdCount = 0
      for (const book of books) {
        await tx.book.create({
          data: {
            name: book.name,
            ...(book.secundaryName !== undefined ? { secundaryName: book.secundaryName } : {}),
            url: book.url,
            lastChapter: book.lastChapter,
            status: book.status,
            rating: 0,
            coverPath: null as unknown as string,
          },
        })
        createdCount += 1
      }
      return { created: createdCount }
    })

    const payload: { imported: number; errors?: typeof errors } = { imported: created }
    if (errors.length > 0) payload.errors = errors
    return reply.status(errors.length > 0 ? 207 : 201).send(payload)
  })
}
