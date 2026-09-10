/**
 * The part of an article a die can decide, decided by a die.
 *
 * A model asked to pick does not sample - it reaches for whatever the canon
 * makes most salient, every time. Given a world whose genre is "maritime
 * adventure", whose theme is "the folly of unbridled ambition" and whose one
 * mystery is an ocean nobody has crossed, every person it invents is a sea
 * captain who died trying to cross it. That is not a failure of imagination. It
 * is the highest-scoring answer to the question as asked.
 *
 * So the question stops being asked. Canon says what this world *permits*;
 * which of the permitted things this particular person is gets rolled here,
 * against what the store actually holds. Randomness in code, coherence in the
 * model - the same split that keeps closure and stub-matching out of prompts.
 *
 * Everything is sampled from the universe where the universe has an opinion,
 * and falls back only where it has none. A world that has recorded five
 * ethnicities rolls one of those five.
 */
import { ROOT_TIMELINE_ID, type Item, type Timeline, type Universe } from './types.ts'
import { yearOf } from './timelines.ts'

export interface Skeleton {
  /** Values the roll settled. Applied to the form before anything is generated. */
  values: Record<string, unknown>
  /**
   * Fields this person simply does not have.
   *
   * Excluded from generation rather than left to the model, which fills every
   * optional field it is offered: asked for an honorific it returns one, and
   * every person in the world ends up a Captain. Most people have no title and
   * no nickname, and the only way to get that is to not ask.
   */
  omit: string[]
  /** What the roll decided that is not a field: station, era, what was going on. */
  notes: string[]
}

/** A source of randomness, injectable so a roll can be reproduced in a test. */
export type Random = () => number

export interface RollContext {
  universe: Universe
  items: Item[]
  timelines: Timeline[]
}

const pick = <T,>(list: T[], random: Random): T => list[Math.floor(random() * list.length)]

/** Pick from weighted options. Weights are shares and need not sum to one. */
function weighted<T>(options: { p: number; value: T }[], random: Random): T {
  const total = options.reduce((sum, o) => sum + o.p, 0)
  let roll = random() * total
  for (const option of options) {
    roll -= option.p
    if (roll <= 0) return option.value
  }
  return options[options.length - 1].value
}

/** True with the given probability. */
const chance = (p: number, random: Random) => random() < p

/** The distinct non-empty values an attribute takes across a set of items. */
function established(items: Item[], container: string, attribute: string): string[] {
  const seen = new Set<string>()
  for (const item of items) {
    if (item.container !== container) continue
    const value = item.attributes?.[attribute]
    if (typeof value === 'string' && value.trim()) seen.add(value.trim())
  }
  return [...seen]
}

const namesIn = (items: Item[], container: string) =>
  items.filter((i) => i.container === container).map((i) => i.name)

/**
 * How close this person stands to what the world is *about*.
 *
 * The dial that stops a universe being made entirely of protagonists. A world
 * whose theme is unbridled ambition is mostly populated by people who watched
 * somebody ambitious drown, and a world with an uncrossable ocean still has
 * magistrates and cooks who have never once thought about crossing it.
 */
const STANDING = [
  {
    p: 0.75,
    value:
      'This person has no connection to what the universe is *about*. Its central mystery, its ' +
      'headline conflict, its theme - none of it is their story. They know of it the way anyone ' +
      'knows of a famous disaster. Write an ordinary life lived alongside it, not a life shaped ' +
      'by it.',
  },
  {
    p: 0.2,
    value:
      'This person stands near what the universe is about without being at its centre: they ' +
      'supply, serve, police, profit from or clean up after it. The connection is a fact of their ' +
      'working life, not the meaning of it.',
  },
  {
    p: 0.05,
    value:
      'This person is caught up in what the universe is about. This is the rare case - write them ' +
      'as the exception they are, and remember the world is mostly full of people who are not.',
  },
]

/**
 * A skeleton for a person: the enumerable facts, rolled.
 *
 * Returns nothing for a field the universe has nothing to roll from. A blank is
 * honest; inventing an ethnicity for a world that has recorded none is the
 * behaviour this exists to prevent.
 */
export function rollPerson(context: RollContext, random: Random = Math.random): Skeleton {
  const { universe, items, timelines } = context
  const values: Record<string, unknown> = {}
  const omit: string[] = []
  const notes: string[] = []

  // --- work ---------------------------------------------------------------
  const professions = universe.professions ?? []
  if (professions.length) {
    const trade = pick(professions, random)
    notes.push(
      `Their trade is: ${trade}. This was chosen at random from the trades this world has room ` +
        `for. Write the person around it rather than steering them toward something more ` +
        `dramatic - the point of rolling it is that most people do ordinary work.`,
    )
  } else {
    notes.push(
      `This universe has recorded no list of professions, so pick something deliberately ` +
        `ordinary and not connected to the world's headline conflict.`,
    )
  }

  // --- where they are from ------------------------------------------------
  const places = namesIn(items, 'locations')
  if (places.length) values.placeOfBirth = pick(places, random)

  const peoples = namesIn(items, 'ethnicities')
  const recorded = established(items, 'people', 'ethnicity')
  const ethnicities = peoples.length ? peoples : recorded
  if (ethnicities.length) values.ethnicity = pick(ethnicities, random)

  // --- who they are -------------------------------------------------------
  // Sampled from the words this universe has already used, so a world with its
  // own categories is not handed ours.
  const sexes = established(items, 'people', 'sex')
  values.sex = sexes.length ? pick(sexes, random) : pick(['female', 'male'], random)

  const genders = established(items, 'people', 'gender')
  if (genders.length) values.gender = pick(genders, random)

  // --- when they lived ----------------------------------------------------
  const span = universe.totalYears ?? 1000
  const born = Math.floor(random() * span)
  values.birthYear = String(born)

  // Most people die of nothing worth recording, at an unremarkable age.
  const lifespan = 45 + Math.floor(random() * 45)
  const died = born + lifespan
  if (died < span) {
    values.deathYear = String(died)
    notes.push(
      chance(0.85, random)
        ? `They died in year ${died}, aged about ${lifespan}, of something ordinary. Not a ` +
            `notable death, and not connected to the world's central mystery.`
        : `They died in year ${died}, aged about ${lifespan}. This is one of the few whose death ` +
            `is worth an article of its own.`,
    )
  } else {
    notes.push(
      `They are still alive, born in year ${born} and about ${span - born} years old at the end ` +
        `of recorded canon. Leave the death fields empty.`,
    )
  }

  // What the timeline says was going on while they were alive. Events, not
  // vibes: something they could actually have lived through.
  const lived = items
    .filter((i) => i.timeline)
    .map((i) => ({ name: i.name, year: yearOf(i.beginDate), timeline: i.timeline! }))
    .filter((e) => e.year !== null && e.year >= born && e.year <= (died < span ? died : span))
  if (lived.length) {
    const shown = lived.slice(0, 8).map((e) => `${e.name} (${e.year})`)
    notes.push(
      `Recorded events within their lifetime: ${shown.join(', ')}. They need not have taken part ` +
        `in any of them - most people do not - but these are what the world was doing while they ` +
        `were in it.`,
    )
  }
  const named = timelines.filter((t) => t.id !== ROOT_TIMELINE_ID)
  if (named.length) notes.push(`Timelines this world keeps: ${named.map((t) => t.name).join(', ')}.`)

  // --- what most people do not have ---------------------------------------
  // Rolled, because asked, a model gives everyone a title and three nicknames.
  if (!chance(0.15, random)) omit.push('honorific')
  if (!chance(0.2, random)) omit.push('nicknames')
  if (!chance(0.35, random)) omit.push('middleName')
  if (!chance(0.1, random)) omit.push('suffix')
  if (!chance(0.25, random)) omit.push('titles')

  notes.push(weighted(STANDING, random))
  return { values, omit, notes }
}

/** Containers that have a roll. Others generate exactly as before. */
export const ROLLED = new Set(['people'])

export function rollFor(
  container: string,
  context: RollContext,
  random: Random = Math.random,
): Skeleton | null {
  return container === 'people' ? rollPerson(context, random) : null
}
