import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { draftToItem, fieldsFor, itemToDraft, type Item } from '../src/index.ts'

const rite = {
  name: 'The Salt Rite',
  description: 'The oldest observance of the Reach, kept at the turn of every tide.',
  foundingYear: 'first named in 604; older in the telling',
  dissolutionYear: '',
  aliases: ['the Tide Keeping'],
  tenets: 'The sea is owed what it is owed. A debt unpaid is paid by someone else.',
}

describe('the theology spec', () => {
  it('asks for the fields it was specified with, in order', () => {
    assert.deepEqual(
      fieldsFor('theology')!.map((f) => f.label),
      [
        'Name',
        'Pronunciation',
        'Demonyms',
        'Description',
        'Founding Year',
        'Dissolution Year',
        'Aliases',
        'Estimated Population/Members',
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
        'Associated Institutions',
        'Laws & Covenants',
        'Governance',
        'Legends & Mythology',
        'Origins',
        'Ethics',
        'Tenets of Faith',
        'Worship Practices',
        'Priesthood',
        'Claimed Powers',
        'Pantheon',
        'Sects',
      ],
    )
  })

  it('requires only a name', () => {
    const required = fieldsFor('theology')!
      .filter((f) => f.required)
      .map((f) => f.key)
    assert.deepEqual(required, ['name'])
  })

  it('groups the form without reordering it', () => {
    const groups = fieldsFor('theology')!.map((f) => f.group)
    assert.ok(groups.every(Boolean), 'every field is in a section, pronunciation included')
    const runs = groups.filter((g, i) => g !== groups[i - 1])
    assert.equal(new Set(runs).size, runs.length, `a group appears twice: ${runs.join(' > ')}`)
  })

  it('writes the years and the aliases to the store’s own columns', () => {
    const item = draftToItem('theology', rite)
    assert.equal(item.beginDate, 'first named in 604; older in the telling')
    assert.equal(item.endDate, undefined)
    assert.deepEqual(item.aliases, ['the Tide Keeping'])
    assert.equal('foundingYear' in item.attributes!, false)
  })

  it('always asks what must be believed and what is done about it', () => {
    // A faith article that has rolled away its tenets and its rites has not
    // said anything about a faith.
    const byKey = new Map(fieldsFor('theology')!.map((f) => [f.key, f]))
    assert.equal(byKey.get('tenets')?.fillRate, undefined)
    assert.equal(byKey.get('worship')?.fillRate, undefined)
    assert.equal(byKey.get('governance')?.fillRate, undefined)
  })

  it('treats powers, priests and gods as things a faith may not have', () => {
    // A claim is not an establishment, plenty of faiths keep no clergy, and
    // this container holds single deities and bare doctrines too.
    const byKey = new Map(fieldsFor('theology')!.map((f) => [f.key, f]))
    assert.equal(byKey.get('claimedPowers')?.fillRate, 0.4)
    assert.ok(byKey.get('priesthood')!.fillRate! < 1)
    assert.ok(byKey.get('pantheon')!.fillRate! < 1)
    assert.equal(byKey.get('dissolutionYear')?.fillRate, 0.2)
    assert.equal(byKey.get('disbandment')?.fillRate, 0.2)
  })

  it('reads it back into the form', () => {
    const stored = { ...draftToItem('theology', rite), id: 'x', tags: [] } as unknown as Item
    const draft = itemToDraft('theology', stored)
    assert.deepEqual(draft.aliases, ['the Tide Keeping'])
    assert.equal(draft.dissolutionYear, null)
    assert.match(String(draft.tenets), /^The sea is owed/)
  })
})
