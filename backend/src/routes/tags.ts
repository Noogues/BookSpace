import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../lib/auth.js'

const createTagSchema = z.object({
  name: z.string().trim().min(1),
})

const renameTagSchema = z.object({
  name: z.string().trim().min(1),
})

const mergeTagsSchema = z.object({
  sourceId: z.coerce.number().int().positive(),
  targetId: z.coerce.number().int().positive(),
})

const idParamSchema = z.object({ id: z.coerce.number().int().positive() })

const UNIQUE_VIOLATION = 'P2002'

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === UNIQUE_VIOLATION
  )
}

export async function tagsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/tags', async () => {
    return prisma.tag.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { books: true } } },
    })
  })

  app.post('/tags', { preHandler: requireAuth }, async (request, reply) => {
    const data = createTagSchema.parse(request.body)
    try {
      return await prisma.tag.upsert({
        where: { name: data.name },
        create: data,
        update: {},
      })
    } catch (error) {
      app.log.error(error)
      return reply.status(500).send({ error: 'No se pudo crear el tag' })
    }
  })

  app.patch('/tags/:id', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = idParamSchema.parse(request.params)
    const { name } = renameTagSchema.parse(request.body)

    const existing = await prisma.tag.findUnique({ where: { id } })
    if (!existing) return reply.status(404).send({ error: 'Tag no encontrado' })
    if (existing.name === name) return reply.status(200).send(existing)

    try {
      return await prisma.tag.update({ where: { id }, data: { name } })
    } catch (error) {
      if (isUniqueViolation(error)) {
        return reply.status(409).send({ error: 'Ya existe una etiqueta con ese nombre' })
      }
      app.log.error(error)
      return reply.status(500).send({ error: 'No se pudo renombrar el tag' })
    }
  })

  app.post('/tags/merge', { preHandler: requireAuth }, async (request, reply) => {
    const { sourceId, targetId } = mergeTagsSchema.parse(request.body)

    if (sourceId === targetId) {
      return reply.status(400).send({ error: 'No se puede fusionar una etiqueta consigo misma' })
    }

    const [source, target] = await Promise.all([
      prisma.tag.findUnique({ where: { id: sourceId } }),
      prisma.tag.findUnique({ where: { id: targetId } }),
    ])
    if (!source || !target) {
      return reply.status(404).send({ error: 'Tag no encontrado' })
    }

    await prisma.$transaction(async (tx) => {
      const links = await tx.bookTag.findMany({ where: { tagId: sourceId }, select: { bookId: true } })

      for (const { bookId } of links) {
        await tx.bookTag.upsert({
          where: { bookId_tagId: { bookId, tagId: targetId } },
          create: { bookId, tagId: targetId },
          update: {},
        })
      }

      await tx.tag.delete({ where: { id: sourceId } })
    })

    return prisma.tag.findUnique({
      where: { id: targetId },
      include: { _count: { select: { books: true } } },
    })
  })

  app.delete('/tags/:id', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = idParamSchema.parse(request.params)
    try {
      return await prisma.tag.delete({ where: { id } })
    } catch (error) {
      app.log.error(error)
      return reply.status(404).send({ error: 'Tag no encontrado' })
    }
  })
}
