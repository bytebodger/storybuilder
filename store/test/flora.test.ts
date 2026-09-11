import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { draftToItem, fieldsFor, itemToDraft, type Item } from '../src/index.ts'

const nettle = {
  name: 'Witch’s Bane Nettle',
  averageHeight: 'knee-high',
  averageWidth: '',
  colorings: 'grey-green leaves, white flowers',
  description: 'A stinging nettle of the western bogs, burned at thresholds to keep out ill luck.',
  uses: 'Burned green at thresholds. Steeped, it eases a cough; boiled too long, it stops a heart.',
}

describe('the flora spec', () => {
  it('asks for the fields it was specified with, in order', () => {
    assert.deepEqual(
      fieldsFor('flora')!.map((f) => f.label),
      [
        'Name',
        'Pronunciation',
        'Conservation Status',
        'Scientific Name',
        'Lifespan',
        'Average Height',
        'Average Width',
        'Colorings',
        'Geographic Origin and Distribution',
        'Description',
        'Anatomy',
        'Reproduction',
        'Growth Rates & Stages',
        'Habitats',
        'Domestication',
        'Uses, Products & Exploitation',
        'Symbiotic and Parasitic Organisms',
        'History',
      ],
    )
  })

  it('requires only a name', () => {
    const required = fieldsFor('flora')!
      .filter((f) => f.required)
      .map((f) => f.key)
    assert.deepEqual(required, ['name'])
  })

  it('keeps the short reference facts as text, not prose', () => {
    // Looked up, not read - the same split fauna makes.
    const byKey = new Map(fieldsFor('flora')!.map((f) => [f.key, f]))
    for (const key of ['conservationStatus', 'scientificName', 'lifespan', 'averageHeight',
      'averageWidth', 'colorings']) {
      assert.equal(byKey.get(key)?.kind, 'text', `${key} is a short field`)
    }
  })

  it('stores the description as the summary, wherever it sits in the form', () => {
    const item = draftToItem('flora', nettle)
    assert.match(item.summary!, /^A stinging nettle/)
    assert.equal('description' in item.attributes!, false)
    assert.equal(item.attributes!.colorings, 'grey-green leaves, white flowers')
    assert.equal('averageWidth' in item.attributes!, false, 'a blank is not stored')
  })

  it('reads it back into the form', () => {
    const stored = { ...draftToItem('flora', nettle), id: 'x', tags: [] } as unknown as Item
    const draft = itemToDraft('flora', stored)
    assert.equal(draft.description, nettle.description)
    assert.equal(draft.averageHeight, 'knee-high')
  })
})
