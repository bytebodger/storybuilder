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
 * Grow a box until each side meets a shore.
 *
 * For a label written across open water, which names a stretch of sea that the
 * generator has no object for: the sea is not a feature, it is the space
 * between coasts, so the frame is found by walking outward until land appears.
 *
 * A single island would stop the walk early, so a side is only satisfied once a
 * meaningful share of the strip beyond it is land.
 */
export function growToShore(
  start: Box,
  cells: { x: number; y: number; land: boolean }[],
  canvas: CropSource,
  options: { step?: number; shore?: number; maxSteps?: number } = {},
): Box {
  const { step = 25, shore = 0.3, maxSteps = 300 } = options
  let { x0, y0, x1, y1 } = start

  const landFraction = (a: number, b: number, c: number, d: number) => {
    let total = 0
    let land = 0
    for (const cell of cells) {
      if (cell.x < a || cell.x > c || cell.y < b || cell.y > d) continue
      total++
      if (cell.land) land++
    }
    return total === 0 ? 0 : land / total
  }

  for (let i = 0; i < maxSteps; i++) {
    let grew = false
    if (x0 > 0 && landFraction(Math.max(0, x0 - step), y0, x0, y1) < shore) {
      x0 = Math.max(0, x0 - step)
      grew = true
    }
    if (x1 < canvas.width && landFraction(x1, y0, Math.min(canvas.width, x1 + step), y1) < shore) {
      x1 = Math.min(canvas.width, x1 + step)
      grew = true
    }
    if (y0 > 0 && landFraction(x0, Math.max(0, y0 - step), x1, y0) < shore) {
      y0 = Math.max(0, y0 - step)
      grew = true
    }
    if (y1 < canvas.height && landFraction(x0, y1, x1, Math.min(canvas.height, y1 + step)) < shore) {
      y1 = Math.min(canvas.height, y1 + step)
      grew = true
    }
    if (!grew) break
  }
  return { x0, y0, x1, y1 }
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
