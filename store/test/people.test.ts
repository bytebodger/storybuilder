import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { draftToItem, draftToPatch, itemToDraft, fieldsFor } from '../src/index.ts'
import type { Item } from '../src/index.ts'

const aldric = {
  honorific: 'Queen',
  givenName: 'Aldrica',
  middleName: 'Corvane',
  familyName: 'Vane',
  suffix: 'III',
  nicknames: ['the Ashkeeper', 'Red Aldrica'],
  overview: 'Held the Reach for nineteen years and lost it in an afternoon.',
  birthYear: '412',
  deathYear: '478',
  motivations: 'To be the last of her line who has to apologise for it.',
}

describe('the people spec', () => {
  it('covers every field the spec asks for', () => {
    const spec = fieldsFor('people')!
    assert.equal(spec.length, 58)
    assert.equal(spec.filter((f) => f.required).map((f) => f.key).join(), 'givenName,overview')
  })

  it('puts the pronunciation beside the name, not after the last name part', () => {
    // The common field is anchored on the name rather than on a key called
    // "name", which people does not have. It lands after Suffix - the last
    // field that makes up the name - and joins that section.
    const spec = fieldsFor('people')!
    const keys = spec.map((f) => f.key)
    assert.equal(keys[keys.indexOf('suffix') + 1], 'pronunciation')
    assert.equal(spec.find((f) => f.key === 'pronunciation')!.group, 'Name')
  })

  it('groups the form in runs, without reordering the spec', () => {
    const spec = fieldsFor('people')!
    const seen: string[] = []
    for (const f of spec) {
      const group = f.group ?? ''
      if (seen[seen.length - 1] !== group) seen.push(group)
    }
    // Every group is one unbroken run: a group that appeared twice would mean
    // the sections had pulled fields out of the order the spec declared.
    assert.equal(new Set(seen).size, seen.length, `groups interleave: ${seen.join(' | ')}`)
  })
})

describe('a name that arrives in parts', () => {
  it('joins the parts into the name the article is titled with', () => {
    assert.equal(draftToItem('people', aldric).name, 'Aldrica Corvane Vane III')
  })

  it('leaves out the honorific, so a mention of the bare name still finds them', () => {
    const item = draftToItem('people', aldric)
    assert.ok(!item.name.includes('Queen'))
    assert.equal(item.attributes!.honorific, 'Queen')
  })

  it('skips the parts that are blank', () => {
    assert.equal(draftToItem('people', { givenName: 'Corr', overview: 'A ferryman.' }).name, 'Corr')
  })

  it('keeps the parts as well, so the form can offer them back separately', () => {
    const item = draftToItem('people', aldric)
    const stored = { ...item, id: 'x', tags: [] } as unknown as Item
    const values = itemToDraft('people', stored)

    assert.equal(values.givenName, 'Aldrica')
    assert.equal(values.middleName, 'Corvane')
    assert.equal(values.familyName, 'Vane')
    assert.equal(values.suffix, 'III')
  })

  it('does not touch a container whose name is one field', () => {
    const item = draftToItem('fauna', { name: 'Bottonfly', description: 'A fly.' })
    assert.equal(item.name, 'Bottonfly')
    assert.equal(item.attributes?.name, undefined)
  })
})

describe('nicknames are the item’s aliases', () => {
  it('stores them where everything that matches a term already looks', () => {
    assert.deepEqual(draftToItem('people', aldric).aliases, ['the Ashkeeper', 'Red Aldrica'])
  })

  it('reads them back into the form', () => {
    const stored = { ...draftToItem('people', aldric), id: 'x', tags: [] } as unknown as Item
    assert.deepEqual(itemToDraft('people', stored).nicknames, ['the Ashkeeper', 'Red Aldrica'])
  })

  it('carries them through an update, so removing one takes effect', () => {
    const patch = draftToPatch('people', { ...aldric, nicknames: [] })
    assert.ok('aliases' in patch)
    assert.equal(patch.aliases, undefined)
  })
})

describe('when a person lived', () => {
  it('maps the birth and death years onto the store’s date columns', () => {
    const item = draftToItem('people', aldric)
    assert.equal(item.beginDate, '412')
    assert.equal(item.endDate, '478')
    assert.equal(item.attributes?.birthYear, undefined)
  })

  it('leaves the end date unset for someone still alive', () => {
    const item = draftToItem('people', { ...aldric, deathYear: null })
    assert.equal(item.endDate, undefined)
  })

  it('keeps the day out of the columns, since only the year is comparable', () => {
    const item = draftToItem('people', { ...aldric, birthDay: '4th of Hallowing' })
    assert.equal(item.beginDate, '412')
    assert.equal(item.attributes!.birthDay, '4th of Hallowing')
  })
})
