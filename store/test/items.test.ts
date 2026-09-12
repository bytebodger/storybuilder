import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { draftToItem, fieldsFor, itemToDraft, type Item } from '../src/index.ts'
import { CONTAINER_TYPES } from '../src/containers.ts'

const beam = {
  name: 'The Weighers’ Beam',
  description: 'The great scale beam of Kell, against which every other measure is set.',
  createdOn: 'Year 604',
  destroyedOn: '',
  dimensions: '4 metres, end to end',
  history: 'Cast for the guild, seized twice, and once thrown in the harbour by a mob.',
}

describe('the items container', () => {
  it('is in the catalog, for the one there is only one of', () => {
    // A kind of thing everybody owns is a word and belongs in terminology.
    const items = CONTAINER_TYPES.find((c) => c.key === 'items')!
    assert.equal(items.singular, 'item')
    assert.match(items.description, /Terminology/)
  })

  it('asks for the fields it was specified with, in order', () => {
    assert.deepEqual(
      fieldsFor('items')!.map((f) => f.label),
      [
        'Name',
        'Pronunciation',
        'Description',
        'Created On',
        'Destroyed On',
        'Associated Locations',
        'Associated Institutions',
        'Associated Ethnicities',
        'Associated People',
        'Associated Theology',
        'Dimensions',
        'Weight',
        'History',
        'Mechanics & Inner Workings',
        'Manufacturing Process',
        'Significance',
      ],
    )
  })

  it('requires only a name', () => {
    const required = fieldsFor('items')!
      .filter((f) => f.required)
      .map((f) => f.key)
    assert.deepEqual(required, ['name'])
  })

  it('always asks what happened to it and why anyone cares', () => {
    // History and Significance are what an object has that a kind of object
    // does not. A sword with dimensions and no story is a line in an inventory.
    const byKey = new Map(fieldsFor('items')!.map((f) => [f.key, f]))
    assert.equal(byKey.get('history')?.fillRate, undefined)
    assert.equal(byKey.get('significance')?.fillRate, undefined)
    assert.equal(byKey.get('dimensions')?.fillRate, undefined)
  })

  it('keeps it in existence unless somebody says otherwise', () => {
    // A blank Destroyed On is the claim that the thing is still out there.
    const byKey = new Map(fieldsFor('items')!.map((f) => [f.key, f]))
    assert.equal(byKey.get('destroyedOn')?.fillRate, 0.2)
    assert.equal(byKey.get('createdOn')?.fillRate, 0.5)

    const item = draftToItem('items', beam)
    assert.equal(item.beginDate, 'Year 604')
    assert.equal(item.endDate, undefined)
  })

  it('reads it back into the form', () => {
    const stored = { ...draftToItem('items', beam), id: 'x', tags: [] } as unknown as Item
    const draft = itemToDraft('items', stored)
    assert.equal(draft.createdOn, 'Year 604')
    assert.equal(draft.destroyedOn, null)
    assert.equal(draft.dimensions, '4 metres, end to end')
  })
})
