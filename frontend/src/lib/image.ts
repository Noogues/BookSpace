const MAX_EDGE = 1600
const QUALITY = 0.85
const SKIP_BELOW_BYTES = 300 * 1024

let webpEncoding: boolean | null = null

function supportsWebpEncoding(): boolean {
  if (webpEncoding !== null) return webpEncoding
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  webpEncoding = canvas.toDataURL('image/webp').startsWith('data:image/webp')
  return webpEncoding
}

function rebuild(blob: Blob, file: File, mimeType: string): File {
  const base = file.name.replace(/\.[^.]+$/, '') || 'cover'
  const extension = mimeType === 'image/webp' ? '.webp' : '.jpg'
  return new File([blob], `${base}${extension}`, {
    type: mimeType,
    lastModified: file.lastModified,
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, QUALITY)
  })
}

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  if (file.size <= SKIP_BELOW_BYTES) return file
  if (typeof createImageBitmap !== 'function') return file

  let bitmap: ImageBitmap | null = null
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const longestEdge = Math.max(bitmap.width, bitmap.height)
    const scale = Math.min(1, MAX_EDGE / longestEdge)
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) return file
    context.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()
    bitmap = null

    const mimeType = supportsWebpEncoding() ? 'image/webp' : 'image/jpeg'
    const blob = await canvasToBlob(canvas, mimeType)
    if (!blob || blob.size >= file.size) return file

    return rebuild(blob, file, mimeType)
  } catch {
    return file
  } finally {
    bitmap?.close()
  }
}
