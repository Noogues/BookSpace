import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  clearSessionCookie,
  getSessionUsername,
  setSessionCookie,
  validateCredentials,
} from '../lib/auth.js'

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
})

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/auth/login', async (request, reply) => {
    const { username, password } = loginSchema.parse(request.body)

    if (!validateCredentials(username, password)) {
      return reply.status(401).send({ error: 'INVALID_CREDENTIALS' })
    }

    setSessionCookie(reply, username)
    return { username }
  })

  app.post('/auth/logout', async (_request, reply) => {
    clearSessionCookie(reply)
    return reply.status(204).send()
  })

  app.get('/auth/me', async (request, reply) => {
    const username = getSessionUsername(request)
    if (!username) {
      return reply.status(401).send({ error: 'NO_AUTH' })
    }
    return { username }
  })
}