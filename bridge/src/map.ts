/**
 * Serving a universe's map, framed to one article.
 *
 * The crop happens here rather than at import because a crop is a change of
 * view: storing one per country would be fourteen copies of the same 12.7MB
 * drawing, and every one of them stale the moment the map is re-imported.
 */
import { readFile, stat } from 'node:fs/promises'
import {
  cropSvg,
  fitVignette,
  frameFromAttribute,
  mapSourcePath,
  relabelCoordinates,
} from '../../store/src/index.ts'

/**
 * The source map, held in memory between requests.
 *
 * It is large and read often - every article in a universe frames the same
 * file - so it is kept, keyed by how recently it was written. A re-import
 * changes the file's timestamp and the next request reads it afresh.
 */
const sources = new Map<string, { at: number; svg: string }>()

async function readSource(universeDir: string): Promise<string> {
  const path = mapSourcePath(universeDir)
  const { mtimeMs } = await stat(path)
  const held = sources.get(path)
  if (held?.at === mtimeMs) return held.svg

  const svg = await readFile(path, 'utf8')
  sources.set(path, { at: mtimeMs, svg })
  return svg
}

/** Cropped results, keyed by the frame that made them. */
const framed = new Map<string, string>()

export interface MapRequest {
  universeDir: string
  /** A stored `viewBox` string. Absent means the whole map. */
  frame?: unknown
}

export async function renderMap(req: MapRequest): Promise<string> {
  const svg = await readSource(req.universeDir)
  const box = frameFromAttribute(req.frame)
  if (!box) return svg

  const key = `${req.universeDir}|${String(req.frame)}`
  const held = framed.get(key)
  if (held) return held

  // The same three steps the CLI takes, in the same order: labels moved onto
  // the frame's edges, the vignette taken off, then the view narrowed.
  let out = relabelCoordinates(svg, box)
  out = fitVignette(out, box, false)
  out = cropSvg(out, box)

  // Bounded: a universe has a few dozen articles worth framing, and each held
  // copy is a large string.
  if (framed.size > 24) framed.clear()
  framed.set(key, out)
  return out
}

/** Dropped when a universe is re-imported, so nothing serves an old map. */
export function forgetMaps(): void {
  sources.clear()
  framed.clear()
}
