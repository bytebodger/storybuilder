/**
 * What a re-import should actually do.
 *
 * A map is edited outside this tool and re-exported often, so importing is not
 * a one-off. Rebuilding from scratch would be both wasteful and destructive:
 * the articles carry writing that the map knows nothing about.
 *
 * So an import is a comparison. Each candidate is matched against what the
 * universe already holds and classified, and only what genuinely differs is
 * written. Nothing is ever deleted - a thing that has left the map may still
 * have an article worth keeping, and that is the author's call.
 */
import { createHash } from 'node:crypto'
import { matchTerm } from '../terms.ts'
import type { Item } from '../types.ts'
import type { ImportCandidate } from './types.ts'

/** Where the digest of an import's own output is kept. */
export const DIGEST_KEY = 'importDigest'

export type Verdict =
  /** Nothing in the universe answers to this name. */
  | 'new'
  /** The map has changed something about it, and the article is untouched. */
  | 'update'
  /** The map says exactly what the article already does. */
  | 'unchanged'
  /** The article has been written since it was imported. Left alone. */
  | 'edited'
  /** An article of this name exists that no import made. Left alone. */
  | 'authored'

export interface Assessment {
  candidate: ImportCandidate
  verdict: Verdict
  /** The article this candidate matched, when it matched one. */
  existing?: Item
  /** Which import-owned fields the map now disagrees with. */
  changed: string[]
}

export interface Delta {
  assessments: Assessment[]
  /**
   * Articles this import created before, that the map no longer mentions.
   *
   * Reported and never removed: a country dropped from a map may have a page of
   * history behind it, and deleting that to match a file is not a trade anyone
   * would choose.
   */
  missing: Item[]
}

/**
 * A fingerprint of what an import wrote.
 *
 * Kept on the article so a later import can tell its own work from an author's.
 * Recomputing it from the stored article and finding it unchanged means nobody
 * has touched it since; finding it different means somebody has, and the import
 * should keep its hands off.
 */
export function digestOf(summary: string | undefined, attributes: Record<string, unknown> = {}): string {
  const owned = Object.entries(attributes)
    .filter(([key]) => key !== DIGEST_KEY)
    .sort(([a], [b]) => a.localeCompare(b))
  return createHash('sha1')
    .update(JSON.stringify({ summary: summary ?? null, attributes: owned }))
    .digest('hex')
    .slice(0, 12)
}

/** Everything an import would write for a candidate, digest included. */
export function importedAttributes(candidate: ImportCandidate): Record<string, unknown> {
  const attributes = { ...(candidate.attributes ?? {}) }
  for (const [key, value] of Object.entries(attributes)) {
    if (value === undefined) delete attributes[key]
  }
  return { ...attributes, [DIGEST_KEY]: digestOf(candidate.summary, attributes) }
}

function differences(candidate: ImportCandidate, item: Item): string[] {
  const wanted = importedAttributes(candidate)
  const held = item.attributes ?? {}
  const changed: string[] = []

  if ((candidate.summary ?? undefined) !== (item.summary ?? undefined)) changed.push('summary')
  if (candidate.kind && candidate.kind !== item.kind) changed.push('kind')

  for (const [key, value] of Object.entries(wanted)) {
    if (key === DIGEST_KEY) continue
    if (JSON.stringify(held[key]) !== JSON.stringify(value)) changed.push(key)
  }
  return changed
}

export function assess(candidates: ImportCandidate[], items: Item[]): Delta {
  const assessments: Assessment[] = []
  const seen = new Set<string>()

  for (const candidate of candidates) {
    const [match] = matchTerm(candidate.name, items)
    if (!match) {
      assessments.push({ candidate, verdict: 'new', changed: [] })
      continue
    }

    const item = match.item
    seen.add(item.id)
    const stored = item.attributes?.[DIGEST_KEY]

    if (typeof stored !== 'string') {
      // Written by hand, or by something other than an import. Not ours to change.
      assessments.push({ candidate, verdict: 'authored', existing: item, changed: [] })
      continue
    }

    const current = digestOf(item.summary, item.attributes ?? {})
    if (current !== stored) {
      assessments.push({
        candidate,
        verdict: 'edited',
        existing: item,
        changed: differences(candidate, item),
      })
      continue
    }

    const changed = differences(candidate, item)
    assessments.push({
      candidate,
      verdict: changed.length ? 'update' : 'unchanged',
      existing: item,
      changed,
    })
  }

  const missing = items.filter(
    (item) => typeof item.attributes?.[DIGEST_KEY] === 'string' && !seen.has(item.id),
  )
  return { assessments, missing }
}

export const countBy = (delta: Delta) => {
  const counts: Record<Verdict, number> = {
    new: 0,
    update: 0,
    unchanged: 0,
    edited: 0,
    authored: 0,
  }
  for (const a of delta.assessments) counts[a.verdict]++
  return counts
}
