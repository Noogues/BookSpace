import { useEffect, useRef } from 'react'

interface Blob {
  x: number
  y: number
  r: number
  ax: number
  ay: number
  hue: string
  phase: number
}

interface Particle {
  x: number
  y: number
  size: number
  speedY: number
  swayAmp: number
  swayFreq: number
  phase: number
  alpha: number
  hue: string
}

const LIGHT_BLOBS: string[] = [
  'rgba(20, 184, 166, 0.07)',
  'rgba(129, 140, 248, 0.05)',
  'rgba(56, 189, 248, 0.05)',
  'rgba(251, 113, 133, 0.04)',
]
const DARK_BLOBS: string[] = [
  'rgba(45, 212, 191, 0.10)',
  'rgba(129, 140, 248, 0.08)',
  'rgba(56, 189, 248, 0.07)',
  'rgba(251, 113, 133, 0.05)',
]

const LIGHT_PARTICLES: string[] = [
  'rgba(20, 184, 166, 0.28)',
  'rgba(129, 140, 248, 0.24)',
  'rgba(56, 189, 248, 0.22)',
]
const DARK_PARTICLES: string[] = [
  'rgba(45, 212, 191, 0.32)',
  'rgba(129, 140, 248, 0.3)',
  'rgba(56, 189, 248, 0.28)',
]

function trailCount() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  return reduced ? 0 : 4
}

export function AmbientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let width = 0
    let height = 0
    let raf = 0
    let running = true
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const blobs: Blob[] = []
    const particles: Particle[] = []

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const isDark = () => document.documentElement.classList.contains('dark')

    const init = () => {
      const dark = isDark()
      const colors = dark ? DARK_BLOBS : LIGHT_BLOBS
      blobs.length = 0
      for (let i = 0; i < 4; i += 1) {
        blobs.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: height * (0.4 + Math.random() * 0.35),
          ax: 0.00008 + Math.random() * 0.00005,
          ay: 0.00007 + Math.random() * 0.00004,
          hue: colors[i % colors.length],
          phase: Math.random() * Math.PI * 2,
        })
      }
      const pColors = dark ? DARK_PARTICLES : LIGHT_PARTICLES
      particles.length = 0
      const count = reduced ? Math.floor(width / 160) : Math.floor(width / 70)
      for (let i = 0; i < count; i += 1) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: 0.8 + Math.random() * 1.4,
          speedY: 0.1 + Math.random() * 0.25,
          swayAmp: 6 + Math.random() * 18,
          swayFreq: 0.3 + Math.random() * 0.6,
          phase: Math.random() * Math.PI * 2,
          alpha: 0.12 + Math.random() * 0.24,
          hue: pColors[Math.floor(Math.random() * pColors.length)],
        })
      }
    }

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height)

      // Gradient mesh blobs (drifting radial glows)
      for (const blob of blobs) {
        const t = time * 0.00003
        const x = blob.x + Math.sin(t + blob.phase) * width * blob.ax * 1e4
        const y = blob.y + Math.cos(t * 0.85 + blob.phase * 1.7) * height * blob.ay * 1e4
        const grad = ctx.createRadialGradient(x, y, 0, x, y, blob.r)
        grad.addColorStop(0, blob.hue)
        grad.addColorStop(1, 'transparent')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, width, height)
      }

      // Floating particles with motion trails (soft blur)
      const trail = trailCount()
      for (const p of particles) {
        p.y -= p.speedY
        p.x += Math.sin(time * 0.0001 * p.swayFreq + p.phase) * p.swayAmp * 0.02
        if (p.y < -8) {
          p.y = height + 8
          p.x = Math.random() * width
        }

        const py = p.y
        const px = p.x
        for (let i = trail; i >= 0; i -= 1) {
          const fade = 0.12 + ((trail - i) / trail) * p.alpha * 0.5
          ctx.beginPath()
          ctx.arc(px, py + i * p.speedY * 4, p.size * (1 - i * 0.05), 0, Math.PI * 2)
          ctx.fillStyle = p.hue.includes('rgba') ? p.hue.replace(/[\d.]+\)$/, `${fade.toFixed(2)})`) : p.hue
          if (!reduced || i === 0) ctx.fill()
        }
      }
    }

    const loop = (time: number) => {
      if (!running) return
      draw(time)
      raf = requestAnimationFrame(loop)
    }

    const observer = new MutationObserver(() => {
      init()
      if (reduced) draw(0)
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    resize()
    init()
    raf = requestAnimationFrame(loop)

    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', onVisibility)

    function onVisibility() {
      if (document.hidden) {
        cancelAnimationFrame(raf)
      } else if (running) {
        raf = requestAnimationFrame(loop)
      }
    }

    return () => {
      running = false
      cancelAnimationFrame(raf)
      observer.disconnect()
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_10%_0%,rgba(255,255,255,0.60)_0%,rgba(244,240,233,0)_55%)] dark:bg-[radial-gradient(120%_90%_at_10%_0%,rgba(129,140,248,0.08)_0%,rgba(10,11,18,0)_60%)]" />
      <canvas ref={canvasRef} className="h-full w-full" />
      <div className="absolute bottom-0 h-32 w-full bg-gradient-to-t from-paper-50/85 to-transparent dark:from-ink-950/85" />
    </div>
  )
}