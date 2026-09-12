import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { JsonFileStore, matchTerm, type Item, type Store } from '../src/index.ts'

/**
 * The one question a trashed article still answers yes to.
 *
 * `sb resolve` and `stub-forge` both ask whether the author has already written
 * a name down. A name in the trash is one they have - answering "new" would
 * invite a second article for the same thing, and offer to create the very
 * thing they threw away.
 */
let dir: string
let store: Store
let ricky: Item

before(async () => {
  dir = await mkdtemp(join(tmpdir(), 'sb-resolve-trash-'))
  store = await JsonFileStore.create(join(dir, 'u'), { id: 'u', name: 'U' })
  ricky = await store.add({ container: 'people', name: 'Ricky Rocket' })
})
after(async () => rm(dir, { recursive: true, force: true }))

describe('resolving a name that is in the trash', () => {
  it('is not found in the world', async () => {
    await store.trash(ricky.id)
    assert.deepEqual(matchTerm('Ricky Rocket', await store.list()), [])
  })

  it('is found when the trash is searched with it', async () => {
    const pool = [...(await store.list()), ...(await store.trashed())]
    const [hit] = matchTerm('Ricky Rocket', pool)
    assert.equal(hit.item.id, ricky.id)
    assert.equal(hit.via, 'name')
  })

  it('is found through an inflection, like anything else', async () => {
    // The normaliser does not care where an item is filed.
    const pool = [...(await store.list()), ...(await store.trashed())]
    assert.equal(matchTerm('the Ricky Rockets', pool).length, 1)
  })

  it('is new again once it is gone for good', async () => {
    await store.restore(ricky.id)
    await store.remove(ricky.id)
    const pool = [...(await store.list()), ...(await store.trashed())]
    assert.deepEqual(matchTerm('Ricky Rocket', pool), [])
  })
})
