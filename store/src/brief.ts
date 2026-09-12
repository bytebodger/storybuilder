import type { Store } from './store.ts'
import type { Item, Neighborhood } from './types.ts'

/**
 * Renders a neighbourhood as the text a skill puts in front of the model.
 *
 * The wording is the point. A bare list of two continents invites a third; the
 * same list under "these are ALL of them" does not. Closure is stated in prose
 * for every relation set, including the ones that are still open - so "you may
 * invent here" and "you may not" are both explicit, and neither has to be
 * inferred from what happens to be present.
 */
export function renderBrief(n: Neighborhood): string {
  const { item, related } = n
  const out: string[] = []

  out.push(`${item.name} - ${item.container} - id ${item.id}${span(item)}`)
  if (item.stub) {
    out.push(
      'STUB. This exists and is named, and nothing else about it is established. You may refer to it;',
      'you may not state anything about it. If the story needs a fact here, say so and ask.',
    )
  }
  if (item.aliases?.length) out.push(`Also known as: ${item.aliases.join(', ')}`)
  if (item.demonyms?.length) out.push(`Its people are called: ${item.demonyms.join(', ')}`)
  if (item.summary) out.push('', item.summary)

  const attrs = Object.entries(item.attributes ?? {})
  if (attrs.length) {
    out.push('', 'Attributes:')
    for (const [k, v] of attrs) out.push(`  ${k}: ${format(v)}`)
  }

  const types = Object.keys(related).sort()
  if (types.length === 0) {
    out.push('', 'Nothing is related to this item yet.')
  }

  for (const type of types) {
    const set = related[type]
    out.push('', `${type.toUpperCase()} (${set.items.length}) - ${closureLine(type, item.name, set.closure, set.items.length)}`)
    if (set.closureNote) out.push(`  Why: ${set.closureNote}`)
    for (const rel of set.items)
      out.push(`  - ${rel.name} [${rel.id}]${roleSuffix(item, rel)}${span(rel)}${rel.stub ? ' (stub)' : ''}`)
    if (set.items.length === 0) out.push('  (none)')
  }

  if (item.sources?.length) out.push('', `Established in: ${item.sources.join(', ')}`)
  return out.join('\n')
}

/**
 * Container names are singular ('city', 'continent'), so the wording is built to
 * avoid pluralising them - "all the citys of Kell" would undercut the authority
 * of the very sentence that has to be believed.
 */
function closureLine(type: string, name: string, closure: string, count: number): string {
  switch (closure) {
    case 'closed':
      return `COMPLETE. ${name} has exactly ${count} of type ${type}, listed here. Do not introduce another; if the story needs one, say so and ask.`
    case 'uncharted':
      return `INCOMPLETE IN-WORLD. Others of type ${type} may exist but are undiscovered. A new one is a discovery, and must be recorded as such.`
    default:
      return `OPEN. ${name} may have more of type ${type} than are recorded here; these are the ones established so far. You may add one - write it to the store rather than only mentioning it - but do not contradict what is listed.`
  }
}

function roleSuffix(owner: Item, related: Item): string {
  const role = owner.tags.find((t) => t.relatedTo === related.id)?.role
  return role ? ` (${role})` : ''
}

/**
 * Membership and existence are different claims, so a brief has to make both.
 * A member that has ended stays in the list - it really was one of them - but
 * saying so without saying when would put a sunken continent back on the map.
 *
 * An absent end date is the one thing here that is not a claim. It covers a
 * thing that is still going and a thing whose ending nobody recorded, and it
 * does not say which - Lao Tzu is as certainly dead as anyone, and no year of
 * it survives. So the span reads `from 412`, not `since 412`: the first states
 * where the record starts, the second quietly asserts it never stopped.
 *
 * An author who knows a thing has ended and not when should write that in the
 * end date - `unknown`, `some years after 1104` - which is why the column is a
 * string. `(1913 - probably 1975; NO LONGER EXTANT)` is exactly right, and no
 * date arithmetic depends on it being a number.
 */
function span(i: Item): string {
  if (i.endDate) return ` (${i.beginDate ? `${i.beginDate} - ` : 'ended '}${i.endDate}; NO LONGER EXTANT)`
  if (i.beginDate) return ` (from ${i.beginDate})`
  return ''
}

const format = (v: unknown) => (typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v))

/**
 * The universe's standing constraints, prepended to every brief a skill
 * assembles. Only fields that were actually filled appear - an empty tone is
 * silence, not a licence to pick one.
 */
export async function renderUniverseBrief(store: Store): Promise<string> {
  const m = await store.manifest()
  // The respelling rides on the name rather than getting a line of its own: it
  // is useful where dialogue has to say the word, and noise everywhere else.
  const said = m.pronunciation?.trim() ? ` (said "${m.pronunciation.trim()}")` : ''
  const out = [`UNIVERSE: ${m.name}${said} [${m.id}]`]

  const span = m.totalYears ?? 1000
  out.push(`Canon spans Year 0 to Year ${span}. Dates outside that range are outside the canon.`)

  const line = (label: string, v: string | string[] | undefined) => {
    if (!v || (Array.isArray(v) && v.length === 0)) return
    out.push(`${label}: ${Array.isArray(v) ? v.join(', ') : v}`)
  }

  line('Genre', m.genres)
  line('Tone', m.tone)
  line('Recurring themes', m.themes)
  line('Scale', m.scale)
  line('Inspiration', m.inspiration)

  // Named rather than summarised: a skill choosing a character's trade needs
  // the list itself, and "47 professions" would not stop it inventing a
  // forty-eighth.
  if (m.professions?.length) {
    out.push('', `PROFESSIONS - the work done here, and the only trades to draw on:`)
    out.push(`  ${m.professions.join(', ')}`)
  }

  const blocks: [string, string | undefined][] = [
    ['NATURAL LAWS', m.naturalLaws],
    ['ORIGINS', m.origins],
    ['GEOGRAPHY', m.geography],
    ['CULTURES', m.cultures],
  ]
  for (const [label, body] of blocks) if (body?.trim()) out.push('', `${label}: ${body.trim()}`)

  return out.join('\n')
}
