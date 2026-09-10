/**
 * Turning a model's answer into form values.
 *
 * The lock and the untouched field are the author's, and a prompt asking nicely
 * that they be left alone is a suggestion, not a guarantee. One stray key in one
 * response would silently overwrite work somebody deliberately protected. So
 * every key the model returns is checked against the list that was actually
 * requested, here, in code, and anything else is dropped and reported.
 */
import { fieldsFor, isEmptyValue } from '../../store/src/index.ts'
import type { FieldSpec } from '../../store/src/index.ts'

export interface ForgeRequest {
  /** Which container's spec applies: 'universe', 'fauna', ... */
  container: string
  /** Field keys to generate. Everything else is locked, filled, or both. */
  fill: string[]
  /** Every value the form already holds, for coherence. */
  current: Record<string, unknown>
  /** The universe, when generating an article. Absent for the universe form itself. */
  universe?: string
  /**
   * The values being replaced, when this is a regeneration rather than a first fill.
   *
   * Without it a regenerate is a request the caller has already made, word for
   * word, and it comes back with the answer it came back with before. Asked for
   * one given name three times against an identical prompt, the model returned
   * "Maren" three times - not a cache, just the same question answered the same
   * way. What makes a regenerate a different question is saying what it rejects.
   */
  avoid?: Record<string, unknown>
  /**
   * The universe's canon, read by the caller and handed over.
   *
   * The bridge holds the store in process. The skill, left to itself, shells
   * out for the same facts - `sb intro`, `sb containers`, `sb list` - and every
   * one is a process launch and a model turn. Measured on a single short field:
   * about thirty seconds fetching, against seven to twelve with the same facts
   * already in the prompt.
   */
  canon?: string
}

export interface ForgeResult {
  values: Record<string, unknown>
  /** Keys the model returned that were not asked for. Reported, never applied. */
  dropped: string[]
  /** Set when the run produced nothing usable, so a caller can say so or retry. */
  error?: string
}

const NL = String.fromCharCode(10)

export function buildForgePrompt(req: ForgeRequest): string {
  const spec = fieldsFor(req.container) ?? []
  const byKey = new Map(spec.map((f) => [f.key, f]))
  const asked = req.fill.map((k) => byKey.get(k)).filter((f): f is FieldSpec => !!f)

  const described = asked
    .map((f) => {
      const shape =
        f.kind === 'list' ? 'array of short strings' : f.kind === 'number' ? 'number' : f.kind === 'longtext' ? 'prose, 2-4 sentences' : 'short string'
      const examples = f.examples?.length ? `\n    Examples (calibration, not a menu): ${f.examples.join(' | ')}` : ''
      return `  ${f.key} (${shape}) - ${f.label}\n    ${f.help}${examples}`
    })
    .join('\n')

  const current = Object.fromEntries(
    Object.entries(req.current).filter(([, v]) => !isEmptyValue(v)),
  )

  const rejected = Object.fromEntries(
    Object.entries(req.avoid ?? {}).filter(([key, v]) => req.fill.includes(key) && !isEmptyValue(v)),
  )

  return [
    req.container === 'universe'
      ? 'Use the universe-forge skill.'
      : `Use the article-forge skill. Container: ${req.container}. Universe: ${req.universe ?? '(none)'}.`,
    `Generate values for exactly these ${req.container} fields, and no others:` + NL + described,
    req.canon
      ? `The canon of this universe, already read for you. Work from it rather than looking it up ` +
        `again; reach for a tool only if you need detail on one particular thing named here and ` +
        `not described.` + NL + NL + req.canon
      : '',
    Object.keys(current).length
      ? `These fields are already set by the author and must not be changed. Everything you ` +
        `generate has to cohere with them:` + NL + JSON.stringify(current, null, 2)
      : req.container === 'universe'
        ? 'The form is empty. Decide the centre of the world first, then derive the rest from it.'
        : 'The form is empty. Ground the article in the universe canon before inventing anything.',
    Object.keys(rejected).length
      ? `The author has already seen these answers for these fields and asked for something else. ` +
        `Do not return them again, and do not return a near variant - a different name, not a ` +
        `respelling of the same one:` + NL + JSON.stringify(rejected, null, 2)
      : '',
    `Reply with a single JSON object containing exactly these keys: ${req.fill.join(', ')}. No other text.`,
  ]
    .filter(Boolean)
    .join(NL + NL)
}

/**
 * Pull the JSON object out of a CLI run. Models wrap answers in fences and
 * commentary; the object is what matters, so look for it rather than demanding
 * the whole response be well-formed.
 */
export function extractJson(raw: string): Record<string, unknown> | null {
  const fenced = [...raw.matchAll(/```(?:json)?\s*([\s\S]*?)```/g)].map((m) => m[1])
  const candidates = [...fenced, raw]

  for (const text of candidates.reverse()) {
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start === -1 || end <= start) continue
    try {
      const parsed: unknown = JSON.parse(text.slice(start, end + 1))
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
    } catch {
      // Try the next candidate rather than failing the whole run.
    }
  }
  return null
}

/** Coerce a value into the shape its field declares, or null if it can't be. */
function coerce(field: FieldSpec, value: unknown): unknown {
  if (isEmptyValue(value)) return null

  switch (field.kind) {
    case 'list':
      if (Array.isArray(value)) {
        const items = value.map((v) => String(v).trim()).filter(Boolean)
        return items.length ? items : null
      }
      return String(value)
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)
    case 'number': {
      const n = typeof value === 'number' ? value : Number(String(value).replace(/[^0-9.-]/g, ''))
      return Number.isFinite(n) ? n : null
    }
    default:
      return Array.isArray(value) ? value.join(', ') : String(value).trim() || null
  }
}

/**
 * Apply a response under the request's terms: requested keys only, coerced to
 * the field's shape. Anything else is dropped and named.
 */
export function applyForgeResponse(raw: string, req: ForgeRequest): ForgeResult {
  const parsed = extractJson(raw)
  if (!parsed) {
    /*
     * No JSON in the answer at all.
     *
     * This used to return an empty result with no error, which reads
     * downstream as "the model chose to fill nothing in" - and a whole batch of
     * thirteen fields came back blank that way, reported in a footnote and
     * indistinguishable from a deliberate silence. A run that produced nothing
     * usable is a failed run and says so.
     */
    return {
      values: {},
      dropped: [],
      error:
        raw.trim() ?
          'The generator answered, but there was no JSON object in what it said.'
        : 'The generator returned nothing.',
    }
  }

  const spec = fieldsFor(req.container) ?? []
  const byKey = new Map(spec.map((f) => [f.key, f]))
  const requested = new Set(req.fill)
  const known = new Set(spec.map((f) => f.key))
  const values: Record<string, unknown> = {}
  const dropped: string[] = []

  for (const [key, value] of Object.entries(parsed)) {
    if (!requested.has(key) || !known.has(key)) {
      dropped.push(key)
      continue
    }
    const coerced = coerce(byKey.get(key)!, value)
    if (coerced !== null) values[key] = coerced
  }

  return { values, dropped }
}
