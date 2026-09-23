import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../lib/auth.js'

const createTagSchema = z.object({
  name: z.string().trim().min(1),
})

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

  app.delete('/tags/:id', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = z.object({ id: z.coerce.number().int().positive() }).parse(request.params)
    try {
      return await prisma.tag.delete({ where: { id } })
    } catch (error) {
      app.log.error(error)
      return reply.status(404).send({ error: 'Tag no encontrado' })
    }
  })
}