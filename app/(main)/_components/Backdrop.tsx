'use client'

import { useEffect, useRef, useState } from 'react'

type Mode =
  | 'none'
  | 'grid'
  | 'dots'
  | 'rain'
  | 'stars'
  | 'embed'
  | 'scan'
  | 'waves'
  | 'sonar'
  | 'flow'
  | 'halftone'
  | 'sun'
  | 'weave'

const MODES: Mode[] = [
  'none',
  'grid',
  'dots',
  'rain',
  'stars',
  'embed',
  'scan',
  'waves',
  'sonar',
  'flow',
  'halftone',
  'sun',
  'weave',
]

type Colors = {
  accent: string
  accent2: string
  accent3: string
  line: string
  bg: string
}

const DEFAULT_COLORS: Colors = {
  accent: '#ff6b35',
  accent2: '#ffb03a',
  accent3: '#7c3aed',
  line: 'rgba(245,240,234,0.12)',
  bg: '#0a0908',
}

const MAX_PARTICLES = 180
const MAX_DPR = 2

function readVars(): { mode: Mode; colors: Colors } {
  const styles = getComputedStyle(document.documentElement)
  const rawMode = styles.getPropertyValue('--prism-backdrop').trim()
  const mode: Mode = ((MODES as string[]).includes(rawMode) ? rawMode : 'none') as Mode
  const accent = styles.getPropertyValue('--prism-accent').trim() || DEFAULT_COLORS.accent
  const accent2 = styles.getPropertyValue('--prism-accent-2').trim() || DEFAULT_COLORS.accent2
  const accent3 = styles.getPropertyValue('--prism-accent-3').trim() || DEFAULT_COLORS.accent3
  const line = styles.getPropertyValue('--prism-line').trim() || DEFAULT_COLORS.line
  const bg = styles.getPropertyValue('--prism-bg').trim() || DEFAULT_COLORS.bg
  return { mode, colors: { accent, accent2, accent3, line, bg } }
}

// particle shapes for each mode, kept simple and cheap
type DotP = { x: number; y: number; r: number; vy: number; phase: number; hueMix: number }
type RainP = { x: number; y: number; len: number; speed: number; alpha: number }
type StarP = { x: number; y: number; r: number; alpha: number; twinkleSpeed: number; twinklePhase: number }
type EmbedP = { x: number; y: number; vx: number; vy: number; hueMix: number }
type BlipP = { angle: number; dist: number; lit: number }
type BlobP = { x: number; y: number; vx: number; vy: number; r: number; hueMix: number }
type MoteP = { x: number; y: number; r: number; vy: number; phase: number; alpha: number }

export default function Backdrop() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  // start unmounted so server and first client paint agree; flip on once we
  // know the viewport is wide enough (avoids a hydration mismatch)
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    const check = () => setShouldRender(window.innerWidth >= 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (!shouldRender) return

    const canvas = canvasRef.current
    if (!canvas) return
    const canvasEl: HTMLCanvasElement = canvas
    const context2d = canvas.getContext('2d')
    if (!context2d) return
    // explicit non-null type so nested closures below don't lose the narrowing
    const ctx: CanvasRenderingContext2D = context2d

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let mode: Mode = 'none'
    let colors: Colors = DEFAULT_COLORS
    let width = 0
    let height = 0
    let dpr = 1

    let dots: DotP[] = []
    let rain: RainP[] = []
    let stars: StarP[] = []
    let embed: EmbedP[] = []
    let embedLinksBuilt = false
    let blips: BlipP[] = []
    let blobs: BlobP[] = []
    let motes: MoteP[] = []

    let sweepAngle = 0
    let halftoneT = 0
    // Starts part-drawn so the first frame already shows a figure.
    let kolamProgress = 0.3

    let pointerX = -9999
    let pointerY = -9999
    let scanY = 0
    let waveT = 0
    let driftT = 0

    let rafId: number | null = null
    let running = false
    let hidden = document.hidden
    let inView = true
    let resizeTimeout: ReturnType<typeof setTimeout> | null = null

    function seedParticles() {
      const area = width * height
      const count = Math.min(MAX_PARTICLES, Math.max(24, Math.floor(area / 14000)))

      dots = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 1 + Math.random() * 2,
        vy: 0.15 + Math.random() * 0.35,
        phase: Math.random() * Math.PI * 2,
        hueMix: Math.random(),
      }))

      rain = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        len: 20 + Math.random() * 60,
        speed: 4 + Math.random() * 8,
        alpha: 0.15 + Math.random() * 0.4,
      }))

      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 0.5 + Math.random() * 1.5,
        alpha: 0.3 + Math.random() * 0.7,
        twinkleSpeed: 0.5 + Math.random() * 1.5,
        twinklePhase: Math.random() * Math.PI * 2,
      }))

      const embedCount = Math.min(90, count)
      const clusterCount = 4
      const clusters = Array.from({ length: clusterCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
      }))
      embed = Array.from({ length: embedCount }, (_, i) => {
        const c = clusters[i % clusterCount]
        const spread = Math.min(width, height) * 0.18
        return {
          x: c.x + (Math.random() - 0.5) * spread,
          y: c.y + (Math.random() - 0.5) * spread,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15,
          hueMix: Math.random(),
        }
      })
      embedLinksBuilt = true

      // Sonar contacts: fixed bearings and ranges, so the sweep finds the same
      // objects on every pass the way a real display would.
      blips = Array.from({ length: 9 }, () => ({
        angle: Math.random() * Math.PI * 2,
        dist: 0.18 + Math.random() * 0.72,
        lit: 0,
      }))

      blobs = Array.from({ length: 7 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r: Math.min(width, height) * (0.14 + Math.random() * 0.2),
        hueMix: Math.random(),
      }))

      motes = Array.from({ length: Math.min(70, count) }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 0.6 + Math.random() * 1.6,
        vy: 0.08 + Math.random() * 0.22,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.15 + Math.random() * 0.5,
      }))
    }

    function resize() {
      const rect = canvasEl.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      width = rect.width
      height = rect.height
      canvasEl.width = Math.max(1, Math.floor(width * dpr))
      canvasEl.height = Math.max(1, Math.floor(height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      seedParticles()
    }

    function mixColor(hex: string, hex2: string, t: number): string {
      const c1 = hexToRgb(hex)
      const c2 = hexToRgb(hex2)
      if (!c1 || !c2) return hex
      const r = Math.round(c1.r + (c2.r - c1.r) * t)
      const g = Math.round(c1.g + (c2.g - c1.g) * t)
      const b = Math.round(c1.b + (c2.b - c1.b) * t)
      return `rgb(${r}, ${g}, ${b})`
    }

    function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
      const clean = hex.trim().replace('#', '')
      if (clean.length !== 6 && clean.length !== 3) return null
      const full =
        clean.length === 3
          ? clean.split('').map((c) => c + c).join('')
          : clean
      const num = parseInt(full, 16)
      if (Number.isNaN(num)) return null
      return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 }
    }

    function drawGrid() {
      ctx.clearRect(0, 0, width, height)
      const spacing = 56
      const offsetX = (driftT * 6) % spacing
      const offsetY = (driftT * 4) % spacing
      ctx.strokeStyle = colors.line
      ctx.lineWidth = 1

      for (let x = -spacing + offsetX; x < width + spacing; x += spacing) {
        ctx.globalAlpha = 0.5
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }
      for (let y = -spacing + offsetY; y < height + spacing; y += spacing) {
        ctx.globalAlpha = 0.5
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }

      // brighter intersections near pointer
      if (pointerX > -100) {
        ctx.globalAlpha = 1
        ctx.fillStyle = colors.accent
        for (let x = -spacing + offsetX; x < width + spacing; x += spacing) {
          for (let y = -spacing + offsetY; y < height + spacing; y += spacing) {
            const dx = x - pointerX
            const dy = y - pointerY
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < 160) {
              const a = (1 - dist / 160) * 0.5
              ctx.globalAlpha = a
              ctx.beginPath()
              ctx.arc(x, y, 2, 0, Math.PI * 2)
              ctx.fill()
            }
          }
        }
      }
      ctx.globalAlpha = 1
    }

    function drawDots() {
      ctx.clearRect(0, 0, width, height)
      for (const d of dots) {
        d.y -= d.vy
        d.x += Math.sin(driftT * 0.5 + d.phase) * 0.1
        if (d.y < -10) {
          d.y = height + 10
          d.x = Math.random() * width
        }
        ctx.globalAlpha = 0.35
        ctx.fillStyle = mixColor(colors.accent, colors.accent2, d.hueMix)
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    function drawRain() {
      ctx.clearRect(0, 0, width, height)
      ctx.lineWidth = 1
      for (const r of rain) {
        r.y += r.speed
        if (r.y - r.len > height) {
          r.y = -Math.random() * height * 0.3
          r.x = Math.random() * width
        }
        ctx.globalAlpha = r.alpha
        ctx.strokeStyle = colors.accent2
        ctx.beginPath()
        ctx.moveTo(r.x, r.y - r.len)
        ctx.lineTo(r.x, r.y)
        ctx.stroke()
      }
      ctx.globalAlpha = 1
    }

    function drawStars() {
      ctx.clearRect(0, 0, width, height)
      for (const s of stars) {
        s.x -= 0.03
        if (s.x < -5) s.x = width + 5
        const twinkle = 0.5 + 0.5 * Math.sin(driftT * s.twinkleSpeed + s.twinklePhase)
        ctx.globalAlpha = s.alpha * (0.6 + 0.4 * twinkle)
        ctx.fillStyle = colors.line
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    function drawEmbed() {
      ctx.clearRect(0, 0, width, height)
      for (const p of embed) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > width) p.vx *= -1
        if (p.y < 0 || p.y > height) p.vy *= -1
      }
      // connect close points
      ctx.lineWidth = 1
      for (let i = 0; i < embed.length; i++) {
        for (let j = i + 1; j < embed.length; j++) {
          const a = embed[i]
          const b = embed[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 90) {
            ctx.globalAlpha = (1 - dist / 90) * 0.25
            ctx.strokeStyle = colors.line
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }
      for (const p of embed) {
        ctx.globalAlpha = 0.6
        ctx.fillStyle = mixColor(colors.accent, colors.accent3, p.hueMix)
        ctx.beginPath()
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    function drawScan() {
      ctx.clearRect(0, 0, width, height)
      ctx.strokeStyle = colors.line
      ctx.lineWidth = 1
      ctx.globalAlpha = 0.25
      for (let y = 0; y < height; y += 3) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }
      scanY = (scanY + 0.6) % (height + 100)
      const grad = ctx.createLinearGradient(0, scanY - 60, 0, scanY + 60)
      grad.addColorStop(0, 'rgba(0,0,0,0)')
      grad.addColorStop(0.5, colors.accent)
      grad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.globalAlpha = 0.18
      ctx.fillStyle = grad
      ctx.fillRect(0, scanY - 60, width, 120)
      ctx.globalAlpha = 1
    }

    function drawWaves() {
      ctx.clearRect(0, 0, width, height)
      waveT += 0.006
      const layers = [
        { amp: 18, freq: 0.012, speed: 1, y: height * 0.35, color: colors.accent },
        { amp: 26, freq: 0.008, speed: 0.6, y: height * 0.55, color: colors.accent2 },
        { amp: 14, freq: 0.016, speed: 1.4, y: height * 0.72, color: colors.accent3 },
      ]
      ctx.lineWidth = 1
      for (const layer of layers) {
        ctx.globalAlpha = 0.25
        ctx.strokeStyle = layer.color
        ctx.beginPath()
        for (let x = 0; x <= width; x += 6) {
          const y = layer.y + Math.sin(x * layer.freq + waveT * layer.speed * 10) * layer.amp
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
      ctx.globalAlpha = 1
    }

    /**
     * Sonar — a slow bearing sweep over range rings, with contacts that light
     * when the beam crosses them and decay afterwards. The wedge is a single
     * conic-free arc fill; the decay is what sells it, so the sweep is
     * deliberately slower than any other mode here.
     */
    function drawSonar() {
      ctx.clearRect(0, 0, width, height)
      const cx = width * 0.5
      const cy = height * 0.5
      const maxR = Math.max(width, height) * 0.62

      ctx.strokeStyle = colors.line
      ctx.lineWidth = 1
      for (let i = 1; i <= 4; i++) {
        ctx.globalAlpha = 0.4
        ctx.beginPath()
        ctx.arc(cx, cy, (maxR / 4) * i, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.globalAlpha = 0.25
      for (let i = 0; i < 4; i++) {
        const a = (Math.PI / 2) * i
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.lineTo(cx + Math.cos(a) * maxR, cy + Math.sin(a) * maxR)
        ctx.stroke()
      }

      sweepAngle = (sweepAngle + 0.012) % (Math.PI * 2)

      // Trailing wedge, drawn as stacked slices so it fades behind the beam.
      const slices = 26
      const spread = 0.85
      for (let i = 0; i < slices; i++) {
        const t = i / slices
        ctx.globalAlpha = 0.1 * (1 - t)
        ctx.fillStyle = colors.accent
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.arc(
          cx,
          cy,
          maxR,
          sweepAngle - spread * t - spread / slices,
          sweepAngle - spread * t
        )
        ctx.closePath()
        ctx.fill()
      }

      ctx.globalAlpha = 0.7
      ctx.strokeStyle = colors.accent
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + Math.cos(sweepAngle) * maxR, cy + Math.sin(sweepAngle) * maxR)
      ctx.stroke()

      for (const b of blips) {
        let delta = sweepAngle - b.angle
        while (delta < 0) delta += Math.PI * 2
        while (delta > Math.PI * 2) delta -= Math.PI * 2
        if (delta < 0.05) b.lit = 1
        b.lit *= 0.985
        if (b.lit < 0.01) continue
        const bx = cx + Math.cos(b.angle) * maxR * b.dist
        const by = cy + Math.sin(b.angle) * maxR * b.dist
        ctx.globalAlpha = b.lit * 0.85
        ctx.fillStyle = colors.accent2
        ctx.beginPath()
        ctx.arc(bx, by, 2.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = b.lit * 0.25
        ctx.beginPath()
        ctx.arc(bx, by, 9 - b.lit * 4, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    /**
     * Flow — soft drifting masses in additive blend. No real metaball field
     * (that needs a per-pixel pass); overlapping radial falloffs under
     * 'lighter' read the same at this scale for a fraction of the cost.
     */
    function drawFlow() {
      ctx.clearRect(0, 0, width, height)
      ctx.globalCompositeOperation = 'lighter'
      for (const b of blobs) {
        b.x += b.vx
        b.y += b.vy
        if (b.x < -b.r || b.x > width + b.r) b.vx *= -1
        if (b.y < -b.r || b.y > height + b.r) b.vy *= -1
        const wobble = 1 + Math.sin(driftT * 0.6 + b.hueMix * 6) * 0.12
        const r = b.r * wobble
        const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r)
        const tint = mixColor(colors.accent, colors.accent3, b.hueMix)
        grad.addColorStop(0, tint)
        grad.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.globalAlpha = 0.3
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(b.x, b.y, r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1
    }

    /**
     * Halftone — a fixed print lattice whose dot gain rides a slow diagonal
     * wave. The lattice never moves; only the dot size does, which is what
     * separates it from the existing `dots` field.
     */
    function drawHalftone() {
      ctx.clearRect(0, 0, width, height)
      halftoneT += 0.01
      const pitch = 22
      const maxR = pitch * 0.34
      ctx.fillStyle = colors.line
      for (let y = pitch / 2; y < height + pitch; y += pitch) {
        for (let x = pitch / 2; x < width + pitch; x += pitch) {
          const wave =
            Math.sin(x * 0.006 + halftoneT) * 0.5 +
            Math.sin(y * 0.009 - halftoneT * 0.7) * 0.5
          const r = maxR * (0.25 + 0.75 * ((wave + 1) / 2))
          if (r < 0.3) continue
          ctx.globalAlpha = 0.55
          ctx.beginPath()
          ctx.arc(x, y, r, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.globalAlpha = 1
    }

    /**
     * Sun — angled light shafts drifting across the page with dust rising
     * through them. The only mode built for a light dimension: everything is
     * additive warmth rather than a mark on a dark field.
     */
    function drawSun() {
      ctx.clearRect(0, 0, width, height)

      // Light must be LIGHTER than the page it falls on. Painting the raw
      // accent at low alpha onto a cream ground darkens it, which reads as a
      // smudge rather than a shaft — so the accent is blended most of the way
      // to white first. Still theme-derived, just the light end of it.
      const tint = mixColor(colors.accent2, '#ffffff', 0.68)
      const shafts = [
        { offset: 0.1, w: 0.18, speed: 0.13 },
        { offset: 0.44, w: 0.28, speed: 0.09 },
        { offset: 0.76, w: 0.15, speed: 0.17 },
      ]
      // The shafts lean. The gradient has to lean with them: drawing an
      // axis-aligned gradient inside a skewed polygon clips it against the
      // slanted edges and leaves a hard diagonal seam down the page.
      const lean = 0.42
      ctx.save()
      ctx.transform(1, 0, -lean, 1, 0, 0)
      for (const s of shafts) {
        const drift = ((driftT * s.speed) % 1.8) - 0.4
        const x = (s.offset + drift * 0.1) * width
        const w = s.w * width
        const grad = ctx.createLinearGradient(x, 0, x + w, 0)
        grad.addColorStop(0, 'rgba(0,0,0,0)')
        grad.addColorStop(0.5, tint)
        grad.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.globalAlpha = 0.3
        ctx.fillStyle = grad
        // Widened vertically so the skew still covers the whole viewport.
        ctx.fillRect(x, -lean * height, w, height * (1 + lean * 2))
      }
      ctx.restore()

      for (const m of motes) {
        m.y -= m.vy
        m.x += Math.sin(driftT * 0.4 + m.phase) * 0.25
        if (m.y < -6) {
          m.y = height + 6
          m.x = Math.random() * width
        }
        // Dust is seen against the light, so it takes the darker accent.
        ctx.globalAlpha = m.alpha * 0.4
        ctx.fillStyle = colors.accent
        ctx.beginPath()
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    /**
     * Weave — a kolam. A pulli (dot) lattice with a single continuous line
     * looping around the dots, drawn progressively as though by hand, then
     * held and restarted. Segment count is derived from the lattice so it
     * scales with the viewport without re-seeding.
     */
    function drawWeave() {
      ctx.clearRect(0, 0, width, height)
      const pitch = 74
      const cols = Math.ceil(width / pitch) + 1
      const rows = Math.ceil(height / pitch) + 1
      const ox = (width - (cols - 1) * pitch) / 2
      const oy = (height - (rows - 1) * pitch) / 2

      ctx.fillStyle = colors.line
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.globalAlpha = 0.8
          ctx.beginPath()
          ctx.arc(ox + c * pitch, oy + r * pitch, 1.8, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      const loops = (cols - 1) * (rows - 1)
      // ~7s for a full figure, then a short hold, then it starts over. The
      // first draft took ~26s, which meant the page sat on a bare background
      // for the whole time anyone was actually looking at it.
      kolamProgress += 1 / (loops * 0.45 + 40)
      // Never restart from empty — a kolam is swept away and redrawn, but the
      // threshold is not bare while you watch.
      if (kolamProgress > 1.3) kolamProgress = 0.3
      const drawn = Math.floor(Math.min(1, kolamProgress) * loops)

      // Rounded diamonds on a checkerboard, each one looping around a pulli and
      // meeting its neighbours at the corners — the interlocking sikku figure.
      // The first attempt drew a 270-degree arc in every cell, which filled the
      // page with identical C shapes and read as wallpaper rather than a drawn
      // line. Half the cells, a finer stroke and a closed figure fixed it.
      ctx.strokeStyle = colors.accent
      ctx.lineWidth = 1.1
      ctx.lineJoin = 'round'
      const R = pitch * 0.5
      const k = R * 0.62
      for (let i = 0; i < drawn; i++) {
        const c = i % (cols - 1)
        const r = Math.floor(i / (cols - 1))
        if ((c + r) % 2 !== 0) continue
        const x = ox + c * pitch + pitch / 2
        const y = oy + r * pitch + pitch / 2
        // Age the stroke so the leading edge is brightest.
        ctx.globalAlpha = 0.14 + 0.26 * Math.min(1, (i + 1) / Math.max(1, drawn))
        ctx.beginPath()
        ctx.moveTo(x, y - R)
        ctx.quadraticCurveTo(x + k, y - k, x + R, y)
        ctx.quadraticCurveTo(x + k, y + k, x, y + R)
        ctx.quadraticCurveTo(x - k, y + k, x - R, y)
        ctx.quadraticCurveTo(x - k, y - k, x, y - R)
        ctx.stroke()
      }
      ctx.globalAlpha = 1
    }

    function drawFrame() {
      driftT += 0.016
      switch (mode) {
        case 'grid':
          drawGrid()
          break
        case 'dots':
          drawDots()
          break
        case 'rain':
          drawRain()
          break
        case 'stars':
          drawStars()
          break
        case 'embed':
          drawEmbed()
          break
        case 'scan':
          drawScan()
          break
        case 'waves':
          drawWaves()
          break
        case 'sonar':
          drawSonar()
          break
        case 'flow':
          drawFlow()
          break
        case 'halftone':
          drawHalftone()
          break
        case 'sun':
          drawSun()
          break
        case 'weave':
          drawWeave()
          break
        default:
          ctx.clearRect(0, 0, width, height)
      }
    }

    /**
     * Ambient backdrop, throttled to ~30fps.
     *
     * At 60fps this repaints the whole viewport every frame — at DPR 2 on a
     * 1728x992 window that is ~6.9M pixels of canvas work per frame, competing
     * with the main thread during a fast scroll and making the animation
     * visibly stutter. Nothing here is interactive, so half the frame rate is
     * indistinguishable and leaves the browser room to composite the scroll.
     */
    let lastFrame = 0
    const FRAME_MS = 1000 / 30

    function loop(now: number) {
      if (!running) return
      if (now - lastFrame >= FRAME_MS) {
        lastFrame = now
        drawFrame()
      }
      rafId = requestAnimationFrame(loop)
    }

    function stopLoop() {
      running = false
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
    }

    function startLoop() {
      if (running) return
      if (mode === 'none') return
      if (reduceMotion) {
        drawFrame()
        return
      }
      if (hidden || !inView) return
      running = true
      rafId = requestAnimationFrame(loop)
    }

    function applyTheme() {
      const next = readVars()
      mode = next.mode
      colors = next.colors
      stopLoop()
      if (mode === 'none') {
        ctx.clearRect(0, 0, width, height)
        return
      }
      if (reduceMotion) {
        drawFrame()
        return
      }
      startLoop()
    }

    function onResize() {
      if (resizeTimeout) clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        resize()
        if (mode === 'none') return
        if (reduceMotion) drawFrame()
      }, 150)
    }

    function onPointerMove(e: PointerEvent) {
      pointerX = e.clientX
      pointerY = e.clientY
    }

    function onVisibility() {
      hidden = document.hidden
      if (hidden) stopLoop()
      else startLoop()
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          inView = entry.isIntersecting
          if (!inView) stopLoop()
          else startLoop()
        }
      },
      { threshold: 0 }
    )
    io.observe(canvas)

    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName === 'data-prism-dimension') {
          applyTheme()
        }
      }
    })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-prism-dimension'] })

    resize()
    requestAnimationFrame(() => {
      applyTheme()
    })

    window.addEventListener('resize', onResize)
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      stopLoop()
      if (resizeTimeout) clearTimeout(resizeTimeout)
      io.disconnect()
      mo.disconnect()
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [shouldRender])

  if (!shouldRender) {
    return null
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        width: '100%',
        height: '100%',
        // Promote to its own compositing layer. A position:fixed element that
        // is not promoted gets repainted on every scroll frame together with
        // the page behind it, which is what makes the animation judder during
        // a fast scroll. translateZ(0) + will-change hand it to the GPU so
        // scrolling composites instead of repainting.
        transform: 'translateZ(0)',
        willChange: 'transform',
        // The canvas can never affect layout or paint outside its own box, so
        // let the browser skip it when computing the rest of the page.
        contain: 'strict',
      }}
    />
  )
}
