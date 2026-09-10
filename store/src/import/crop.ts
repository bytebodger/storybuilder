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

/** Land and total sample counts for a strip along one edge of a box. */
function edgeTally(box: Box, side: Side, sample: LandAt, band: number, step = 4): [number, number] {
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
  return [land, total]
}

/** What share of a strip along one edge of a box is land. */
function edgeLand(box: Box, side: Side, sample: LandAt, band: number, step = 4): number {
  const [land, total] = edgeTally(box, side, sample, band, step)
  return total === 0 ? 1 : land / total
}

/**
 * What share of a frame's whole border is coast.
 *
 * The single number the framing turns on. Judging sides separately invites each
 * to chase its own shore and the frame to slide off the thing it was framing;
 * one figure for the border as a whole asks the only question worth asking of a
 * named water - how much of what surrounds this view is land.
 */
function perimeterLand(box: Box, sample: LandAt, band: number): number {
  let land = 0
  let total = 0
  for (const side of ['N', 'S', 'W', 'E'] as Side[]) {
    const [l, t] = edgeTally(box, side, sample, band)
    land += l
    total += t
  }
  return total === 0 ? 1 : land / total
}

type Side = 'N' | 'S' | 'W' | 'E'

export interface Grown {
  box: Box
  /** True when land rings the frame on every side; false when an edge stayed open. */
  closed: boolean
  /** Why it stopped, in a phrase, for a caller that has to explain itself. */
  reason: string
}

/**
 * Grow a frame out from a label until its border is as much coast as it will be.
 *
 * For a label written across open water, naming a stretch of sea the generator
 * has no object for: a named water is the space between coasts, so the frame
 * worth showing is the one whose edges are shore.
 *
 * The frame grows evenly on all four sides, and the only figure watched is the
 * share of its whole border that is land. That share rises as the frame reaches
 * the coasts around the water, peaks when it is ringed by them, and falls again
 * once it grows past them into whatever lies beyond - so the first peak is the
 * feature, and the walk stops there.
 *
 * Growing the sides independently is the obvious alternative and it is wrong.
 * A bay is a pocket of water joined to a larger one; its mouth is by definition
 * an edge that never finds shore, so the side facing it grows across the sea
 * outside until it fetches up on that sea's far coast, and the bay comes back
 * framed as the sea. Held together, the same mouth costs a few points of border
 * and the peak stays over the bay. It also keeps the label centred, which is
 * where someone looking for it expects to find it.
 */
export function growToShore(
  start: Box,
  sample: LandAt,
  canvas: CropSource,
  options: {
    step?: number
    /** Border share at which the frame is ringed and there is no point growing on. */
    enclose?: number
    band?: number
    /**
     * How far the frame may grow, in pixels. Defaults to 40% of the map's longer
     * dimension - short enough to abandon a passage, long enough to cross an
     * ocean to its far coast.
     */
    reach?: number
    /** How far the border share must drop below its best to count as falling. */
    prominence?: number
    /** How many falling readings in a row settle it. Two, so one dip is not a peak. */
    patience?: number
    /** How much better a further-off coast must be before a side moves out to it. */
    tolerance?: number
  } = {},
): Grown {
  const {
    step = 8,
    enclose = 0.9,
    band = 12,
    reach = Math.max(canvas.width, canvas.height) * 0.4,
    prominence = 0.05,
    patience = 2,
    tolerance = 0.03,
  } = options

  const frameAt = (t: number): Box => ({
    x0: Math.max(0, start.x0 - t),
    y0: Math.max(0, start.y0 - t),
    x1: Math.min(canvas.width, start.x1 + t),
    y1: Math.min(canvas.height, start.y1 + t),
  })

  let bestAt = 0
  let best = -1
  let falling = 0

  for (let t = 0; t <= reach; t += step) {
    const box = frameAt(t)
    const share = perimeterLand(box, sample, band)

    if (share >= enclose) {
      bestAt = t
      best = share
      break
    }

    if (share > best) {
      best = share
      bestAt = t
      falling = 0
    } else if (share < best - prominence) {
      falling++
    } else {
      falling = 0
    }
    if (falling >= patience) break

    // Grown to the whole map. There is nothing further out to find.
    if (box.x0 === 0 && box.y0 === 0 && box.x1 === canvas.width && box.y1 === canvas.height) break
  }

  /*
   * Even growth finds the scale of the water; it cannot find where the label
   * was put in it. Someone writing a sea across its northern half leaves the
   * frame overshooting north and short in the south by the same amount.
   *
   * So each side is now settled onto the best coast within reach of where it
   * landed - at most half the distance the frame grew, and never inside the
   * label itself, which has to stay legible. Bounded that way it corrects a
   * misplaced label without becoming a second search that can wander off.
   */
  const box = settle(frameAt(bestAt), bestAt / 2)

  /*
   * A peak that is only a little coast is a passage, not a basin: a strait is
   * open at both ends by definition and no frame around one is ever ringed.
   * Said plainly rather than papered over, because the caller may want to
   * explain the picture it got.
   */
  const ring = enclosure(box, sample, band)
  const closed = (['N', 'S', 'W', 'E'] as Side[]).every((s) => ring[s] >= enclose)
  return {
    box,
    closed,
    reason:
      closed ? 'land closed around the frame'
      : 'the water stayed open on some side - a passage rather than a basin',
  }

  /** Settle each side onto the nearest coast within `slack` of where it is. */
  function settle(frame: Box, slack: number): Box {
    if (slack < step) return frame
    const out = { ...frame }

    for (const side of ['N', 'S', 'W', 'E'] as Side[]) {
      const at = (offset: number) => {
        const probe = { ...out }
        if (side === 'N') probe.y0 = frame.y0 + offset
        else if (side === 'S') probe.y1 = frame.y1 - offset
        else if (side === 'W') probe.x0 = frame.x0 + offset
        else probe.x1 = frame.x1 - offset
        return probe
      }
      // A positive offset draws the side in toward the label; a negative one
      // pushes it further out.
      const coastAt = (offset: number) => {
        const probe = at(offset)
        if (!holdsLabel(probe) || !onCanvas(probe)) return -1
        return edgeLand(probe, side, sample, band)
      }

      let settled = 0
      if (coastAt(0) >= enclose) {
        /*
         * Already standing on coast, so the only question left is how much dead
         * land is behind it. Even growth reaches the far coast of a water by
         * overshooting the near one by the same amount, and that overshoot is
         * all inland. Drawn in while the edge is still coast, the side comes to
         * rest just short of the water - and stops the moment it is not, so it
         * can never take a bite out of what it is framing.
         */
        for (let d = step; d <= slack; d += step) {
          if (coastAt(d) < enclose) break
          settled = d
        }
      } else {
        // Not on coast. Look for the nearest line that is, inward before
        // outward at the same distance so the frame tightens by preference,
        // and settle for the most coastal line going if none of them is.
        let bestLand = -1
        for (let d = 0; d <= slack && settled === 0; d += step) {
          for (const offset of d === 0 ? [0] : [d, -d]) {
            const land = coastAt(offset)
            if (land < 0) continue
            if (land >= enclose) {
              settled = offset
              break
            }
            if (land > bestLand + tolerance) {
              bestLand = land
              settled = offset
            }
          }
        }
      }

      if (side === 'N') out.y0 = frame.y0 + settled
      else if (side === 'S') out.y1 = frame.y1 - settled
      else if (side === 'W') out.x0 = frame.x0 + settled
      else out.x1 = frame.x1 - settled
    }
    return out
  }

  /** The label is the subject of the picture and never falls outside it. */
  function holdsLabel(b: Box): boolean {
    return b.x0 <= start.x0 && b.y0 <= start.y0 && b.x1 >= start.x1 && b.y1 >= start.y1
  }

  function onCanvas(b: Box): boolean {
    return b.x0 >= 0 && b.y0 >= 0 && b.x1 <= canvas.width && b.y1 <= canvas.height
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

/**
 * Turn the extent of a thing into a frame worth looking at.
 *
 * A country's outline is roughly square and needs only padding. A river is a
 * line - eight hundred pixels long and thirty wide - and its bare extent makes a
 * letterbox nothing can be read in. A label's curve is the same shape problem in
 * miniature.
 *
 * So a frame is grown to a workable minimum and held to a sane aspect before it
 * is padded: the feature stays centred, and what surrounds it becomes visible,
 * which is most of why anyone looks at a river on a map.
 */
export function frameBox(
  box: Box,
  canvas: CropSource,
  options: { minSpan?: number; maxAspect?: number; pad?: number } = {},
): Box {
  const {
    minSpan = canvas.width * 0.08,
    maxAspect = 2.5,
    pad: padding = 0.08,
  } = options

  let width = Math.max(box.x1 - box.x0, minSpan)
  let height = Math.max(box.y1 - box.y0, minSpan)

  // Widen whichever side is too thin for the other, rather than cropping the
  // long one: a river's length is the thing worth seeing.
  if (width / height > maxAspect) height = width / maxAspect
  if (height / width > maxAspect) width = height / maxAspect

  const cx = (box.x0 + box.x1) / 2
  const cy = (box.y0 + box.y1) / 2
  const centred = {
    x0: cx - width / 2,
    y0: cy - height / 2,
    x1: cx + width / 2,
    y1: cy + height / 2,
  }
  return pad(centred, padding, canvas)
}

/**
 * The window onto the map for a hand-added label.
 *
 * A label over land names something with a shape - a range, a peninsula - and
 * its curve traces it, so the curve is the frame. A label over water names a
 * stretch of sea the generator has no object for, and the useful frame is the
 * one that reaches its shores.
 *
 * Which it is comes from the map rather than from the words: the points of the
 * curve are sampled against the height grid, and the majority decides. A
 * peninsula is land, so it keeps its curve - growing it toward a shore would
 * never close, since a peninsula has water on three sides by definition.
 *
 * Shared by the importer and by `crop-map --label`, because a crop of a label
 * and the map on that label's article should not be two different pictures.
 */
export function labelFrame(
  label: { x: number; y: number; points: { x: number; y: number }[] },
  isLand: LandAt,
  canvas: CropSource,
): Box {
  const points = label.points.length ? label.points : [label]
  const overLand = points.filter((p) => isLand(p.x, p.y)).length
  const box = boxOf(points)

  if (overLand * 2 >= points.length) return frameBox(box, canvas)

  // No minimum span on this path. The others need one because their extent can
  // be a point or a single cell; a frame grown out to its coasts has already
  // settled how big the thing is, and padding it up to a floor would put the
  // sea a bay opens onto back in the picture the bay was pulled out of.
  return frameBox(growToShore(box, isLand, canvas).box, canvas, { pad: 0.04, minSpan: 0 })
}
