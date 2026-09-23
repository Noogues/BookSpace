import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import type { FastifyReply, FastifyRequest } from 'fastify'

const COOKIE_NAME = 'bookspace_session'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30
const isProduction = (process.env.NODE_ENV ?? 'development') === 'production'
const ephemeralSecret = randomBytes(32).toString('hex')

function secret(): string {
  const value = process.env.AUTH_SECRET
  if (isProduction && (!value || value.length < 16)) {
    throw new Error('AUTH_SECRET debe definirse con al menos 16 caracteres en producción')
  }
  return value && value.length >= 16 ? value : ephemeralSecret
}

function signToken(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url')
}

function createToken(username: string): string {
  const payload = Buffer.from(
    JSON.stringify({ username, exp: Date.now() + MAX_AGE_SECONDS * 1000 }),
  ).toString('base64url')
  return `${payload}.${signToken(payload)}`
}

function verifyToken(token: string): string | null {
  try {
    const [payload, signature] = token.split('.')
    if (!payload || !signature) return null
    const expected = signToken(payload)
    const actual = Buffer.from(signature)
    const expectedBuffer = Buffer.from(expected)
    if (actual.length !== expectedBuffer.length || !timingSafeEqual(actual, expectedBuffer)) {
      return null
    }
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      username: string
      exp: number
    }
    if (typeof data.username !== 'string' || typeof data.exp !== 'number' || data.exp < Date.now()) {
      return null
    }
    return data.username
  } catch {
    return null
  }
}

export function getSessionUsername(request: FastifyRequest): string | null {
  const token = request.cookies[COOKIE_NAME]
  if (!token) return null
  return verifyToken(token)
}

export function setSessionCookie(reply: FastifyReply, username: string): void {
  const fromEnv = process.env.COOKIE_SECURE
  const secure = fromEnv !== undefined ? fromEnv === 'true' : isProduction
  reply.setCookie(COOKIE_NAME, createToken(username), {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  })
}

export function clearSessionCookie(reply: FastifyReply): void {
  reply.clearCookie(COOKIE_NAME, { path: '/' })
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const username = getSessionUsername(request)
  if (!username) {
    return reply.status(401).send({ error: 'NO_AUTH' })
  }
}

export function passwordMatches(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? ''
  const inputBuffer = Buffer.from(input)
  const expectedBuffer = Buffer.from(expected)
  if (inputBuffer.length !== expectedBuffer.length) return false
  return timingSafeEqual(inputBuffer, expectedBuffer)
}

export function validateCredentials(username: string, password: string): boolean {
  const expectedUsername = process.env.ADMIN_USER ?? ''
  if (!expectedUsername || !process.env.ADMIN_PASSWORD) return false
  return timingSafeEqual(Buffer.from(username), Buffer.from(expectedUsername)) && passwordMatches(password)
}