/**
 * Where a universe keeps the files its articles point at.
 *
 * The map is the first of them, and it sets the pattern: one copy per universe,
 * inside the universe directory, so a universe can still be moved or shared
 * without losing what its articles refer to.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export const MEDIA_DIR = 'media'
export const MAP_FILE = 'map.svg'

export const mapSourcePath = (universeDir: string) => join(universeDir, MEDIA_DIR, MAP_FILE)

/**
 * Keep the map itself, once.
 *
 * Not once per country: cropping is a change of view, not of content, so
 * fourteen country maps would be fourteen copies of the same 12.7MB drawing.
 * Each article stores the frame it wants instead, and the crop is applied when
 * the map is served.
 */
export async function saveMapSource(universeDir: string, svg: string): Promise<string> {
  const path = mapSourcePath(universeDir)
  await mkdir(join(universeDir, MEDIA_DIR), { recursive: true })
  await writeFile(path, svg, 'utf8')
  return path
}

/** A frame stored on an article, as the `viewBox` string it will become. */
export const frameToAttribute = (box: { x0: number; y0: number; x1: number; y1: number }) =>
  [box.x0, box.y0, box.x1 - box.x0, box.y1 - box.y0].map((n) => Math.round(n)).join(' ')

/** The inverse: read a stored frame back into a box. */
export function frameFromAttribute(value: unknown) {
  if (typeof value !== 'string') return null
  const [x, y, w, h] = value.trim().split(/\s+/).map(Number)
  if (![x, y, w, h].every(Number.isFinite) || w <= 0 || h <= 0) return null
  return { x0: x, y0: y, x1: x + w, y1: y + h }
}
