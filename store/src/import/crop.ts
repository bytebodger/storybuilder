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
