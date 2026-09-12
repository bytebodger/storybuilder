import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { draftToItem, fieldsFor, itemToDraft, type Item } from '../src/index.ts'

const bell = {
  name: 'The Drowned Bell',
  description: 'The best known of the Reach’s wreck stories, and the one the Weighers dislike.',
  yearRecorded: 'first attested Year 604',
  yearSet: 'before the first harbour',
  synopsis: 'A bell is cast for a chapel, lost with the ship carrying it, and heard before storms.',
  associatedGeography: ['The Sunder'],
}

describe('the legends spec', () => {
  it('asks for the fields it was specified with, in order', () => {
    assert.deepEqual(
      fieldsFor('legends')!.map((f) => f.label),
      [
        'Name',
        'Pronunciation',
        'Description',
        'Year of Recording',
        'Year of Setting',
        'Associated Documents',
        'Associated Ethnicities',
        'Associated Locations',
        'Associated Geography',
        'Associated People',
        'Associated Institutions',
        'Summary',
        'Historical Basis',
        'Spread / Apocrypha',
        'Variations',
        'Cultural Impact',
        'Literary Impact',
        'Artistic Impact',
      ],
    )
  })

  it('requires only a name', () => {
    const required = fieldsFor('legends')!
      .filter((f) => f.required)
      .map((f) => f.key)
    assert.deepEqual(required, ['name'])
  })

  it('keeps the article about the legend apart from the legend', () => {
    // Description is the article's own voice and is the item's summary, shown
    // wherever the legend is mentioned. Summary is the story retold, and is an
    // ordinary attribute under a key of its own.
    const item = draftToItem('legends', bell)
    assert.match(item.summary!, /^The best known/)
    assert.match(String(item.attributes!.synopsis), /^A bell is cast/)
    assert.equal('description' in item.attributes!, false)
    assert.equal(fieldsFor('legends')!.find((f) => f.key === 'synopsis')!.label, 'Summary')
  })

  it('files the year it was recorded, not the year it claims', () => {
    // A legend enters the record when someone writes it down. The year it says
    // it happened is a claim the legend makes, not a date the store can trust.
    const item = draftToItem('legends', bell)
    assert.equal(item.beginDate, 'first attested Year 604')
    assert.equal(item.attributes!.yearSet, 'before the first harbour')
    assert.equal(item.endDate, undefined)
  })

  it('leaves most legends undated', () => {
    // Most have no demonstrable year of composition and no year they claim.
    // Handed either field, a generator supplies one.
    const byKey = new Map(fieldsFor('legends')!.map((f) => [f.key, f]))
    assert.ok(byKey.get('yearRecorded')!.fillRate! <= 0.3)
    assert.ok(byKey.get('yearSet')!.fillRate! <= 0.3)
  })

  it('makes every association a list, so each name links itself', () => {
    const associations = fieldsFor('legends')!.filter((f) => f.label.startsWith('Associated'))
    assert.equal(associations.length, 6)
    for (const field of associations) assert.equal(field.kind, 'list', field.key)
  })

  it('reads it back into the form', () => {
    const stored = { ...draftToItem('legends', bell), id: 'x', tags: [] } as unknown as Item
    const draft = itemToDraft('legends', stored)
    assert.equal(draft.description, bell.description)
    assert.equal(draft.synopsis, bell.synopsis)
    assert.equal(draft.yearRecorded, 'first attested Year 604')
  })
})
