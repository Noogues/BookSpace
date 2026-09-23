import { randomUUID } from 'node:crypto'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { FastifyInstance } from 'fastify'
import sharp from 'sharp'

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
const MAX_WIDTH = 800
const COVER_QUALITY = 80
const SUPPORTED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export { MAX_UPLOAD_BYTES }

export async function deleteCoverFile(
  coversDir: string,
  coverPath: string,
): Promise<void> {
  const filename = coverPath.replace(/^\/+/, '')
  if (!filename) return
  const target = path.join(coversDir, filename)
  try {
    await unlink(target)
  } catch {
    // File does not exist or cannot be deleted
  }
}

export async function coversRoutes(
  app: FastifyInstance,
  opts: { coversDir: string },
): Promise<void> {
  const dir = opts.coversDir
  await mkdir(dir, { recursive: true })

  async function processImage(buffer: Buffer, mimeType: string): Promise<Buffer> {
    if (!SUPPORTED_MIME_TYPES.has(mimeType)) {
      throw new Error('UNSUPPORTED_MIME_TYPE')
    }
    return sharp(buffer)
      .resize({
        width: MAX_WIDTH,
        withoutEnlargement: true,
      })
      .webp({ quality: COVER_QUALITY })
      .toBuffer()
  }

  app.post('/covers', async (request, reply) => {
    let file: Awaited<ReturnType<typeof request.file>> | undefined
    try {
      file = await request.file()
    } catch {
      return reply.status(413).send({ error: 'El archivo supera el tamaño máximo permitido' })
    }
    if (!file) {
      return reply.status(400).send({ error: 'No se recibió ningún archivo' })
    }

    if (!SUPPORTED_MIME_TYPES.has(file.mimetype)) {
      return reply.status(400).send({ error: 'La portada debe ser una imagen válida' })
    }

    let buffer: Buffer
    try {
      buffer = await file.toBuffer()
    } catch {
      return reply.status(413).send({ error: 'El archivo supera el tamaño máximo permitido' })
    }

    let processed: Buffer
    try {
      processed = await processImage(buffer, file.mimetype)
    } catch {
      return reply.status(400).send({ error: 'La portada debe ser una imagen válida' })
    }

    const filename = `${randomUUID()}.webp`
    const target = path.join(dir, filename)
    await writeFile(target, processed, { flag: 'wx' })

    return reply.status(201).send({ path: filename })
  })
}
