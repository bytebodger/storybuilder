import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { JsonFileStore, referencesTo, type Item, type Store } from '../../store/src/index.ts'
import { screenCandidates } from '../src/stubs.ts'

/**
 * The bridge's half of the trash: what the console is told before it deletes,
 * and the one question that still counts a trashed article as existing.
 */
let dir: string
let store: Store
let ricky: Item

before(async () => {
  dir = await mkdtemp(join(tmpdir(), 'sb-bridge-trash-'))
  store = await JsonFileStore.create(join(dir, 'u'), { id: 'u', name: 'U' })
  ricky = await store.add({ container: 'people', name: 'Ricky Rocket' })
  const crew = await store.add({ container: 'institutions', name: 'The Rocket Crew' })
  await store.add({
    container: 'locations',
    name: 'Dol',
    summary: 'Ricky Rocket sailed out of here.',
  })
  await store.link(ricky.id, crew.id)
})
after(async () => rm(dir, { recursive: true, force: true }))

describe('what the author is told before deleting', () => {
  it('separates what would be cut from what would be left alone', async () => {
    const { linked, mentioned } = referencesTo(ricky, await store.list())
    assert.deepEqual(linked.map((i) => i.name), ['The Rocket Crew'])
    assert.deepEqual(mentioned.map((i) => i.name), ['Dol'])
  })
})

describe('a name in the trash is still a name the author has written', () => {
  it('is not proposed as a stub to create', async () => {
    // The console would otherwise offer to create what was just thrown away,
    // every time the name appeared in something new.
    await store.trash(ricky.id)

    const live = await store.list()
    const withTrash = [...live, ...(await store.trashed())]
    const proposal = [{ term: 'Ricky Rocket', container: 'people' }]

    assert.equal(screenCandidates(proposal, withTrash).candidates.length, 0)
    assert.equal(screenCandidates(proposal, withTrash).alreadyKnown[0].matched, 'Ricky Rocket')
    // And against the world alone - what every other read sees - he is gone.
    assert.equal(screenCandidates(proposal, live).candidates.length, 1)
  })

  it('is proposed again once he is gone for good', async () => {
    await store.restore(ricky.id)
    await store.remove(ricky.id)
    const pool = [...(await store.list()), ...(await store.trashed())]
    assert.equal(screenCandidates([{ term: 'Ricky Rocket', container: 'people' }], pool).candidates.length, 1)
  })
})
