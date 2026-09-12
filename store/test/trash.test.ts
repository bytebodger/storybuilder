import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { JsonFileStore, referencesTo, validate, type Item, type Store } from '../src/index.ts'

/** Ricky Rocket, and the three articles that talk about him. */
async function world(): Promise<{ store: Store; dir: string; ricky: Item }> {
  const dir = await mkdtemp(join(tmpdir(), 'sb-trash-'))
  const store = await JsonFileStore.create(join(dir, 'u'), { id: 'u', name: 'U' })

  const ricky = await store.add({ container: 'people', name: 'Ricky Rocket' })
  const crew = await store.add({ container: 'institutions', name: 'The Rocket Crew' })
  await store.add({
    container: 'locations',
    name: 'Dol',
    summary: 'The port Ricky Rocket sailed out of.',
  })
  await store.add({
    container: 'history',
    name: 'The Launch',
    attributes: { description: 'Ricky Rocket was there, and said nothing.' },
  })

  await store.link(ricky.id, crew.id)
  return { store, dir, ricky }
}

describe('what would notice if this went away', () => {
  let store: Store
  let dir: string
  let ricky: Item

  before(async () => ({ store, dir, ricky } = await world()))
  after(async () => rm(dir, { recursive: true, force: true }))

  it('counts an edge and a mention as different things', async () => {
    // An edge is cut by trashing; a mention is not touched at all. Telling the
    // author "three articles" without saying which kind would be a warning
    // about the wrong thing.
    const refs = referencesTo(ricky, await store.list())
    assert.deepEqual(refs.linked.map((i) => i.name), ['The Rocket Crew'])
    assert.deepEqual(refs.mentioned.map((i) => i.name).sort(), ['Dol', 'The Launch'])
  })

  it('never counts an article twice, or itself', async () => {
    const refs = referencesTo(ricky, await store.list())
    const ids = [...refs.linked, ...refs.mentioned].map((i) => i.id)
    assert.equal(new Set(ids).size, ids.length)
    assert.ok(!ids.includes(ricky.id))
  })
})

describe('trashing an article', () => {
  let store: Store
  let dir: string
  let ricky: Item

  before(async () => ({ store, dir, ricky } = await world()))
  after(async () => rm(dir, { recursive: true, force: true }))

  it('takes it out of the world without destroying it', async () => {
    await store.trash(ricky.id)

    const live = await store.list()
    assert.equal(live.find((i) => i.id === ricky.id), undefined, 'gone from the world')
    assert.equal((await store.get(ricky.id))?.name, 'Ricky Rocket', 'still on disk')
    assert.deepEqual((await store.trashed()).map((i) => i.name), ['Ricky Rocket'])
  })

  it('cuts the edges on both sides, and keeps them', async () => {
    const crew = (await store.list()).find((i) => i.name === 'The Rocket Crew')!
    assert.deepEqual(crew.tags, [], 'the other side no longer points at him')

    const trashed = (await store.get(ricky.id))!
    assert.deepEqual(trashed.tags, [])
    assert.equal(trashed.trashed?.tags.length, 1, 'kept, so a rescue can put it back')
  })

  it('leaves every word of every other article alone', async () => {
    // The whole point: his name is not scrubbed out of the articles that talk
    // about him. They simply stop linking to him.
    const dol = (await store.list()).find((i) => i.name === 'Dol')!
    assert.match(dol.summary!, /Ricky Rocket/)
  })

  it('leaves the store valid, with no dangling edges', async () => {
    assert.deepEqual(await validate(store), [])
  })

  it('does not hand his id to the next article written', async () => {
    // He is coming back one day, and two items with one id is the worst
    // possible way to find that out.
    const ids = new Set<string>()
    for (let i = 0; i < 12; i++) {
      ids.add((await store.add({ container: 'people', name: `Someone ${i}` })).id)
    }
    assert.ok(!ids.has(ricky.id))
  })
})

describe('rescuing one', () => {
  let store: Store
  let dir: string
  let ricky: Item

  before(async () => ({ store, dir, ricky } = await world()))
  after(async () => rm(dir, { recursive: true, force: true }))

  it('puts it back, with the edges it went in with', async () => {
    await store.trash(ricky.id)
    const { item, relinked, refused } = await store.restore(ricky.id)

    assert.equal(item.trashed, undefined)
    assert.equal(relinked, 1)
    assert.deepEqual(refused, [])
    assert.ok((await store.list()).some((i) => i.id === ricky.id))

    const crew = (await store.list()).find((i) => i.name === 'The Rocket Crew')!
    assert.deepEqual(crew.tags.map((t) => t.relatedTo), [ricky.id], 'and the far side points back')
    assert.deepEqual(await validate(store), [])
  })

  it('says so rather than failing when an edge cannot be re-made', async () => {
    const crew = (await store.list()).find((i) => i.name === 'The Rocket Crew')!
    await store.trash(ricky.id)
    await store.remove(crew.id)

    const { item, relinked, refused } = await store.restore(ricky.id)
    assert.equal(item.trashed, undefined, 'the rescue still happened')
    assert.equal(relinked, 0)
    assert.equal(refused.length, 1)
    assert.match(refused[0], /No item with id/)
  })

  it('is quiet about an item that was never in the trash', async () => {
    const { relinked, refused } = await store.restore(ricky.id)
    assert.equal(relinked, 0)
    assert.deepEqual(refused, [])
  })
})
