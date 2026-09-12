import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { draftToItem, fieldsFor, itemToDraft, type Item } from '../src/index.ts'

const salt = {
  name: 'The Salt Road',
  description: 'The cart road from the pans to the quay, and the reason Kell can sell at all.',
  establishedOn: 'Year 604, by decree',
  locations: ['Kell', 'the Kellish Reach'],
  navigability: 'Impassable for a fortnight after the spring rains. Three tolls, one of them lawful.',
}

describe('the roads spec', () => {
  it('asks for the fields it was specified with, in order', () => {
    assert.deepEqual(
      fieldsFor('roads')!.map((f) => f.label),
      [
        'Name',
        'Pronunciation',
        'Description',
        'Established On',
        'Location(s)',
        'Purpose / Function',
        'Commercial Impact',
        'Cultural Impact',
        'Political Impact',
        'Navigability',
        'History',
        'Traffic',
      ],
    )
  })

  it('requires only a name', () => {
    const required = fieldsFor('roads')!
      .filter((f) => f.required)
      .map((f) => f.key)
    assert.deepEqual(required, ['name'])
  })

  it('always asks what goes wrong on it', () => {
    // A road that is only a line between two places is a line on a map. The
    // washout, the toll and the miles the watch will not ride are the article.
    const byKey = new Map(fieldsFor('roads')!.map((f) => [f.key, f]))
    assert.equal(byKey.get('navigability')?.fillRate, undefined)
    assert.equal(byKey.get('traffic')?.fillRate, undefined)
    assert.equal(byKey.get('purpose')?.fillRate, undefined)
  })

  it('leaves most ways unestablished', () => {
    // Most were never built - they were walked until they were a road - and a
    // generator handed the field invents a founding year for a goat track.
    const established = fieldsFor('roads')!.find((f) => f.key === 'establishedOn')!
    assert.ok(established.fillRate !== undefined && established.fillRate <= 0.4)
    assert.equal(established.storeAs, 'beginDate')
  })

  it('stores the description as the summary and the year as the begin date', () => {
    const item = draftToItem('roads', salt)
    assert.match(item.summary!, /^The cart road/)
    assert.equal(item.beginDate, 'Year 604, by decree')
    assert.deepEqual(item.attributes!.locations, ['Kell', 'the Kellish Reach'])
    assert.equal('description' in item.attributes!, false)
  })

  it('reads it back into the form', () => {
    const stored = { ...draftToItem('roads', salt), id: 'x', tags: [] } as unknown as Item
    const draft = itemToDraft('roads', stored)
    assert.equal(draft.establishedOn, 'Year 604, by decree')
    assert.match(String(draft.navigability), /^Impassable/)
  })
})
