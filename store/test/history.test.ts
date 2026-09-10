import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  JsonFileStore,
  ROOT_TIMELINE_ID,
  defaultValues,
  draftToItem,
  eventsIn,
  fieldsFor,
  itemToDraft,
  spanOf,
  validate,
  yearOf,
  type Item,
  type Store,
} from '../src/index.ts'

const burning = {
  name: 'The Burning of the Ash Seat',
  beginDate: 'Year 431',
  durationDays: 1,
  timeline: ROOT_TIMELINE_ID,
  description: 'The hall went up in a night, and the Reach with it.',
  relatedPeople: ['Aldrica Vane'],
}

describe('the history spec', () => {
  it('asks for a duration rather than an end date', () => {
    // The whole design of the container. An end date invites "1139 to 1150",
    // and a thing that spans eleven years is a timeline, not an event.
    const spec = fieldsFor('history')!
    assert.equal(
      spec.find((f) => f.storeAs === 'endDate'),
      undefined,
    )
    const duration = spec.find((f) => f.key === 'durationDays')!
    assert.equal(duration.kind, 'number')
    assert.equal(duration.required, true)
    assert.equal(duration.default, 0)
  })

  it('requires a name, a begin date, a duration and a timeline', () => {
    const required = fieldsFor('history')!
      .filter((f) => f.required)
      .map((f) => f.key)
    assert.deepEqual(required, ['name', 'beginDate', 'durationDays', 'timeline'])
  })

  it('starts a blank event on the Universal History', () => {
    assert.equal(defaultValues('history').timeline, ROOT_TIMELINE_ID)
  })

  it('keeps a zero duration rather than reading it as blank', () => {
    // A required number defaulting to 0 would be unsaveable if 0 read as empty.
    const item = draftToItem('history', { ...burning, durationDays: 0 })
    assert.equal(item.attributes!.durationDays, 0)
  })

  it('stores the timeline on its own column, not in attributes', () => {
    const item = draftToItem('history', burning)
    assert.equal(item.timeline, ROOT_TIMELINE_ID)
    assert.equal(item.attributes?.timeline, undefined)
    assert.equal(item.beginDate, 'Year 431')
  })

  it('reads it back into the form', () => {
    const stored = { ...draftToItem('history', burning), id: 'x', tags: [] } as unknown as Item
    assert.equal(itemToDraft('history', stored).timeline, ROOT_TIMELINE_ID)
  })
})

describe('reading a year out of a date', () => {
  it('takes the longest run of digits', () => {
    // "January 1, 1139" has two numbers in it and only one of them is a year.
    assert.equal(yearOf('January 1, 1139'), 1139)
    assert.equal(yearOf('Year 412'), 412)
    assert.equal(yearOf('Third Age, 2941'), 2941)
    assert.equal(yearOf('1139-01-01'), 1139)
  })

  it('keeps a minus sign against the number', () => {
    assert.equal(yearOf('about -570'), -570)
  })

  it('takes the first when two runs tie, since a begin date says when it began', () => {
    assert.equal(yearOf('1139 to 1141'), 1139)
  })

  it('says so when there is no year to be had', () => {
    assert.equal(yearOf('midwinter'), null)
    assert.equal(yearOf(''), null)
    assert.equal(yearOf(undefined), null)
  })
})

describe('events and the timelines they are filed under', () => {
  let dir: string
  let store: Store
  let waresia: string
  let reign: string

  before(async () => {
    dir = await mkdtemp(join(tmpdir(), 'sb-history-'))
    store = await JsonFileStore.create(join(dir, 'u'), { id: 'u', name: 'U' })
    waresia = (await store.addTimeline({ name: 'History of Waresia' })).id
    reign = (await store.addTimeline({ name: 'Reign of King Tarinian', parent: waresia })).id
  })
  after(async () => rm(dir, { recursive: true, force: true }))

  it('refuses an event filed under a timeline that does not exist', async () => {
    await assert.rejects(
      store.add(draftToItem('history', { ...burning, timeline: 'nope' })),
      /No timeline with id "nope"/,
    )
  })

  it('spans a timeline from the events under it', async () => {
    await store.add(draftToItem('history', { ...burning, beginDate: 'Year 431', timeline: reign }))
    await store.add(
      draftToItem('history', {
        name: 'The Third Crossing',
        beginDate: '412',
        durationDays: 9,
        timeline: waresia,
      }),
    )

    const lines = await store.timelines()
    const events = eventsIn(await store.list())
    // The reign holds one event; Waresia holds the other and contains the reign.
    assert.deepEqual(spanOf(lines, events, reign), { first: 431, last: 431 })
    assert.deepEqual(spanOf(lines, events, waresia), { first: 412, last: 431 })
    assert.deepEqual(spanOf(lines, events, ROOT_TIMELINE_ID), { first: 412, last: 431 })
  })

  it('leaves an event out of every span when no year can be read', async () => {
    const vague = await store.add(
      draftToItem('history', {
        name: 'The Night of Bells',
        beginDate: 'midwinter',
        durationDays: 1,
        timeline: reign,
      }),
    )
    assert.equal(eventsIn(await store.list()).length, 2, 'the vague one is not counted')

    // And says so, rather than letting it drop out silently.
    const issues = await validate(store)
    const warning = issues.find((i) => i.itemId === vague.id)!
    assert.match(warning.message, /no year that can be read/)
    assert.equal(warning.severity, 'warning')

    await store.remove(vague.id)
  })

  it('moves the events up when their timeline is removed', async () => {
    // Deleting the reign says the reign is not a useful grouping. It does not
    // say the burning of the Ash Seat never happened.
    const before = (await store.list()).filter((i) => i.timeline === reign)
    assert.ok(before.length > 0)

    await store.removeTimeline(reign)

    for (const event of before) {
      assert.equal((await store.get(event.id))!.timeline, waresia)
    }
    // And the span it used to hold is still covered by what inherited it.
    const lines = await store.timelines()
    assert.deepEqual(spanOf(lines, eventsIn(await store.list()), waresia), { first: 412, last: 431 })
  })

  it('reports an event orphaned by a hand-edit', async () => {
    // The store refuses this; a text editor does not, and the files are meant
    // to be editable. So something has to check the edges afterwards.
    const path = join(dir, 'u', 'store', 'history.json')
    const file = JSON.parse(await readFile(path, 'utf8'))
    file.items[0].timeline = 'gone'
    await writeFile(path, JSON.stringify(file, null, 2), 'utf8')

    const issue = (await validate(store)).find((i) => i.itemId === file.items[0].id)!
    assert.equal(issue.severity, 'error')
    assert.match(issue.message, /filed under timeline "gone", which does not exist/)
  })
})
