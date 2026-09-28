import { readdir, readFile, stat, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { prisma } from './prisma.js'
import {
  COVER_ASPECT_HEIGHT,
  COVER_ASPECT_WIDTH,
  COVER_FULL_WIDTH,
  COVER_VARIANTS,
  coverBaseName,
  coverVariantsExist,
  deleteCoverVariantFiles,
  isVariantFilename,
  variantFilename,
  writeCoverVariants,
} from './images.js'

export const MIGRATION_VERSION = 1
export const MIGRATION_SIGNATURE = `${COVER_ASPECT_WIDTH}:${COVER_ASPECT_HEIGHT}:${COVER_VARIANTS.map((variant) => `${variant.width}@${variant.quality}`).join(',')}`
export const MIGRATION_INTERVAL_MS = 24 * 60 * 60 * 1000
export const ORPHAN_GRACE_MS = 24 * 60 * 60 * 1000

const MARKER_FILENAME = '.covers-migration.json'

export type CoverMigrationLog = (
  level: 'info' | 'warn' | 'error',
  message: string,
  err?: unknown,
) => void

export interface CoverMigrationResult {
  migrated: number
  removed: number
}

interface Marker {
  version: number
  signature: string
  ranAt: number
}

let running: Promise<CoverMigrationResult> | null = null

function legacyAliases(baseName: string): string[] {
  const file = `${baseName}.webp`
  return [file, `/${file}`, `covers/${file}`, `/covers/${file}`]
}

async function readMarker(coversDir: string): Promise<Marker | null> {
  try {
    const raw = await readFile(path.join(coversDir, MARKER_FILENAME), 'utf8')
    const parsed = JSON.parse(raw) as Partial<Marker>
    if (
      typeof parsed.version !== 'number' ||
      typeof parsed.signature !== 'string' ||
      typeof parsed.ranAt !== 'number'
    ) {
      return null
    }
    return { version: parsed.version, signature: parsed.signature, ranAt: parsed.ranAt }
  } catch {
    return null
  }
}

async function writeMarker(coversDir: string): Promise<void> {
  const marker: Marker = {
    version: MIGRATION_VERSION,
    signature: MIGRATION_SIGNATURE,
    ranAt: Date.now(),
  }
  await writeFile(
    path.join(coversDir, MARKER_FILENAME),
    JSON.stringify(marker),
    'utf8',
  )
}

async function migrateLegacyFile(
  coversDir: string,
  filename: string,
): Promise<boolean> {
  const baseName = coverBaseName(filename)
  if (!baseName) return false
  if (await coverVariantsExist(coversDir, baseName)) return false
  const buffer = await readFile(path.join(coversDir, filename))
  await deleteCoverVariantFiles(coversDir, baseName)
  await writeCoverVariants(coversDir, buffer, baseName)
  await prisma.book.updateMany({
    where: { coverPath: { in: legacyAliases(baseName) } },
    data: { coverPath: variantFilename(baseName, COVER_FULL_WIDTH) },
  })
  await unlink(path.join(coversDir, filename))
  return true
}

async function collectReferencedNames(): Promise<Set<string>> {
  const books = await prisma.book.findMany({
    select: { coverPath: true },
  })
  const referenced = new Set<string>()
  for (const { coverPath } of books) {
    if (!coverPath) continue
    const baseName = coverBaseName(coverPath)
    if (!baseName) continue
    for (const variant of COVER_VARIANTS) {
      referenced.add(variantFilename(baseName, variant.width))
    }
  }
  return referenced
}

async function removeOrphans(
  coversDir: string,
  filenames: string[],
  log: CoverMigrationLog,
): Promise<number> {
  const referenced = await collectReferencedNames()
  const cutoff = Date.now() - ORPHAN_GRACE_MS
  const removed: string[] = []
  for (const filename of filenames) {
    if (!filename.toLowerCase().endsWith('.webp')) continue
    if (referenced.has(filename)) continue
    const baseName = coverBaseName(filename)
    if (!baseName) continue
    if (!isVariantFilename(filename) && !(await coverVariantsExist(coversDir, baseName))) {
      log('warn', `Kept cover source ${filename} because its variants are missing`)
      continue
    }
    const target = path.join(coversDir, filename)
    try {
      const stats = await stat(target)
      if (stats.mtimeMs > cutoff) continue
      await unlink(target)
      removed.push(filename)
    } catch (err) {
      log('warn', `Could not inspect cover file ${filename}`, err)
    }
  }
  return removed.length
}

async function run(coversDir: string, log: CoverMigrationLog): Promise<CoverMigrationResult> {
  const marker = await readMarker(coversDir)
  if (
    marker !== null &&
    marker.version === MIGRATION_VERSION &&
    marker.signature === MIGRATION_SIGNATURE &&
    Date.now() - marker.ranAt < MIGRATION_INTERVAL_MS
  ) {
    return { migrated: 0, removed: 0 }
  }

  const entries = await readdir(coversDir, { withFileTypes: true })
  const filenames = entries.filter((entry) => entry.isFile()).map((entry) => entry.name)

  let migrated = 0
  for (const filename of filenames) {
    if (!filename.toLowerCase().endsWith('.webp')) continue
    if (isVariantFilename(filename)) continue
    try {
      if (await migrateLegacyFile(coversDir, filename)) {
        migrated += 1
        log('info', `Migrated cover ${filename} to variant layout`)
      }
    } catch (err) {
      log('error', `Could not migrate cover ${filename}`, err)
    }
  }

  const removed = await removeOrphans(coversDir, filenames, log)
  await writeMarker(coversDir)
  log(
    'info',
    `Cover migration finished: ${migrated} migrated, ${removed} orphaned removed`,
  )
  return { migrated, removed }
}

export function runCoverMigration(
  coversDir: string,
  log: CoverMigrationLog,
): Promise<CoverMigrationResult> {
  running ??= run(coversDir, log).finally(() => {
    running = null
  })
  return running
}
