import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  JsonFileStore,
  ROOT_TIMELINE_ID,
  ROOT_TIMELINE_NAME,
  treeOf,
  flatten,
  subtree,
  ancestors,
  spanOf,
  assertValidPlacement,
  type Store,
  type Timeline,
} from '../src/index.ts'

/** The tree from the spec, as a flat list. */
const waresia: Timeline[] = [
  { id: ROOT_TIMELINE_ID, name: ROOT_TIMELINE_NAME, createdAt: '' },
  { id: 'w', name: 'History of Waresia', parent: ROOT_TIMELINE_ID, createdAt: '' },
  { id: 'r', name: 'Reign of King Tarinian', parent: 'w', createdAt: '' },
  { id: 's', name: 'War of the Stewards', parent: 'r', createdAt: '' },
]

describe('the shape of a set of timelines', () => {
  it('hangs each under its parent, in order', () => {
    const lines = flatten(treeOf(waresia)).map((n) => '  '.repeat(n.depth) + n.name)
    assert.deepEqual(lines, [
      'Universal History',
      '  History of Waresia',
      '    Reign of King Tarinian',
      '      War of the Stewards',
    ])
  })

  it('re-hangs an orphan on the root rather than losing it', () => {
    // The store does not allow this; a file edited by hand can.
    const broken = waresia.map((t) => (t.id === 'r' ? { ...t, parent: 'gone' } : t))
    assert.equal(flatten(treeOf(broken)).length, 4, 'nothing was dropped')
    assert.equal(treeOf(broken).length, 2, 'the orphan became a second root')
  })

  it('reaches every descendant, at any depth', () => {
    assert.deepEqual(subtree(waresia, 'w').sort(), ['r', 's', 'w'])
    assert.deepEqual(subtree(waresia, 's'), ['s'])
  })

  it('walks back up to the root', () => {
    assert.deepEqual(ancestors(waresia, 's'), ['r', 'w', ROOT_TIMELINE_ID])
    assert.deepEqual(ancestors(waresia, ROOT_TIMELINE_ID), [])
  })
})

describe('what a timeline spans', () => {
  const events = [
    { timeline: 'r', year: 412 },
    { timeline: 's', year: 431 },
    { timeline: 's', year: 428 },
  ]

  it('covers the events of everything beneath it', () => {
    // The war was fought during the reign, and nothing on the war says so.
    assert.deepEqual(spanOf(waresia, events, 'r'), { first: 412, last: 431 })
    assert.deepEqual(spanOf(waresia, events, ROOT_TIMELINE_ID), { first: 412, last: 431 })
  })

  it('is only its own events at the bottom of the tree', () => {
    assert.deepEqual(spanOf(waresia, events, 's'), { first: 428, last: 431 })
  })

  it('has no span at all when nothing has been filed under it', () => {
    // Not a zero-length one: "nothing here yet" and "everything here happened
    // in year 0" are different claims.
    assert.equal(spanOf(waresia, [], 'w'), null)
  })
})

describe('where a timeline may be placed', () => {
  it('refuses a name already in use, whatever its case', () => {
    assert.throws(
      () => assertValidPlacement(waresia, { name: 'history of waresia' }),
      /already has a timeline called "History of Waresia"/,
    )
  })

  it('lets a timeline keep its own name while being moved', () => {
    assertValidPlacement(waresia, { name: 'War of the Stewards', parent: 'w' }, 's')
  })

  it('refuses a parent that does not exist', () => {
    assert.throws(() => assertValidPlacement(waresia, { name: 'New', parent: 'nope' }), /No timeline/)
  })

  it('refuses to make a timeline its own parent', () => {
    assert.throws(() => assertValidPlacement(waresia, { name: 'x', parent: 'r' }, 'r'), /own parent/)
  })

  it('refuses to move a timeline under its own descendant', () => {
    // The pair would still point at each other and nothing walking down from
    // the root would ever reach either again.
    assert.throws(
      () => assertValidPlacement(waresia, { name: 'History of Waresia', parent: 's' }, 'w'),
      /already sits under this timeline/,
    )
  })

  it('refuses to give the root a parent', () => {
    assert.throws(
      () => assertValidPlacement(waresia, { name: ROOT_TIMELINE_NAME, parent: 'w' }, ROOT_TIMELINE_ID),
      /sits under nothing/,
    )
  })
})

describe('timelines in the store', () => {
  let dir: string
  let store: Store

  before(async () => {
    dir = await mkdtemp(join(tmpdir(), 'sb-timelines-'))
    store = await JsonFileStore.create(join(dir, 'u'), { id: 'u', name: 'U' })
  })
  after(async () => rm(dir, { recursive: true, force: true }))

  it('gives a new universe its Universal History', async () => {
    const list = await store.timelines()
    assert.equal(list.length, 1)
    assert.equal(list[0].id, ROOT_TIMELINE_ID)
    assert.equal(list[0].name, ROOT_TIMELINE_NAME)
    assert.equal(list[0].parent, undefined)
  })

  it('gives one to a universe that predates timelines', async () => {
    // No timelines file at all, as in every universe made before this feature.
    const bare = new JsonFileStore(join(dir, 'old'))
    const list = await bare.timelines()
    assert.equal(list.length, 1)
    assert.equal(list[0].id, ROOT_TIMELINE_ID)
    // And the healing is written, not recomputed on every read.
    assert.deepEqual(await bare.timelines(), list)
  })

  it('puts a new timeline under the Universal History by default', async () => {
    const added = await store.addTimeline({ name: 'History of Waresia' })
    assert.equal(added.parent, ROOT_TIMELINE_ID)
    assert.equal((await store.timelines()).length, 2)
  })

  it('nests one under another', async () => {
    const w = (await store.timelines()).find((t) => t.name === 'History of Waresia')!
    const reign = await store.addTimeline({ name: 'Reign of King Tarinian', parent: w.id })
    const war = await store.addTimeline({ name: 'War of the Stewards', parent: reign.id })

    assert.deepEqual(ancestors(await store.timelines(), war.id), [reign.id, w.id, ROOT_TIMELINE_ID])
  })

  it('reassigns one under a different parent', async () => {
    const list = await store.timelines()
    const war = list.find((t) => t.name === 'War of the Stewards')!
    const w = list.find((t) => t.name === 'History of Waresia')!

    const moved = await store.updateTimeline(war.id, { parent: w.id })
    assert.equal(moved.parent, w.id)
    assert.equal(ancestors(await store.timelines(), war.id).length, 2)
  })

  it('renames one, leaving it where it was', async () => {
    const war = (await store.timelines()).find((t) => t.name === 'War of the Stewards')!
    const renamed = await store.updateTimeline(war.id, { name: 'The Stewards War' })
    assert.equal(renamed.name, 'The Stewards War')
    assert.equal(renamed.parent, war.parent)
  })

  it('will not rename, move or remove the Universal History', async () => {
    await assert.rejects(
      store.updateTimeline(ROOT_TIMELINE_ID, { name: 'All of It' }),
      /cannot be renamed/,
    )
    await assert.rejects(store.removeTimeline(ROOT_TIMELINE_ID), /cannot be removed/)
  })

  it('refuses a duplicate name through the store, not only the checker', async () => {
    await assert.rejects(store.addTimeline({ name: 'history of waresia' }), /already has a timeline/)
  })

  it('moves the children up when a timeline is removed', async () => {
    const list = await store.timelines()
    const w = list.find((t) => t.name === 'History of Waresia')!
    const under = list.filter((t) => t.parent === w.id).map((t) => t.id)
    assert.ok(under.length > 0, 'there is something to inherit')

    await store.removeTimeline(w.id)
    const after = await store.timelines()

    assert.equal(
      after.find((t) => t.id === w.id),
      undefined,
    )
    for (const id of under) {
      assert.equal(after.find((t) => t.id === id)!.parent, ROOT_TIMELINE_ID)
    }
  })
})
