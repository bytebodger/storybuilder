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
   * What the people of this thing are called: Dutch for the Netherlands,
   * Kellish for Kell.
   *
   * A column rather than an attribute because it is matched, not just read. No
   * reader of prose knows that "Dutch" refers to an article titled "The
   * Netherlands", and nothing in a name can tell them - so the demonyms are
   * indexed alongside names and aliases, and a mention of one links to this
   * article instead of raising a stub for a people that already has one.
   *
   * Ranked below both: where a demonym collides with something's actual title,
   * the title wins.
   */
  demonyms?: string[]
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
  /**
   * The timeline this is filed under, for the things that are filed into one.
   *
   * A column rather than an attribute, for the same reason the dates are: the
   * span of a timeline has to be readable from its events without knowing which
   * container they came from or what that container calls its fields. Only
   * events carry one today; nothing stops something else from later.
   */
  timeline?: string
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
  /**
   * The work people do here. Carried into every brief, because a trade the
   * world has no room for is exactly the kind of thing that gets invented.
   */
  professions?: string[]
  /**
   * How often an optional field is filled, where this world differs from the
   * default the field spec declares.
   *
   * `{ people: { honorific: 0.6 } }` - a world of titles. The spec's own rate
   * is a sensible default across worlds, not a fact about any of them: a court
   * chronicle and a fishing village disagree about how many people have a
   * title, and both are right.
   *
   * Only the fields that differ. Anything absent keeps the spec's number.
   */
  fillRates?: FillRates
  inspiration?: string[]
  createdAt: string
  updatedAt?: string
}

/**
 * Per-container, per-field fill rates: `{ people: { honorific: 0.6 } }`.
 *
 * A share between 0 and 1. Zero is meaningful - it says this world never fills
 * the field - and is why the lookup has to distinguish absent from zero.
 */
export type FillRates = Record<string, Record<string, number>>

/** The editable half of a manifest: everything the form can set. */
export type UniverseDraft = Partial<Omit<Universe, 'id' | 'createdAt' | 'updatedAt'>>

/**
 * A bucket for history, and a place in a tree of them.
 *
 * Not a container. A timeline holds no article and describes nothing; it says
 * which stretch of a universe's history an event belongs to, and which larger
 * stretch that one sits inside:
 *
 *   Universal History
 *     History of Waresia
 *       Reign of King Tarinian
 *         War of the Stewards
 *
 * It carries no dates of its own. A timeline's span is whatever its events say
 * it is - the earliest year under it to the latest - so it cannot disagree with
 * its own contents, and a reign that turns out to have started a year earlier
 * does not have to be corrected in two places.
 */
export interface Timeline {
  id: string
  name: string
  /**
   * The timeline this one sits under. Absent on the root and on nothing else:
   * every universe has exactly one Universal History, and everything else
   * hangs off it.
   */
  parent?: string
  createdAt: string
  updatedAt?: string
}

/**
 * The one timeline every universe has.
 *
 * A fixed id rather than a minted one, so an event can default to it without a
 * lookup and code can recognise it without asking the store. Ids are per
 * universe - a store handle is bound to one - so the same id in every universe
 * collides with nothing.
 */
export const ROOT_TIMELINE_ID = 'universal'
export const ROOT_TIMELINE_NAME = 'Universal History'

export interface NewItem {
  container: string
  name: string
  kind?: string
  stub?: boolean
  aliases?: string[]
  demonyms?: string[]
  summary?: string
  beginDate?: string
  endDate?: string
  timeline?: string
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
