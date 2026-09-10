import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ROOT_TIMELINE_ID, rollPerson, type Item, type Timeline, type Universe } from '../src/index.ts'

/** A predictable die, so a roll can be asserted rather than sampled. */
const sequence = (values: number[]) => {
  let i = 0
  return () => values[i++ % values.length]
}

const universe: Universe = {
  id: 'u',
  name: 'U',
  totalYears: 1000,
  professions: ['tanner', 'harbour clerk', 'ferryman'],
  createdAt: '',
}

const item = (container: string, name: string, extra: Partial<Item> = {}): Item =>
  ({ id: name, container, name, tags: [], createdAt: '', updatedAt: '', ...extra }) as Item

const items: Item[] = [
  item('locations', 'Kell'),
  item('locations', 'Dol'),
  item('ethnicities', 'Kellish'),
  item('history', 'The Drowning of Dol', {
    beginDate: '412',
    timeline: ROOT_TIMELINE_ID,
  }),
  item('history', 'The Long Winter', { beginDate: '980', timeline: ROOT_TIMELINE_ID }),
]

const timelines: Timeline[] = [
  { id: ROOT_TIMELINE_ID, name: 'Universal History', createdAt: '' },
  { id: 'w', name: 'History of Waresia', parent: ROOT_TIMELINE_ID, createdAt: '' },
]

const context = { universe, items, timelines }

describe('rolling the part of a person a die can decide', () => {
  it('is reproducible, so a roll can be argued with', () => {
    const a = rollPerson(context, sequence([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]))
    const b = rollPerson(context, sequence([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]))
    assert.deepEqual(a, b)
  })

  it('takes the trade from the list the universe keeps', () => {
    // The whole point: a die chooses, not the model. Told to pick, a model
    // reaches for whatever the canon makes loudest, every single time.
    const trades = new Set<string>()
    for (let i = 0; i < 40; i++) {
      const note = rollPerson(context).notes.find((n) => n.startsWith('Their trade is:'))
      assert.ok(note, 'a trade was rolled')
      trades.add(note.slice('Their trade is: '.length).split('.')[0])
    }
    assert.deepEqual([...trades].sort(), ['ferryman', 'harbour clerk', 'tanner'])
  })

  it('says so rather than inventing one when the universe keeps no list', () => {
    const bare = rollPerson({ ...context, universe: { ...universe, professions: [] } })
    assert.ok(bare.notes.some((n) => /no list of professions/.test(n)))
  })

  it('samples places and peoples from what the store actually holds', () => {
    const born = new Set<unknown>()
    for (let i = 0; i < 30; i++) born.add(rollPerson(context).values.placeOfBirth)
    assert.deepEqual([...born].sort(), ['Dol', 'Kell'])
    assert.equal(rollPerson(context).values.ethnicity, 'Kellish')
  })

  it('leaves a field blank when there is nothing to roll from', () => {
    // Inventing an ethnicity for a world that has recorded none is exactly the
    // behaviour the roll exists to prevent.
    const empty = rollPerson({ ...context, items: [] })
    assert.equal(empty.values.ethnicity, undefined)
    assert.equal(empty.values.placeOfBirth, undefined)
  })

  it('prefers the words the universe already uses over ours', () => {
    const own = [...items, item('people', 'Someone', { attributes: { sex: 'thirdborn' } })]
    const rolled = rollPerson({ ...context, items: own })
    assert.equal(rolled.values.sex, 'thirdborn')
  })

  it('gives most people no title and no nickname', () => {
    // Asked for an honorific a model returns one, and every person in the world
    // becomes a Captain. The only way to get an ordinary person is not to ask.
    let titled = 0
    let nicknamed = 0
    for (let i = 0; i < 400; i++) {
      const { omit } = rollPerson(context)
      if (!omit.includes('honorific')) titled++
      if (!omit.includes('nicknames')) nicknamed++
    }
    assert.ok(titled < 120, `honorifics are the exception: ${titled} of 400`)
    assert.ok(nicknamed < 140, `nicknames are the exception: ${nicknamed} of 400`)
  })

  it('keeps most people away from what the world is about', () => {
    let central = 0
    for (let i = 0; i < 400; i++) {
      if (rollPerson(context).notes.some((n) => /caught up in what the universe is about/.test(n))) {
        central++
      }
    }
    // A world made entirely of protagonists is a world where nobody bakes bread.
    assert.ok(central < 60, `few people are at the centre of it: ${central} of 400`)
  })

  it('places them in time, and says what happened while they were alive', () => {
    const rolled = rollPerson(context, sequence([0.4]))
    const born = Number(rolled.values.birthYear)
    assert.ok(Number.isFinite(born) && born >= 0 && born < 1000)

    const lifetime = rolled.notes.find((n) => n.startsWith('Recorded events within'))
    if (lifetime) {
      // Only events they could actually have lived through.
      const died = Number(rolled.values.deathYear ?? 1000)
      for (const [, year] of lifetime.matchAll(/\((\d+)\)/g)) {
        assert.ok(Number(year) >= born && Number(year) <= died, `${year} is within ${born}-${died}`)
      }
    }
  })

  it('leaves the death fields alone for someone still alive', () => {
    // Born late enough that the canon ends before they do.
    const late = rollPerson(context, sequence([0.99, 0.99, 0.99, 0.99, 0.99, 0.99]))
    if (late.values.deathYear === undefined) {
      assert.ok(late.notes.some((n) => /still alive/.test(n)))
    }
  })
})
