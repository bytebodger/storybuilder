import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { draftToItem, fieldsFor, itemToDraft, type Item } from '../src/index.ts'

const weighers = {
  name: 'The Guild of Weighers',
  description: 'Keepers of the salt measures of the Reach, and of the quarrel over them.',
  foundingYear: 'Year 412',
  dissolutionYear: '',
  aliases: ['the Scale', 'the Weighers'],
  members: 'about 400 sworn',
  commercialActivities: 'Every cargo of salt leaving the Reach is weighed, and paid for, by them.',
}

describe('the institutions spec', () => {
  it('asks for the fields it was specified with, in order', () => {
    assert.deepEqual(
      fieldsFor('institutions')!.map((f) => f.label),
      [
        'Name',
        'Pronunciation',
        'Demonyms',
        'Description',
        'Founding Year',
        'Dissolution Year',
        'Aliases',
        'Estimated Population/Members',
        'Predecessor Institutions',
        'Successor Institutions',
        'Parent Institution',
        'Founders',
        'Structure',
        'Culture',
        'Public Agenda',
        'Assets',
        'History',
        'Disbandment',
        'Owned/Controlled Locations',
        'Associated Locations',
        'Associated Ethnicities',
        'Military Activities',
        'Technological Activities',
        'Religious Activities',
        'Diplomatic Activities',
        'Commercial Activities',
        'Educational Activities',
        'Laws & Covenants',
        'Governance',
        'Legends & Mythology',
        'Origins',
        'Ethics',
        'Sects',
      ],
    )
  })

  it('requires only a name', () => {
    const required = fieldsFor('institutions')!
      .filter((f) => f.required)
      .map((f) => f.key)
    assert.deepEqual(required, ['name'])
  })

  it('groups the form without reordering it', () => {
    const groups = fieldsFor('institutions')!.map((f) => f.group)
    assert.ok(groups.every(Boolean), 'every field is in a section, pronunciation included')
    const runs = groups.filter((g, i) => g !== groups[i - 1])
    assert.equal(new Set(runs).size, runs.length, `a group appears twice: ${runs.join(' > ')}`)
  })

  it('writes the years and the aliases to the store’s own columns', () => {
    // So a brief can say how old a body is, and whether it still stands,
    // without knowing anything about this spec.
    const item = draftToItem('institutions', weighers)
    assert.equal(item.beginDate, 'Year 412')
    assert.equal(item.endDate, undefined)
    assert.deepEqual(item.aliases, ['the Scale', 'the Weighers'])
    assert.equal('foundingYear' in item.attributes!, false)
    assert.equal('aliases' in item.attributes!, false)
    assert.equal(item.attributes!.members, 'about 400 sworn')
  })

  it('does not make every institution a small state', () => {
    // A guild trades, teaches its apprentices, and has no army and no envoys.
    // Handed six activity fields, a model writes six.
    const byKey = new Map(fieldsFor('institutions')!.map((f) => [f.key, f]))
    for (const key of ['militaryActivities', 'technologicalActivities', 'religiousActivities',
      'diplomaticActivities', 'commercialActivities', 'educationalActivities']) {
      const rate = byKey.get(key)?.fillRate
      assert.ok(rate !== undefined && rate <= 0.45, `${key} should be the exception`)
    }
  })

  it('keeps a dissolved institution rare, and its disbandment with it', () => {
    // A blank Dissolution Year is the claim that it still stands.
    const byKey = new Map(fieldsFor('institutions')!.map((f) => [f.key, f]))
    assert.equal(byKey.get('dissolutionYear')?.fillRate, 0.2)
    assert.equal(byKey.get('disbandment')?.fillRate, 0.2)
  })

  it('reads it back into the form', () => {
    const stored = { ...draftToItem('institutions', weighers), id: 'x', tags: [] } as unknown as Item
    const draft = itemToDraft('institutions', stored)
    assert.equal(draft.foundingYear, 'Year 412')
    assert.deepEqual(draft.aliases, ['the Scale', 'the Weighers'])
    assert.equal(draft.dissolutionYear, null)
  })
})
