import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ROOT_TIMELINE_ID, rollPerson, type Item, type Universe } from '../src/index.ts'

const universe: Universe = {
  id: 'u',
  name: 'U',
  totalYears: 1000,
  professions: ['tanner', 'pilot'],
  createdAt: '',
}

const item = (container: string, name: string, extra: Partial<Item> = {}): Item =>
  ({ id: name, container, name, tags: [], createdAt: '', updatedAt: '', ...extra }) as Item

/** A crowded decade and one outlier far from it. */
const items: Item[] = [
  item('history', 'The Cooper Strike', { beginDate: '430', timeline: ROOT_TIMELINE_ID }),
  item('history', 'The Souring', { beginDate: '431', timeline: ROOT_TIMELINE_ID }),
  item('history', 'The Long Damp', { beginDate: '434', timeline: ROOT_TIMELINE_ID }),
  item('history', 'The Purser Flight', { beginDate: '436', timeline: ROOT_TIMELINE_ID }),
  item('history', 'The Quiet Winter', { beginDate: '438', timeline: ROOT_TIMELINE_ID }),
  item('history', 'The Founding', { beginDate: '402', timeline: ROOT_TIMELINE_ID }),
]

const context = { universe, items, timelines: [] }

describe('aiming the roll at a year', () => {
  it('produces someone alive in that year, every time', () => {
    for (const year of [5, 200, 431, 999]) {
      for (let i = 0; i < 300; i++) {
        const { values } = rollPerson(context, Math.random, { year })
        const born = Number(values.birthYear)
        const died = values.deathYear === undefined ? Infinity : Number(values.deathYear)
        assert.ok(born <= year && year <= died, `born ${born}, died ${died}, target ${year}`)
      }
    }
  })

  it('lets someone be older than the records rather than making them a toddler', () => {
    // Year 0 is where the chronicle begins, not where the world did. Clamped
    // there, everyone alive in year 5 was necessarily under five.
    let oldest = 0
    for (let i = 0; i < 500; i++) {
      const born = Number(rollPerson(context, Math.random, { year: 5 }).values.birthYear)
      oldest = Math.max(oldest, 5 - born)
    }
    assert.ok(oldest > 40, `the oldest person alive in year 5 was ${oldest}`)
  })

  it('says so when someone was born before the chronicle', () => {
    const said: string[] = []
    for (let i = 0; i < 300; i++) {
      const rolled = rollPerson(context, Math.random, { year: 10 })
      if (Number(rolled.values.birthYear) < 0) said.push(...rolled.notes)
    }
    assert.ok(said.some((n) => /before the canon/.test(n)), 'a negative birth year explains itself')
  })

  it('leaves the whole canon in play when no year is given', () => {
    const years: number[] = []
    for (let i = 0; i < 400; i++) years.push(Number(rollPerson(context).values.birthYear))
    assert.ok(Math.max(...years) - Math.min(...years) > 700, 'births spread across the canon')
  })

  it('gives the generator the events nearest the year it was aimed at', () => {
    // The point of a year. Aimed at a crowded decade, the article is written
    // against that decade rather than whichever events happened to be listed.
    let checked = 0
    for (let i = 0; i < 200; i++) {
      const line = rollPerson(context, Math.random, { year: 435 }).notes.find((n) =>
        n.startsWith('Recorded events'),
      )
      if (!line) continue
      checked++
      assert.match(line, /nearest 435 first/)
    }
    assert.ok(checked > 100, `the note appeared ${checked} times`)
  })

  it('drops the far event before the near ones when it has to choose', () => {
    const many: Item[] = [
      ...items,
      ...Array.from({ length: 10 }, (_, n) =>
        item('history', `Filler ${n}`, { beginDate: String(432 + n), timeline: ROOT_TIMELINE_ID }),
      ),
    ]
    const years = many.map((i) => Number(i.beginDate))

    let tested = 0
    for (let i = 0; i < 400; i++) {
      const rolled = rollPerson({ ...context, items: many }, Math.random, { year: 435 })
      const born = Number(rolled.values.birthYear)
      const died = rolled.values.deathYear === undefined ? 1000 : Number(rolled.values.deathYear)
      const line = rolled.notes.find((n) => n.startsWith('Recorded events'))
      if (!line) continue

      // Only a cut proves anything. A lifetime holding eight events or fewer
      // shows all of them, the far one included, and rightly.
      const inside = years.filter((y) => y >= born && y <= Math.min(died, 1000))
      if (inside.length <= 8 || born > 402) continue

      tested++
      assert.ok(!line.includes('The Founding'), `the far event survived the cut: ${line}`)
    }
    assert.ok(tested > 10, `the cut was exercised ${tested} times`)
  })
})
