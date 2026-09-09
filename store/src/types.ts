/**
 * The data model. Everything a skill is allowed to treat as established fact
 * lives in these shapes.
 */

/**
 * How complete a set of relations is. Declared per relation type, on the item
 * that owns the set — `closure.continent = 'closed'` on a planet.
 *
 * This is the field that stops invention. Without it, a skill reading two
 * continents cannot distinguish "there are two" from "two have been written
 * down so far", and will cheerfully supply a third.
 */
export type ClosureState =
  | 'open' /** More may be established later. The default, and the right answer for most sets. */
  | 'closed' /** These are all of them. Adding another member is a canon violation. */
  | 'uncharted' /** In-world: more may exist, undiscovered. An authored fact, not an absence of one. */

/**
 * A declared closure, with the reasoning attached.
 *
 * The note is not documentation - it is what makes the constraint reversible.
 * A closed set is a wall, and a wall without a sign gets treated as structural
 * whether it is or not: a session two years from now hits the refusal, cannot
 * tell whether the two-continent geography holds the series together or whether
 * someone closed the set casually in an early pass, and takes the safe route of
 * leaving it alone. So closing requires saying why, and the reason travels with
 * every refusal.
 */
export interface ClosureRecord {
  state: ClosureState
  /** Why this was decided. Required in order to close a set. */
  note?: string
  /** Real-world timestamp of the decision, for the author's own archaeology. */
  setAt?: string
}

/**
 * An edge. Written on both endpoints so that any item can be read, with its
 * whole neighbourhood, in one pass — but never written by hand: the store
 * maintains both halves, which is what keeps the redundancy from drifting.
 */
export interface Tag {
  /** The container of the item at the other end. Groups the neighbourhood on read. */
  type: string
  /** The id of the item at the other end. Always within the same universe. */
  relatedTo: string
  /**
   * Optional qualifier, for when `type` alone is ambiguous — two countries can
   * be related as neighbours or as belligerents, and a skill needs to know
   * which. Recorded from the perspective of the item holding the tag.
   */
  role?: string
}

/** One entity. Items live in a container and are unique by id within a universe. */
export interface Item {
  id: string
  /** The kind of thing this is: 'planet', 'continent', 'country', 'religion'... */
  container: string
  name: string
  /**
   * Subtype within the container - 'continent' inside geography, 'city' inside
   * locations. Free-form; the catalog's `kinds` are suggestions, not a menu.
   *
   * It exists because the containers are deliberately coarse and closure is not:
   * "this planet has exactly two continents" is a claim about continents, and
   * closing all of `geography` would close rivers and mountains along with them.
   * See `groupKey`.
   */
  kind?: string
  aliases?: string[]
  /**
   * A placeholder: the thing is named and exists, but nothing about it is
   * established yet.
   *
   * This is a distinct state from both "absent" and "described", and skills have
   * to treat it as its own answer. A stub says the author has committed to the
   * name and to nothing else - so referring to it is safe, and asserting
   * anything about it is not.
   */
  stub?: boolean
  /** One or two sentences. What a skill sees when this item is mentioned in passing. */
  summary?: string
  /**
   * When this came into being, and when it ceased to. Free-form, because
   * fictional calendars are not ISO dates: "Year 198", "Third Age, late".
   *
   * These are orthogonal to closure, and the distinction matters. Closure is
   * membership across all recorded time; dates say which members are extant at a
   * given moment. A continent that sank is still one of the planet's continents
   * - a closed set of three - but it is not there to be walked on now.
   */
  beginDate?: string
  endDate?: string
  /** Free-form structured facts: population, climate, founding year. */
  attributes?: Record<string, unknown>
  tags: Tag[]
  /**
   * Completeness of each relation set, keyed by group key (see `groupKey`).
   * Absent means 'open'.
   * An explicit 'open' entry is how a reopening keeps its own record.
   */
  closure?: Record<string, ClosureRecord>
  /** Where these facts were established: file paths, chapter refs. */
  sources?: string[]
  createdAt: string
  updatedAt: string
}

/** A container file on disk, matching the shape the store is queried in. */
export interface ContainerFile {
  container: string
  items: Item[]
}

/**
 * Universe manifest - the top of the hierarchy, and the container every other
 * container sits inside.
 *
 * A universe is a *canonical* universe, not necessarily a cosmological one: the
 * name may point at something in the fiction (the Exoria galaxy) or at the body
 * of fiction itself (nothing inside Star Wars is called Star Wars).
 *
 * The field spec that drives the form and the generator lives in
 * `universe-fields.ts`; these are the same fields, typed.
 */
export interface Universe {
  id: string
  name: string
  /** A plain respelling of the name. Common to every container's spec. */
  pronunciation?: string
  /**
   * Years the whole canon spans. Year 0 to Year `totalYears`. Not a
   * naturalistic age, and not a constraint on when stories are set.
   */
  totalYears?: number
  genres?: string[]
  tone?: string
  themes?: string[]
  scale?: string
  naturalLaws?: string
  origins?: string
  geography?: string
  cultures?: string
  inspiration?: string[]
  createdAt: string
  updatedAt?: string
}

/** The editable half of a manifest: everything the form can set. */
export type UniverseDraft = Partial<Omit<Universe, 'id' | 'createdAt' | 'updatedAt'>>

export interface NewItem {
  container: string
  name: string
  kind?: string
  stub?: boolean
  aliases?: string[]
  summary?: string
  beginDate?: string
  endDate?: string
  attributes?: Record<string, unknown>
  sources?: string[]
  /** Edges to create as part of the add. Routed through `link`, so closure is enforced. */
  links?: { to: string; role?: string }[]
  closure?: Record<string, ClosureRecord>
}

export type ItemPatch = Partial<Omit<Item, 'id' | 'container' | 'tags' | 'createdAt' | 'updatedAt'>>

/**
 * How an item is grouped and closed over: its `kind` when it has one, otherwise
 * its container.
 *
 * One string rather than a compound key, so a closure is still a single
 * readable claim - `continent`, `city` - and items without a kind behave exactly
 * as they did before kinds existed.
 */
export const groupKey = (i: { container: string; kind?: string }) => i.kind?.trim() || i.container

/** A relation set: everything of one type related to an item, and whether it is complete. */
export interface RelationSet {
  type: string
  closure: ClosureState
  /** Why the set is closed, carried into briefs and refusals. */
  closureNote?: string
  items: Item[]
}

/** An item plus its entire neighbourhood, grouped by type. The primary read for skills. */
export interface Neighborhood {
  item: Item
  related: Record<string, RelationSet>
}

/** Thrown when an operation would contradict established canon. */
export class CanonViolation extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CanonViolation'
  }
}

/** Thrown for ordinary bad input: unknown ids, unknown containers. */
export class StoreError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StoreError'
  }
}
