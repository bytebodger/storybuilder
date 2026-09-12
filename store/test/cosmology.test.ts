import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { draftToItem, fieldsFor, itemToDraft, type Item } from '../src/index.ts'

const wanderer = {
  name: 'The Long Wanderer',
  description: 'A comet that returns every ninety-one years.',
  alternativeNames: ['the Tailed Lamp', 'Ossa'],
  type: 'comet',
  knownCycles: 'Returns every ninety-one years. Its last passage went unrecorded.',
}

describe('the cosmology spec', () => {
  it('asks for the fields it was specified with, in order', () => {
    // Pronunciation is folded in from the common set, beside the name.
    assert.deepEqual(
      fieldsFor('cosmology')!.map((f) => f.label),
      [
        'Name',
        'Pronunciation',
        'Demonyms',
        'Description',
        'Alternative Name(s)',
        'Type',
        'Distinctive Features',
        'Associated Legends',
        'Localized Impact',
        'Known Cycles',
        'History',
      ],
    )
  })

  it('requires only a name', () => {
    const required = fieldsFor('cosmology')!
      .filter((f) => f.required)
      .map((f) => f.key)
    assert.deepEqual(required, ['name'])
  })

  it('stores the type as the kind and the other names as aliases', () => {
    // Columns, not attributes: closure counts by kind, and linking finds aliases.
    const item = draftToItem('cosmology', wanderer)
    assert.equal(item.kind, 'comet')
    assert.deepEqual(item.aliases, ['the Tailed Lamp', 'Ossa'])
    assert.equal('type' in item.attributes!, false)
    assert.equal('alternativeNames' in item.attributes!, false)
    assert.match(String(item.attributes!.knownCycles), /ninety-one/)
  })

  it('lowercases the type, so a Moon counts against the moons', () => {
    // Phonon's moons are closed at two, keyed "moon". A third typed as "Moon"
    // would otherwise be a set of one that nothing had closed.
    assert.equal(draftToItem('cosmology', { name: 'Third', type: ' Moon ' }).kind, 'moon')
  })

  it('reads a body recorded before the spec existed back into the form', () => {
    // Phonon's moons were written with a kind and no attributes at all.
    const verrin = {
      id: '81730339',
      container: 'cosmology',
      name: 'Verrin',
      kind: 'moon',
      aliases: [],
      summary: 'The larger moon. Its months set the Kellish calendar.',
      tags: [],
    } as unknown as Item
    const draft = itemToDraft('cosmology', verrin)
    assert.equal(draft.type, 'moon')
    assert.deepEqual(draft.alternativeNames, [])
    assert.match(String(draft.description), /Kellish calendar/)
  })
})
