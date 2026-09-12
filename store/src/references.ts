/**
 * What would notice if this article went away.
 *
 * Asked before something is trashed, so the author is told what they are about
 * to affect rather than finding out afterwards. Two different kinds of
 * reference, and the difference is the whole point:
 *
 * - **Linked**: a recorded relationship, an edge both items carry. Trashing cuts
 *   these, so they are what actually changes.
 * - **Mentioned**: the name appears in somebody's prose. Trashing changes
 *   nothing here - the words stay exactly as they were written - it only stops
 *   the mention linking to the article. Ricky Rocket's name is not scrubbed out
 *   of the three articles that talk about him.
 *
 * Mentions are found with `linkify` against the one item rather than a scan of
 * its own, so "the Rockets" counts for exactly the reason it would have linked.
 */
import { linkify } from './linkify.ts'
import type { Item } from './types.ts'

export interface References {
  /** Items holding an edge to this one. Cut when it is trashed. */
  linked: Item[]
  /** Items whose prose names it, and which are left untouched. */
  mentioned: Item[]
}

/** Every string in an item that a reader would read. */
function textOf(item: Item): string[] {
  const out: string[] = []
  if (item.summary) out.push(item.summary)
  for (const value of Object.values(item.attributes ?? {})) {
    if (typeof value === 'string') out.push(value)
    else if (Array.isArray(value)) out.push(value.filter((v) => typeof v === 'string').join(', '))
  }
  return out
}

/**
 * The articles that refer to this one, by edge and by name.
 *
 * The two lists are disjoint: an article that both links and mentions is
 * reported as linked, since that is the reference that would change.
 */
export function referencesTo(target: Item, items: Item[]): References {
  const others = items.filter((i) => i.id !== target.id)

  const linked = others.filter((i) => i.tags.some((t) => t.relatedTo === target.id))
  const linkedIds = new Set(linked.map((i) => i.id))

  const mentioned = others.filter(
    (i) =>
      !linkedIds.has(i.id) &&
      textOf(i).some((text) => linkify(text, [target], { once: true }).some((s) => s.target)),
  )

  return { linked, mentioned }
}
