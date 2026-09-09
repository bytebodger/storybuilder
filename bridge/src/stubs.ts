/**
 * Stub proposals: what the model suggested, minus what already exists.
 *
 * The filtering is the point. A skill can read one article well, but deciding
 * whether "thorinfly" is new means holding every name in the universe in mind,
 * which is the job the store exists to do. So the model proposes and the store
 * disposes - the same split as the form locks and the closed sets.
 */
import { CONTAINER_TYPES, matchTerm, normalizeTerm } from '../../store/src/index.ts'
import type { Item } from '../../store/src/index.ts'

export interface StubCandidate {
  term: string
  container: string
  context?: string
  field?: string
}

export interface ScreenedCandidate extends StubCandidate {
  /** Why it survived, or would not have. */
  note?: string
}

export interface ScreenResult {
  candidates: ScreenedCandidate[]
  /** Terms dropped because the universe already has them, with what they matched. */
  alreadyKnown: { term: string; matched: string; id: string }[]
  /** Terms dropped as malformed or duplicated within the proposal itself. */
  discarded: string[]
}

const CONTAINER_KEYS = new Set(CONTAINER_TYPES.map((c) => c.key))

/** A stub is never a universe: the manifest is not an article. */
export const stubContainers = () => CONTAINER_TYPES.map((c) => ({ key: c.key, label: c.label, singular: c.singular }))

export function screenCandidates(
  proposed: StubCandidate[],
  items: Item[],
  subject?: { id?: string; name?: string },
): ScreenResult {
  const out: ScreenResult = { candidates: [], alreadyKnown: [], discarded: [] }
  const seen = new Set<string>()
  const subjectKey = subject?.name ? normalizeTerm(subject.name) : ''

  for (const candidate of proposed) {
    const term = String(candidate.term ?? '').trim()
    const key = normalizeTerm(term)

    if (!key || term.length > 120) {
      out.discarded.push(term || '(blank)')
      continue
    }
    // The article's own subject is not a loose end in its own article.
    if (key === subjectKey) {
      out.discarded.push(term)
      continue
    }
    if (seen.has(key)) {
      out.discarded.push(term)
      continue
    }
    seen.add(key)

    const [match] = matchTerm(term, items)
    if (match) {
      out.alreadyKnown.push({ term, matched: match.item.name, id: match.item.id })
      continue
    }

    // An unrecognised container is not fatal; the author picks one anyway.
    const container = CONTAINER_KEYS.has(candidate.container) ? candidate.container : ''
    out.candidates.push({
      term,
      container,
      context: candidate.context?.trim() || undefined,
      field: candidate.field,
      note: container ? undefined : 'No container suggested - choose one.',
    })
  }

  return out
}

/** Pull the candidate list out of a skill run, tolerant of fences and commentary. */
export function extractCandidates(raw: string): StubCandidate[] | null {
  const fenced = [...raw.matchAll(/```(?:json)?\s*([\s\S]*?)```/g)].map((m) => m[1])
  for (const text of [...fenced, raw].reverse()) {
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start === -1 || end <= start) continue
    try {
      const parsed = JSON.parse(text.slice(start, end + 1)) as { candidates?: unknown }
      if (Array.isArray(parsed.candidates)) return parsed.candidates as StubCandidate[]
    } catch {
      // Try the next candidate block.
    }
  }
  return null
}
