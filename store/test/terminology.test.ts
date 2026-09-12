import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { draftToItem, fieldsFor, itemToDraft, type Item } from '../src/index.ts'

const muddwood = {
  name: 'muddwood',
  pronunciation: 'MUD-wood',
  meaning: 'The flooded forest between shore and heath. Also, a person slow to take a hint.',
  associatedLocations: ['the Kellish Reach'],
  associatedEthnicities: 'Kellish',
}

describe('the terminology spec', () => {
  it('asks for the fields it was specified with, in order', () => {
    assert.deepEqual(
      fieldsFor('terminology')!.map((f) => f.label),
      [
        'Name',
        'Pronunciation',
        'Meaning',
        'Associated Locations',
        'Associated Institutions',
        'Associated Ethnicities',
        'Associated Languages',
        'Associated People',
        'Associated Theology',
      ],
    )
  })

  it('requires only a name', () => {
    const required = fieldsFor('terminology')!
      .filter((f) => f.required)
      .map((f) => f.key)
    assert.deepEqual(required, ['name'])
  })

  it('makes the meaning the summary, since for a word they are the same thing', () => {
    // There is no Description here. What a brief should show when the word
    // turns up elsewhere is what the word means.
    const meaning = fieldsFor('terminology')!.find((f) => f.key === 'meaning')!
    assert.equal(meaning.storeAs, 'summary')
    const item = draftToItem('terminology', muddwood)
    assert.match(item.summary!, /^The flooded forest/)
    assert.equal('meaning' in (item.attributes ?? {}), false)
  })

  it('keeps every association a list, and none of them certain', () => {
    // A word used by dockhands in one port has no theology and no famous
    // speaker. Handed six association fields, a generator fills six.
    const associations = fieldsFor('terminology')!.filter((f) => f.label.startsWith('Associated'))
    assert.equal(associations.length, 6)
    for (const field of associations) {
      assert.equal(field.kind, 'list', field.key)
      assert.ok(field.fillRate !== undefined && field.fillRate <= 0.5, `${field.key} is not a given`)
    }
  })

  it('reads it back into the form', () => {
    const stored = { ...draftToItem('terminology', muddwood), id: 'x', tags: [] } as unknown as Item
    const draft = itemToDraft('terminology', stored)
    assert.match(String(draft.meaning), /^The flooded forest/)
    assert.deepEqual(draft.associatedEthnicities, ['Kellish'])
    assert.equal(draft.pronunciation, 'MUD-wood')
  })
})
