import type { Item, ItemPatch, Neighborhood, NewItem, Universe, ClosureState } from './types.ts'

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
}
