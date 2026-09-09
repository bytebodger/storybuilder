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
}

export interface ForgeResult {
  values: Record<string, unknown>
  /** Keys the model returned that were not asked for. Reported, never applied. */
  dropped: string[]
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

  return [
    req.container === 'universe'
      ? 'Use the universe-forge skill.'
      : `Use the article-forge skill. Container: ${req.container}. Universe: ${req.universe ?? '(none)'}.`,
    `Generate values for exactly these ${req.container} fields, and no others:` + NL + described,
    Object.keys(current).length
      ? `These fields are already set by the author and must not be changed. Everything you ` +
        `generate has to cohere with them:\n${JSON.stringify(current, null, 2)}`
      : req.container === 'universe'
        ? 'The form is empty. Decide the centre of the world first, then derive the rest from it.'
        : 'The form is empty. Ground the article in the universe canon before inventing anything.',
    `Reply with a single JSON object containing exactly these keys: ${req.fill.join(', ')}. No other text.`,
  ]
    .filter(Boolean)
    .join('\n\n')
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
  if (!parsed) return { values: {}, dropped: [] }

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
