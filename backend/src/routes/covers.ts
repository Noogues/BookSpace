import { randomUUID } from 'node:crypto'
import { mkdir } from 'node:fs/promises'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { requireAuth } from '../lib/auth.js'
import {
  CoverImageError,
  assertSupportedImage,
  assertSupportedMimeType,
  fetchRemoteImage,
  writeCoverVariants,
} from '../lib/images.js'

const remoteUrlSchema = z.object({
  url: z
    .string()
    .trim()
    .max(2048)
    .refine((value) => {
      try {
        const parsed = new URL(value)
        return parsed.protocol === 'http:' || parsed.protocol === 'https:'
      } catch {
        return false
      }
    }),
})

function coverErrorCode(error: unknown): string {
  if (error instanceof CoverImageError) return error.code
  return 'INVALID_IMAGE'
}

export async function coversRoutes(
  app: FastifyInstance,
  opts: { coversDir: string },
): Promise<void> {
  const dir = opts.coversDir
  await mkdir(dir, { recursive: true })

  app.post('/covers', { preHandler: requireAuth }, async (request, reply) => {
    let file: Awaited<ReturnType<typeof request.file>> | undefined
    try {
      file = await request.file()
    } catch {
      return reply.status(413).send({ error: 'TOO_LARGE' })
    }
    if (!file) {
      return reply.status(400).send({ error: 'INVALID_IMAGE' })
    }

    try {
      assertSupportedMimeType(file.mimetype)
    } catch (error) {
      return reply.status(400).send({ error: coverErrorCode(error) })
    }

    let buffer: Buffer
    try {
      buffer = await file.toBuffer()
    } catch {
      return reply.status(413).send({ error: 'TOO_LARGE' })
    }

    try {
      await assertSupportedImage(buffer)
      const variants = await writeCoverVariants(dir, buffer, randomUUID())
      return reply.status(201).send(variants)
    } catch (error) {
      return reply.status(400).send({ error: coverErrorCode(error) })
    }
  })

  app.post('/covers/import-url', { preHandler: requireAuth }, async (request, reply) => {
    const { url } = remoteUrlSchema.parse(request.body)

    let buffer: Buffer
    try {
      buffer = await fetchRemoteImage(url)
    } catch (error) {
      return reply.status(400).send({ error: coverErrorCode(error) })
    }

    try {
      await assertSupportedImage(buffer)
      const variants = await writeCoverVariants(dir, buffer, randomUUID())
      return reply.status(201).send(variants)
    } catch (error) {
      return reply.status(400).send({ error: coverErrorCode(error) })
    }
  })
}
