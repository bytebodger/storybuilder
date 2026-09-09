/**
 * Running canon-check over a freshly saved article.
 *
 * This runs *after* the stub review, and the order carries meaning. Stubs the
 * author accepted are canon by the time this runs, so the references they cover
 * resolve and are never reported. The ones they rejected do not resolve - and
 * that is correct, not a gap: declining a stub is saying the thing is not real,
 * and prose leaning on a thing that is not real is worth one quiet mention.
 */
import { matchTerm } from '../../store/src/index.ts'
import type { Item } from '../../store/src/index.ts'

export type FindingKind =
  | 'closed-set'
  | 'contradiction'
  | 'natural-law'
  | 'extancy'
  | 'out-of-span'
  | 'unknown-reference'

export interface Finding {
  kind: FindingKind
  field?: string
  /** The name at issue, when there is one. Re-checked against the store. */
  term?: string
  passage: string
  says?: string
  id?: string
  resolve?: string
}

/** Most serious first. A contradiction of something deliberately settled outranks a loose name. */
const ORDER: FindingKind[] = [
  'closed-set',
  'contradiction',
  'natural-law',
  'extancy',
  'out-of-span',
  'unknown-reference',
]

const KINDS = new Set<string>(ORDER)

export function buildCanonCheckPrompt(
  universe: string,
  item: { id: string; name: string; container: string },
  fields: Record<string, unknown>,
): string {
  return [
    'Use the canon-check skill.',
    `Universe: ${universe}. Container: ${item.container}.`,
    `Article: ${item.name} [${item.id}]`,
    'This article has just been saved, and its unexplained references have already been offered to ' +
      'the author as stubs. Anything still unrecorded was declined, so mention it once and move on.',
    'A stub is a name with nothing established behind it yet. This article saying things about a ' +
      'stub is normal authoring - it is where those facts are being established - and is NOT a ' +
      'finding. Report a stub only if the article contradicts something actually recorded about it.',
    'Fields:',
    JSON.stringify(fields, null, 2),
    'Reply with a single JSON object: {"findings": [...]}. No other text.',
  ].join(NL + NL)
}

const NL = String.fromCharCode(10)

export function extractFindings(raw: string): Finding[] | null {
  const fenced = [...raw.matchAll(/```(?:json)?\s*([\s\S]*?)```/g)].map((m) => m[1])
  for (const text of [...fenced, raw].reverse()) {
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start === -1 || end <= start) continue
    try {
      const parsed = JSON.parse(text.slice(start, end + 1)) as { findings?: unknown }
      if (Array.isArray(parsed.findings)) return parsed.findings as Finding[]
    } catch {
      // Try the next block rather than failing the run.
    }
  }
  return null
}

export interface ScreenedFindings {
  findings: Finding[]
  /** Unknown-reference findings dropped because the store does have the term. */
  resolved: { term: string; matched: string }[]
}

/**
 * Drop what the store can disprove, and order what is left.
 *
 * Only `unknown-reference` is mechanically checkable: the model says a name is
 * unrecorded, and the store knows whether it is. Everything else is a judgement
 * about prose, and code has nothing to add.
 */
export function screenFindings(proposed: Finding[], items: Item[]): ScreenedFindings {
  const findings: Finding[] = []
  const resolved: { term: string; matched: string }[] = []
  const seen = new Set<string>()

  for (const finding of proposed) {
    const kind = KINDS.has(finding.kind) ? finding.kind : 'contradiction'
    const passage = String(finding.passage ?? '').trim()
    if (!passage) continue

    if (kind === 'unknown-reference' && finding.term) {
      const [match] = matchTerm(finding.term, items)
      if (match) {
        // A stub accepted a moment ago lands here, and must not be reported.
        resolved.push({ term: finding.term, matched: match.item.name })
        continue
      }
    }

    const key = `${kind}:${finding.term ?? ''}:${passage}`.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)

    findings.push({ ...finding, kind })
  }

  findings.sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind))
  return { findings, resolved }
}
