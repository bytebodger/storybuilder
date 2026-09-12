import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { draftToItem, fieldsFor, itemToDraft, type Item } from '../src/index.ts'

const tide = {
  name: 'The Green Tide',
  description: 'Water off the Reach turns green for a night, and the fish will not take a hook.',
  firstObserved: 'Year 88',
  frequency: 'every seventeenth summer',
  source: 'Unknown. The Weighers blame the salt pans; the fishers blame the Sunder.',
  associatedLocations: ['Kell', 'the Kellish Reach'],
}

describe('the phenomena spec', () => {
  it('asks for the fields it was specified with, in order', () => {
    assert.deepEqual(
      fieldsFor('phenomena')!.map((f) => f.label),
      [
        'Name',
        'Pronunciation',
        'Description',
        'First Observed',
        'Frequency',
        'Source',
        'Manifestation / Visualization',
        'Associated Location(s)',
        'Associated Legend(s)',
        'History',
        'Societal Impact',
      ],
    )
  })

  it('requires only a name', () => {
    const required = fieldsFor('phenomena')!
      .filter((f) => f.required)
      .map((f) => f.key)
    assert.deepEqual(required, ['name'])
  })

  it('always asks how often it happens', () => {
    // A phenomenon without a frequency is a rumour. "Every seventeenth summer"
    // is something a character can plan around; "occasionally" is not.
    const byKey = new Map(fieldsFor('phenomena')!.map((f) => [f.key, f]))
    assert.equal(byKey.get('frequency')?.fillRate, undefined)
    assert.equal(byKey.get('frequency')?.kind, 'text', 'a fact to look up, not a paragraph')
    assert.equal(byKey.get('source')?.fillRate, undefined)
    assert.equal(byKey.get('manifestation')?.fillRate, undefined)
  })

  it('files the first sighting as the begin date', () => {
    const item = draftToItem('phenomena', tide)
    assert.equal(item.beginDate, 'Year 88')
    assert.equal('firstObserved' in item.attributes!, false)
    assert.match(item.summary!, /^Water off the Reach/)
    assert.deepEqual(item.attributes!.associatedLocations, ['Kell', 'the Kellish Reach'])
  })

  it('leaves the first sighting off half of them', () => {
    // Plenty of phenomena have always been there as far as anyone knows.
    const rate = fieldsFor('phenomena')!.find((f) => f.key === 'firstObserved')!.fillRate
    assert.ok(rate !== undefined && rate <= 0.5)
  })

  it('reads it back into the form', () => {
    const stored = { ...draftToItem('phenomena', tide), id: 'x', tags: [] } as unknown as Item
    const draft = itemToDraft('phenomena', stored)
    assert.equal(draft.firstObserved, 'Year 88')
    assert.equal(draft.frequency, 'every seventeenth summer')
    assert.equal(draft.description, tide.description)
  })
})
