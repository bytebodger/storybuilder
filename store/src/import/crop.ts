/**
 * Cutting a region out of a map SVG.
 *
 * By `viewBox`, not by editing geometry: everything outside the frame simply
 * stops being drawn, and everything inside keeps its full vector detail. That is
 * the whole reason to hold a map as SVG rather than a raster - one export can be
 * looked at whole, or at one country, without a second export.
 *
 * The file does not shrink. Its geometry is all still there, unreferenced by the
 * view, which is the price of the crop being lossless and reversible.
 */
export interface Box {
  x0: number
  y0: number
  x1: number
  y1: number
}

export interface CropSource {
  width: number
  height: number
}

/** Grow a box outward by a fraction of its longer side, clamped to the canvas. */
export function pad(box: Box, fraction: number, canvas: CropSource): Box {
  const amount = Math.max(box.x1 - box.x0, box.y1 - box.y0) * fraction
  return {
    x0: Math.max(0, box.x0 - amount),
    y0: Math.max(0, box.y0 - amount),
    x1: Math.min(canvas.width, box.x1 + amount),
    y1: Math.min(canvas.height, box.y1 + amount),
  }
}

export const boxOf = (points: { x: number; y: number }[]): Box => ({
  x0: Math.min(...points.map((p) => p.x)),
  y0: Math.min(...points.map((p) => p.y)),
  x1: Math.max(...points.map((p) => p.x)),
  y1: Math.max(...points.map((p) => p.y)),
})

/**
 * Tells land from water at any point on the canvas.
 *
 * Must be built from Azgaar's *regular* grid, not its packed cells. The packed
 * graph re-samples: it keeps cells dense along coasts and very sparse in open
 * sea, so counting packed cells in a stretch of ocean can find a handful, half
 * of them a passing island, and report the water as mostly land. The regular
 * lattice covers the canvas evenly and is the only honest way to ask "what is
 * here".
 */
export type LandAt = (x: number, y: number) => boolean

export function gridSampler(
  heights: number[],
  layout: { spacing: number; cellsX: number },
  seaLevel = 20,
): LandAt {
  const { spacing, cellsX } = layout
  return (x, y) => {
    const cx = Math.min(cellsX - 1, Math.max(0, Math.floor(x / spacing)))
    const cy = Math.max(0, Math.floor(y / spacing))
    const h = heights[cy * cellsX + cx]
    return h !== undefined && h >= seaLevel
  }
}

/** What share of a strip along one edge of a box is land. */
function edgeLand(box: Box, side: Side, sample: LandAt, band: number, step = 4): number {
  const { x0, y0, x1, y1 } = box
  const strip =
    side === 'N' ? { a: x0, b: y0, c: x1, d: y0 + band }
    : side === 'S' ? { a: x0, b: y1 - band, c: x1, d: y1 }
    : side === 'W' ? { a: x0, b: y0, c: x0 + band, d: y1 }
    : { a: x1 - band, b: y0, c: x1, d: y1 }

  let total = 0
  let land = 0
  for (let x = strip.a; x <= strip.c; x += step) {
    for (let y = strip.b; y <= strip.d; y += step) {
      total++
      if (sample(x, y)) land++
    }
  }
  return total === 0 ? 1 : land / total
}

type Side = 'N' | 'S' | 'W' | 'E'

export interface Grown {
  box: Box
  /** True when land closed around the frame; false when the walk gave up. */
  closed: boolean
  /** Why it stopped, in a phrase, for a caller that has to explain itself. */
  reason: string
}

/**
 * Grow a frame until it is ringed by land.
 *
 * For a label written across open water, naming a stretch of sea the generator
 * has no object for: a named sea is the space between coasts, so the frame is
 * the smallest one whose edges are mostly shore. Water still reaches the border
 * wherever the sea genuinely opens out - a mouth, a strait - and that is the
 * point rather than a fault.
 *
 * The weakest edge grows first, so effort goes where the frame is most open,
 * and a side that has run off the canvas stops being counted.
 *
 * Not every named water closes. A strait is a passage, open at both ends by
 * definition, and a frame around one never becomes a ring of land - so the walk
 * gives up when growing stops helping, rather than swallowing the whole map.
 */
export function growToShore(
  start: Box,
  sample: LandAt,
  canvas: CropSource,
  options: {
    step?: number
    enclose?: number
    band?: number
    maxSteps?: number
    /**
     * How far one side may grow without finding shore before it gives up, in
     * pixels. Defaults to 40% of the map's longer dimension - short enough to
     * abandon a passage, long enough to cross an ocean to its far coast.
     */
    reach?: number
    /**
     * No side may exceed this share of the canvas. Generous, because a sea can
     * legitimately fill most of a map - and because a walk that hits this is
     * not returning its sprawl anyway, only reporting that it failed.
     */
    maxSpan?: number
  } = {},
): Grown {
  const {
    step = 20,
    enclose = 0.9,
    band = 12,
    maxSteps = 500,
    reach = Math.max(canvas.width, canvas.height) * 0.4,
    maxSpan = 0.8,
  } = options
  const patience = Math.max(1, Math.ceil(reach / step))
  const box = { ...start }

  const sides: Side[] = ['N', 'S', 'W', 'E']
  const settled = new Set<Side>()
  const stale: Record<Side, number> = { N: 0, S: 0, W: 0, E: 0 }
  const best: Record<Side, number> = { N: -1, S: -1, W: -1, E: -1 }

  const edgeAt = (side: Side) => ({ N: box.y0, S: box.y1, W: box.x0, E: box.x1 })[side]
  const limitOf = (side: Side) => ({ N: 0, S: canvas.height, W: 0, E: canvas.width })[side]

  for (let i = 0; i < maxSteps; i++) {
    const open = sides
      .filter((s) => !settled.has(s))
      .map((side) => ({ side, land: edgeLand(box, side, sample, band) }))
      .filter((s) => s.land < enclose)

    if (open.length === 0) break

    if (box.x1 - box.x0 > canvas.width * maxSpan || box.y1 - box.y0 > canvas.height * maxSpan) {
      return giveUp('the frame reached its size limit before land closed it')
    }

    // The most open side grows first, so effort goes where the frame leaks.
    const weakest = open.reduce((a, b) => (a.land <= b.land ? a : b))
    const side = weakest.side

    if (edgeAt(side) === limitOf(side)) {
      // The water runs off the map here. Nothing further out to find.
      settled.add(side)
      continue
    }

    if (side === 'N') box.y0 = Math.max(0, box.y0 - step)
    else if (side === 'S') box.y1 = Math.min(canvas.height, box.y1 + step)
    else if (side === 'W') box.x0 = Math.max(0, box.x0 - step)
    else box.x1 = Math.min(canvas.width, box.x1 + step)

    /*
     * Staleness is judged per side, not per walk.
     *
     * A side crossing open water toward the map edge improves nothing for many
     * steps and is still doing the right thing; a side that has grown a long
     * way without finding shore is not going to. Judging the walk as a whole
     * confuses the two and abandons a basin halfway to its coast.
     */
    const after = edgeLand(box, side, sample, band)
    if (after > best[side] + 0.01) {
      best[side] = after
      stale[side] = 0
    } else if (++stale[side] > patience) {
      settled.add(side)
    }
  }

  const ring = enclosure(box, sample, band)
  if (sides.every((s) => ring[s] >= enclose)) {
    return { box, closed: true, reason: 'land closed around the frame' }
  }
  return giveUp('the water stayed open however far the frame grew - a passage rather than a basin')

  /**
   * A frame that never closed is not improved by being enormous.
   *
   * Half a map around a strait is worse than a close view of it: the caller is
   * told the walk failed and given something usable to look at, and can pass an
   * explicit box if it wants a different one.
   */
  function giveUp(reason: string): Grown {
    // Enough context to read the feature, with a floor so a short label still
    // yields a usable view rather than a postage stamp.
    const span = Math.max(start.x1 - start.x0, start.y1 - start.y0)
    const margin = Math.max(span * 0.6, canvas.width * 0.05)
    return {
      box: {
        x0: Math.max(0, start.x0 - margin),
        y0: Math.max(0, start.y0 - margin),
        x1: Math.min(canvas.width, start.x1 + margin),
        y1: Math.min(canvas.height, start.y1 + margin),
      },
      closed: false,
      reason,
    }
  }
}

/** How enclosed a finished frame is, per side. Reported so a crop can be judged. */
export function enclosure(box: Box, sample: LandAt, band = 12): Record<Side, number> {
  return {
    N: edgeLand(box, 'N', sample, band),
    S: edgeLand(box, 'S', sample, band),
    W: edgeLand(box, 'W', sample, band),
    E: edgeLand(box, 'E', sample, band),
  }
}

/**
 * Apply a box to an SVG by rewriting the root element's view.
 *
 * Azgaar's export sets width and height and no viewBox, so the canvas and the
 * view are the same thing. Adding one separates them: the drawing is unchanged
 * and the window onto it moves.
 */
export function cropSvg(svg: string, box: Box): string {
  const width = Math.round(box.x1 - box.x0)
  const height = Math.round(box.y1 - box.y0)
  if (width <= 0 || height <= 0) throw new Error('A crop needs a box with area')

  const open = /<svg\b[^>]*>/.exec(svg)
  if (!open) throw new Error('No <svg> element found')

  let tag = open[0]
    .replace(/\s+width="[^"]*"/, '')
    .replace(/\s+height="[^"]*"/, '')
    .replace(/\s+viewBox="[^"]*"/, '')
  tag = tag.replace(
    /^<svg\b/,
    `<svg width="${width}" height="${height}" viewBox="${Math.round(box.x0)} ${Math.round(box.y0)} ${width} ${height}"`,
  )
  return svg.slice(0, open.index) + tag + svg.slice(open.index + open[0].length)
}

/**
 * Move the coordinate labels onto the edges of a cropped frame.
 *
 * Azgaar writes them once, along the top and left of the whole canvas: meridian
 * labels at y=7, parallel labels at x=15. Crop anywhere but the corner and the
 * graticule survives while its numbers do not - dashed lines across a map with
 * nothing to say which lines they are.
 *
 * The labels are moved rather than recomputed, so the degrees shown are exactly
 * the ones the generator worked out, and a label whose line falls outside the
 * frame is dropped instead of pointing at nothing.
 *
 * The group is also lifted to the end of the file so it paints last. Azgaar
 * draws it early, which is harmless while the labels sit out in the ocean
 * margin of a whole map - and not harmless at all once a crop moves them inside,
 * where terrain, borders and roads are all drawn over the top of them.
 */
export function relabelCoordinates(svg: string, box: Box, inset = 9): string {
  const group = /<g id="coordinateLabels"([^>]*)>([\s\S]*?)<\/g>/.exec(svg)
  if (!group) return svg

  const [whole, attrs, body] = group
  const kept: string[] = []

  for (const match of body.matchAll(/<text\b([^>]*)>([\s\S]*?)<\/text>/g)) {
    const [, textAttrs, label] = match
    const x = Number(/\bx="(-?[\d.]+)"/.exec(textAttrs)?.[1])
    const y = Number(/\by="(-?[\d.]+)"/.exec(textAttrs)?.[1])
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue

    // Which edge it was written against says which coordinate it names.
    const isMeridian = y < 20
    let moved: string | null = null

    // A label sits on the line it names, so a line hard against the frame's
    // edge would have its label half outside. Nudged just inside instead: a few
    // pixels off its line still reads as belonging to it; a clipped glyph does
    // not read at all.
    if (isMeridian && x >= box.x0 && x <= box.x1) {
      moved = setXY(textAttrs, clamp(x, box.x0 + inset * 2.5, box.x1 - inset * 2.5), box.y0 + inset)
    } else if (!isMeridian && y >= box.y0 && y <= box.y1) {
      moved = setXY(textAttrs, box.x0 + inset * 1.7, clamp(y, box.y0 + inset, box.y1 - inset))
    }
    if (moved) kept.push(`<text${moved}>${label}</text>`)
  }

  const withoutGroup = svg.replace(whole, '')
  if (kept.length === 0) return withoutGroup

  const rebuilt = `<g id="coordinateLabels"${attrs}>${kept.join('')}</g>`
  const close = withoutGroup.lastIndexOf('</svg>')
  if (close === -1) return withoutGroup + rebuilt
  return withoutGroup.slice(0, close) + rebuilt + withoutGroup.slice(close)
}

const round1 = (n: number) => Math.round(n * 10) / 10
const clamp = (n: number, lo: number, hi: number) => (lo > hi ? n : Math.min(hi, Math.max(lo, n)))

const setXY = (attrs: string, x: number, y: number) =>
  attrs
    .replace(/\bx="[-\d.]+"/, `x="${round1(x)}"`)
    .replace(/\by="[-\d.]+"/, `y="${round1(y)}"`)

/**
 * Fit the vignette to a cropped frame, or take it off.
 *
 * The vignette is the one layer whose geometry is written in percentages:
 *
 *   <g id="vignette" mask="url(#vignette-mask)" opacity="0.3" fill="#000000">
 *     <rect x="0" y="0" width="100%" height="100%"/>
 *   </g>
 *
 * A percentage resolves against the viewport, but the rect still starts at user
 * space (0,0) - and a viewBox moves where the view begins without moving that
 * origin. Crop a region that overlaps the top-left of the canvas and the overlay
 * covers only part of the frame: a darker band across the top, ending in mid-air.
 * Crop anywhere else and it misses the frame entirely, which is why this went
 * unnoticed until a frame reached back toward the origin.
 *
 * By default it is removed. It is a flourish for a whole map, and on a region
 * crop it darkens exactly the coastline the crop was made to show.
 */
export function fitVignette(svg: string, box: Box, keep = false): string {
  const layer = /<g id="vignette"[\s\S]*?<\/g>/.exec(svg)
  if (!layer) return svg
  if (!keep) return svg.replace(layer[0], '')

  const x = round1(box.x0)
  const y = round1(box.y0)
  const w = round1(box.x1 - box.x0)
  const h = round1(box.y1 - box.y0)
  const inset = 0.004

  // The overlay, in user space rather than as a share of a viewport whose
  // origin it does not share.
  let out = svg.replace(
    layer[0],
    layer[0].replace(
      /<rect\b[^>]*\/>/,
      `<rect x="${x}" y="${y}" width="${w}" height="${h}"/>`,
    ),
  )

  // The mask that shapes it has to move with it, or the soft edge lands
  // somewhere the overlay no longer is.
  const mask = /<mask id="vignette-mask">[\s\S]*?<\/mask>/.exec(out)
  if (mask) {
    const fitted = mask[0]
      .replace(
        /<rect\b[^>]*fill="white"[^>]*\/>/,
        `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="white"/>`,
      )
      .replace(
        /<rect id="vignette-rect"[^>]*\/>/,
        `<rect id="vignette-rect" fill="black" x="${round1(box.x0 + w * inset)}" ` +
          `y="${round1(box.y0 + h * inset)}" width="${round1(w * (1 - inset * 2))}" ` +
          `height="${round1(h * (1 - inset * 2))}" rx="${round1(w * 0.05)}" ` +
          `ry="${round1(h * 0.05)}" filter="blur(20px)"/>`,
      )
    out = out.replace(mask[0], fitted)
  }
  return out
}
