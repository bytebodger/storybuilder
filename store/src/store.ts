import type {
  Item,
  ItemPatch,
  Neighborhood,
  NewItem,
  Timeline,
  Universe,
  ClosureState,
} from './types.ts'

/**
 * The seam.
 *
 * Everything above this interface — skills, the CLI, the bridge — talks only to
 * these methods. The current implementation writes JSON files inside the
 * universe directory; swapping in Postgres or a document store later means
 * writing one more class here and changing nothing that calls it.
 *
 * A Store instance is bound to exactly one universe at construction. Universe
 * isolation is therefore structural rather than a rule that has to be checked:
 * there is no method that takes a universe id, and no way to name an item in
 * another universe, so cross-universe leakage is not a bug that can occur.
 */
export interface Store {
  readonly universeId: string

  manifest(): Promise<Universe>
  updateManifest(patch: Partial<Omit<Universe, 'id' | 'createdAt'>>): Promise<Universe>

  /** Container names that currently hold at least one item. */
  containers(): Promise<string[]>
  list(container?: string): Promise<Item[]>
  get(id: string): Promise<Item | null>
  /** Case-insensitive lookup by name or alias. Used to catch accidental renaming and duplicates. */
  find(name: string, container?: string): Promise<Item[]>

  add(input: NewItem): Promise<Item>
  update(id: string, patch: ItemPatch): Promise<Item>
  remove(id: string): Promise<void>

  /** Create a reciprocal edge. Throws CanonViolation if it would exceed a closed set. */
  link(aId: string, bId: string, role?: { a?: string; b?: string }): Promise<void>
  /** Remove both halves of an edge. */
  unlink(aId: string, bId: string): Promise<void>

  /**
   * Retype an item: a new container, a new kind, or both. Checked against every
   * neighbour's closure, since retyping makes it a new member of a different set.
   */
  move(id: string, container: string, kind?: string): Promise<Item>

  /**
   * Declare how complete a relation set is. Closing forbids later invention, and
   * requires a reason; reopening is cheap and ordinary.
   */
  setClosure(id: string, type: string, state: ClosureState, note?: string): Promise<Item>

  /** An item and everything related to it, grouped by type, with closure flags. */
  neighborhood(id: string): Promise<Neighborhood>

  // --- timelines ----------------------------------------------------------

  /**
   * Every timeline in this universe, flat. Always at least one: a universe
   * without a Universal History is given one on the way out, so no caller ever
   * has to handle the empty case or create the root itself.
   */
  timelines(): Promise<Timeline[]>

  /** Add a timeline. Defaults to sitting directly under the Universal History. */
  addTimeline(input: { name: string; parent?: string }): Promise<Timeline>

  /**
   * Rename a timeline, move it under a different parent, or both.
   *
   * The root can do neither: it is the one timeline whose name and place are
   * fixed, because everything else is defined relative to it.
   */
  updateTimeline(id: string, patch: { name?: string; parent?: string }): Promise<Timeline>

  /**
   * Remove a timeline. Its children move up to take its place, so removing a
   * stretch of history never orphans the stretches inside it.
   */
  removeTimeline(id: string): Promise<void>
}
