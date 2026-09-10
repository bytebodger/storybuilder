/**
 * The shape of a universe's timelines, and every rule about that shape.
 *
 * Pure functions over a flat list. The store owns reading and writing; this
 * owns what a valid tree is - which is the part worth testing, and the part
 * that has to hold whether a change arrives from the console, the CLI or a
 * skill.
 *
 * Timelines are a tree because history nests. The War of the Stewards is an
 * episode of the Reign of King Tarinian, which is an episode of the History of
 * Waresia. Asking what happened during the reign has to reach the war, so the
 * questions worth asking are all questions about a subtree.
 */
import { ROOT_TIMELINE_ID, ROOT_TIMELINE_NAME, StoreError, type Timeline } from './types.ts'

export interface TimelineNode extends Timeline {
  depth: number
  children: TimelineNode[]
}

/** The root every universe has, as it is written when one is missing. */
export const rootTimeline = (): Timeline => ({
  id: ROOT_TIMELINE_ID,
  name: ROOT_TIMELINE_NAME,
  createdAt: new Date().toISOString(),
})

export const isRoot = (id: string) => id === ROOT_TIMELINE_ID

/**
 * The list arranged as the tree it describes, children under parents, each
 * level in name order.
 *
 * A timeline whose parent has gone missing is re-hung on the root rather than
 * dropped. The store does not allow that to happen, but a file edited by hand
 * can, and losing a stretch of history to a typo is worse than showing it in
 * the wrong place.
 */
export function treeOf(timelines: Timeline[]): TimelineNode[] {
  const nodes = new Map<string, TimelineNode>(
    timelines.map((t) => [t.id, { ...t, depth: 0, children: [] }]),
  )
  const roots: TimelineNode[] = []

  for (const node of nodes.values()) {
    const parent = node.parent ? nodes.get(node.parent) : undefined
    if (parent && parent.id !== node.id) parent.children.push(node)
    else roots.push(node)
  }

  const order = (list: TimelineNode[], depth: number) => {
    list.sort((a, b) => a.name.localeCompare(b.name))
    for (const node of list) {
      node.depth = depth
      order(node.children, depth + 1)
    }
  }
  order(roots, 0)
  return roots
}

/** Every timeline in the tree, parents before children, ready to print. */
export function flatten(nodes: TimelineNode[]): TimelineNode[] {
  return nodes.flatMap((n) => [n, ...flatten(n.children)])
}

export const childrenOf = (timelines: Timeline[], id: string) =>
  timelines.filter((t) => t.parent === id)

/**
 * A timeline and everything under it, at any depth.
 *
 * The set an event has to be matched against to answer "what happened during
 * the reign": an event filed under the War of the Stewards happened during the
 * reign that contains it, and nothing about the event says so.
 */
export function subtree(timelines: Timeline[], id: string): string[] {
  const out = [id]
  for (let i = 0; i < out.length; i++) {
    for (const child of childrenOf(timelines, out[i])) {
      if (!out.includes(child.id)) out.push(child.id)
    }
  }
  return out
}

/** A timeline's parent, its parent's parent, and so on up to the root. */
export function ancestors(timelines: Timeline[], id: string): string[] {
  const byId = new Map(timelines.map((t) => [t.id, t]))
  const out: string[] = []
  let at = byId.get(id)?.parent
  while (at && !out.includes(at)) {
    out.push(at)
    at = byId.get(at)?.parent
  }
  return out
}

export interface Span {
  first: number
  last: number
}

/**
 * What a timeline spans, according to its events.
 *
 * The earliest and latest year anywhere in its subtree, so a reign covers the
 * wars fought during it without anyone having to say so twice. A timeline with
 * no events has no span - not a zero-length one - because "nothing has been
 * filed here yet" and "everything here happened in year 0" are different
 * claims, and only one of them is usually true.
 *
 * Years arrive already numeric. What a year *is* belongs to the history spec,
 * not to this: a universe may count in years, reigns or ages, and whatever
 * turns one into something comparable belongs beside the field that holds it.
 */
export function spanOf(
  timelines: Timeline[],
  events: { timeline: string; year: number }[],
  id: string,
): Span | null {
  const within = new Set(subtree(timelines, id))
  const years = events.filter((e) => within.has(e.timeline)).map((e) => e.year)
  if (!years.length) return null
  return { first: Math.min(...years), last: Math.max(...years) }
}

/**
 * Check a name and a parent before either is written.
 *
 * Called by the store on every add and every edit, so the same rules hold
 * however a change arrives. `self` is the timeline being changed, absent when
 * one is being created.
 */
export function assertValidPlacement(
  timelines: Timeline[],
  draft: { name: string; parent?: string },
  self?: string,
): void {
  const name = draft.name.trim()
  if (!name) throw new StoreError('A timeline needs a name')

  const clash = timelines.find(
    (t) => t.id !== self && t.name.trim().toLowerCase() === name.toLowerCase(),
  )
  if (clash) {
    throw new StoreError(`This universe already has a timeline called "${clash.name}"`)
  }

  if (self && isRoot(self)) {
    if (draft.parent) throw new StoreError(`${ROOT_TIMELINE_NAME} sits under nothing`)
    return
  }

  const parent = draft.parent ?? ROOT_TIMELINE_ID
  if (!timelines.some((t) => t.id === parent)) {
    throw new StoreError(`No timeline with id "${parent}" to put this under`)
  }
  if (self === parent) throw new StoreError('A timeline cannot be its own parent')

  /*
   * The check that stops a tree becoming a ring. Moving a timeline under one of
   * its own descendants would cut both loose from the root: the pair would
   * still point at each other, and nothing walking down from Universal History
   * would ever reach either again.
   */
  if (self && subtree(timelines, self).includes(parent)) {
    const under = timelines.find((t) => t.id === parent)!
    throw new StoreError(`"${under.name}" already sits under this timeline`)
  }
}
