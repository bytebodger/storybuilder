import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { draftToItem, fieldsFor, itemToDraft, type Item } from '../src/index.ts'

const kellish = {
  name: 'Kellish',
  pronunciation: 'KELL-ish',
  relatedLocations: ['Kell', 'the Kellish Reach'],
  description: 'The majority people of Kell.',
  masculineNames: ['Halvard', 'Corr', 'Tobin'],
  feminineNames: 'Maren, Aldrica, Wenna',
  unisexNames: [],
  foods: 'Salt fish, black bread, and a great deal of vinegar.',
}

describe('the ethnicities spec', () => {
  it('asks for the fields it was specified with, in order', () => {
    assert.deepEqual(
      fieldsFor('ethnicities')!.map((f) => f.label),
      [
        'Name',
        'Pronunciation',
        'Related Locations',
        'Description',
        'Common Masculine Names',
        'Common Feminine Names',
        'Common Unisex Names',
        'Common Family Names',
        'Language(s)',
        'Culture & Heritage',
        'Shared Codes & Values',
        'Common Etiquette',
        'Traditional Styles',
        'Art & Architecture',
        'Foods & Cuisine',
        'Common Customs & Traditions',
        'Birth Rites',
        'Coming-of-Age Rites',
        'Funerary & Memorial Customs',
        'Common Taboos',
        'Shared Myths & Legends',
        'Major Historical Figures',
        'Beauty Ideals',
        'Gender Ideals',
        'Courtship Ideals',
        'Relationship Ideals',
        'Associated Institutions',
      ],
    )
  })

  it('requires only a name', () => {
    const required = fieldsFor('ethnicities')!
      .filter((f) => f.required)
      .map((f) => f.key)
    assert.deepEqual(required, ['name'])
  })

  it('groups the form without reordering it', () => {
    // Groups render in the order their first field appears, so a group that
    // came back later in the spec would drag its fields up out of place.
    const groups = fieldsFor('ethnicities')!.map((f) => f.group)
    assert.ok(groups.every(Boolean), 'every field is in a section, pronunciation included')
    const runs = groups.filter((g, i) => g !== groups[i - 1])
    assert.equal(new Set(runs).size, runs.length, `a group appears twice: ${runs.join(' > ')}`)
  })

  it('keeps names as lists, whichever way they were typed', () => {
    const item = draftToItem('ethnicities', kellish)
    assert.deepEqual(item.attributes!.masculineNames, ['Halvard', 'Corr', 'Tobin'])
    assert.deepEqual(item.attributes!.feminineNames, ['Maren', 'Aldrica', 'Wenna'])
    assert.equal('unisexNames' in item.attributes!, false, 'an empty list is not stored')
    assert.equal(item.summary, 'The majority people of Kell.')
  })

  it('reads a people recorded before the spec existed back into the form', () => {
    // Phonon's Kellish were written with a name and a summary, nothing else.
    const stored = {
      id: '3ef39b4b',
      container: 'ethnicities',
      name: 'Kellish',
      aliases: [],
      summary: 'The majority people of Kell.',
      tags: [],
    } as unknown as Item
    const draft = itemToDraft('ethnicities', stored)
    assert.equal(draft.name, 'Kellish')
    assert.equal(draft.description, 'The majority people of Kell.')
    assert.equal(draft.masculineNames, null)
  })
})
