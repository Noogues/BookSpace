import { lookup } from 'node:dns/promises'
import { stat, unlink, writeFile } from 'node:fs/promises'
import net from 'node:net'
import path from 'node:path'
import sharp from 'sharp'

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
export const MAX_REMOTE_BYTES = 10 * 1024 * 1024
export const MAX_INPUT_PIXELS = 40_000_000
export const REMOTE_TIMEOUT_MS = 10_000
export const REMOTE_MAX_REDIRECTS = 3

export const COVER_ASPECT_HEIGHT = 3
export const COVER_ASPECT_WIDTH = 2

export const COVER_THUMB_WIDTH = 200
export const COVER_FULL_WIDTH = 800

export const COVER_VARIANTS = [
  { width: COVER_THUMB_WIDTH, quality: 70 },
  { width: COVER_FULL_WIDTH, quality: 72 },
] as const

export const SUPPORTED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
])

export type CoverImageErrorCode =
  | 'UNSUPPORTED_MIME'
  | 'INVALID_IMAGE'
  | 'TOO_MANY_PIXELS'
  | 'TOO_LARGE'
  | 'INVALID_REMOTE'
  | 'BLOCKED_HOST'

export class CoverImageError extends Error {
  readonly code: CoverImageErrorCode

  constructor(code: CoverImageErrorCode) {
    super(code)
    this.name = 'CoverImageError'
    this.code = code
  }
}

export interface CoverVariants {
  path: string
  thumb: string
}

export interface CoverDimensions {
  width: number
  height: number
}

const VARIANT_SUFFIX = /_(\d+)\.webp$/i
const SAFE_FILENAME = /^[A-Za-z0-9][A-Za-z0-9._-]*$/
const REMOTE_COVER = /^(https?:|data:|blob:|\/\/)/i
const COVERS_PREFIX = /^\/?covers\//i

const blockedHosts = new net.BlockList()
blockedHosts.addSubnet('0.0.0.0', 8, 'ipv4')
blockedHosts.addSubnet('10.0.0.0', 8, 'ipv4')
blockedHosts.addSubnet('100.64.0.0', 10, 'ipv4')
blockedHosts.addSubnet('127.0.0.0', 8, 'ipv4')
blockedHosts.addSubnet('169.254.0.0', 16, 'ipv4')
blockedHosts.addSubnet('172.16.0.0', 12, 'ipv4')
blockedHosts.addSubnet('192.168.0.0', 16, 'ipv4')
blockedHosts.addSubnet('224.0.0.0', 4, 'ipv4')
blockedHosts.addSubnet('::', 128, 'ipv6')
blockedHosts.addSubnet('::1', 128, 'ipv6')
blockedHosts.addSubnet('fc00::', 7, 'ipv6')
blockedHosts.addSubnet('fe80::', 10, 'ipv6')

export function isSupportedMimeType(mimeType: string): boolean {
  return SUPPORTED_MIME_TYPES.has(mimeType.toLowerCase())
}

export function coverHeightForWidth(width: number): number {
  return Math.round((width * COVER_ASPECT_HEIGHT) / COVER_ASPECT_WIDTH)
}

export function coverCropBox(dimensions: CoverDimensions): CoverDimensions {
  const targetRatio = COVER_ASPECT_WIDTH / COVER_ASPECT_HEIGHT
  const ratio = dimensions.width / dimensions.height
  if (ratio > targetRatio) {
    return { width: Math.round(dimensions.height * targetRatio), height: dimensions.height }
  }
  return { width: dimensions.width, height: coverHeightForWidth(dimensions.width) }
}

export function variantFilename(baseName: string, width: number): string {
  return `${baseName}_${width}.webp`
}

export function isVariantFilename(filename: string): boolean {
  return VARIANT_SUFFIX.test(filename)
}

export function coverBaseName(coverPath: string): string | null {
  const value = coverPath.trim()
  if (!value || REMOTE_COVER.test(value)) return null
  const filename = value.replace(COVERS_PREFIX, '').replace(/^\/+/, '')
  if (filename.includes('/') || filename.includes('..')) return null
  if (!SAFE_FILENAME.test(filename)) return null
  if (!filename.toLowerCase().endsWith('.webp')) return null
  return filename.replace(VARIANT_SUFFIX, '').replace(/\.webp$/i, '')
}

export function assertSupportedMimeType(mimeType: string): void {
  if (!isSupportedMimeType(mimeType)) {
    throw new CoverImageError('UNSUPPORTED_MIME')
  }
}

export async function assertSupportedImage(
  buffer: Buffer,
): Promise<CoverDimensions> {
  const metadata = await sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS })
    .metadata()
    .catch(() => null)
  if (!metadata?.width || !metadata.height) {
    throw new CoverImageError('INVALID_IMAGE')
  }
  if (metadata.width * metadata.height > MAX_INPUT_PIXELS) {
    throw new CoverImageError('TOO_MANY_PIXELS')
  }
  return { width: metadata.width, height: metadata.height }
}

export async function encodeCoverVariant(
  buffer: Buffer,
  variant: { width: number; quality: number },
  dimensions: CoverDimensions,
): Promise<Buffer> {
  const targetWidth = Math.min(variant.width, coverCropBox(dimensions).width)
  try {
    return await sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS })
      .rotate()
      .resize({
        width: targetWidth,
        height: coverHeightForWidth(targetWidth),
        fit: 'cover',
        position: sharp.strategy.attention,
      })
      .webp({ quality: variant.quality })
      .toBuffer()
  } catch {
    throw new CoverImageError('INVALID_IMAGE')
  }
}

export async function writeCoverVariants(
  coversDir: string,
  buffer: Buffer,
  baseName: string,
): Promise<CoverVariants> {
  const dimensions = await assertSupportedImage(buffer)
  for (const variant of COVER_VARIANTS) {
    const data = await encodeCoverVariant(buffer, variant, dimensions)
    await writeFile(
      path.join(coversDir, variantFilename(baseName, variant.width)),
      data,
      { flag: 'wx' },
    )
  }
  return {
    path: variantFilename(baseName, COVER_FULL_WIDTH),
    thumb: variantFilename(baseName, COVER_THUMB_WIDTH),
  }
}

export async function coverVariantsExist(
  coversDir: string,
  baseName: string,
): Promise<boolean> {
  for (const variant of COVER_VARIANTS) {
    try {
      await stat(path.join(coversDir, variantFilename(baseName, variant.width)))
    } catch {
      return false
    }
  }
  return true
}

export async function deleteCoverVariantFiles(
  coversDir: string,
  baseName: string,
): Promise<void> {
  for (const variant of COVER_VARIANTS) {
    try {
      await unlink(path.join(coversDir, variantFilename(baseName, variant.width)))
    } catch {
      continue
    }
  }
}

export async function deleteCoverFiles(
  coversDir: string,
  coverPath: string,
): Promise<void> {
  const baseName = coverBaseName(coverPath)
  if (!baseName) return
  await deleteCoverVariantFiles(coversDir, baseName)
  try {
    await unlink(path.join(coversDir, `${baseName}.webp`))
  } catch {
    return
  }
}

function parseRemoteUrl(value: string): URL {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new CoverImageError('INVALID_REMOTE')
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new CoverImageError('INVALID_REMOTE')
  }
  return url
}

function isBlockedAddress(address: string, family: number): boolean {
  if (family === 4) return blockedHosts.check(address, 'ipv4')
  if (blockedHosts.check(address, 'ipv6')) return true
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(address)
  return mapped?.[1] !== undefined && blockedHosts.check(mapped[1], 'ipv4')
}

async function assertPublicHost(url: URL): Promise<void> {
  if (url.hostname === 'localhost') throw new CoverImageError('BLOCKED_HOST')
  const addresses = await lookup(url.hostname, { all: true }).catch(() => null)
  if (!addresses || addresses.length === 0) throw new CoverImageError('INVALID_REMOTE')
  for (const { address, family } of addresses) {
    if (isBlockedAddress(address, family)) throw new CoverImageError('BLOCKED_HOST')
  }
}

async function readCapped(response: Response, maxBytes: number): Promise<Buffer> {
  const declared = Number(response.headers.get('content-length') ?? '0')
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new CoverImageError('TOO_LARGE')
  }
  if (!response.body) throw new CoverImageError('INVALID_REMOTE')
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    if (!value) continue
    total += value.byteLength
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined)
      throw new CoverImageError('TOO_LARGE')
    }
    chunks.push(value)
  }
  if (total === 0) throw new CoverImageError('INVALID_REMOTE')
  return Buffer.concat(chunks)
}

export async function fetchRemoteImage(rawUrl: string): Promise<Buffer> {
  let current = parseRemoteUrl(rawUrl)
  for (let hop = 0; hop <= REMOTE_MAX_REDIRECTS; hop += 1) {
    await assertPublicHost(current)
    const response = await fetch(current, {
      redirect: 'manual',
      signal: AbortSignal.timeout(REMOTE_TIMEOUT_MS),
      headers: { accept: 'image/*' },
    }).catch(() => null)
    if (!response) throw new CoverImageError('INVALID_REMOTE')
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (!location) throw new CoverImageError('INVALID_REMOTE')
      current = parseRemoteUrl(new URL(location, current).toString())
      continue
    }
    if (!response.ok) throw new CoverImageError('INVALID_REMOTE')
    return readCapped(response, MAX_REMOTE_BYTES)
  }
  throw new CoverImageError('INVALID_REMOTE')
}
