import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { draftToItem, fieldsFor, itemToDraft, type Item } from '../src/index.ts'

const stair = {
  name: 'The Weeping Stair',
  pronunciation: '',
  description: 'A fall of seven steps on the Greyfell, loud enough to be heard from the pass.',
  parentGeography: 'The Greyfell Range',
  parentLocation: 'Westlandia',
  geography: 'Seven ledges over about two hundred metres, cut into grey stone.',
}

describe('the geography spec', () => {
  it('asks for the fields it was specified with, in order', () => {
    assert.deepEqual(
      fieldsFor('geography')!.map((f) => f.label),
      [
        'Name',
        'Pronunciation',
        'Description',
        'Parent Geography',
        'Parent Location',
        'Geography',
        'Localized Phenomena',
        'Climate',
        'Flora & Fauna',
        'Natural Resources',
        'History',
        'Tourism',
        'Ethnic Significance',
        'Religious Significance',
      ],
    )
  })

  it('requires only a name', () => {
    const required = fieldsFor('geography')!
      .filter((f) => f.required)
      .map((f) => f.key)
    assert.deepEqual(required, ['name'])
  })

  it('keeps both parents as short fields, since each is one name', () => {
    // A feature sits inside a larger feature and inside a place, and those are
    // different questions with different answers.
    const byKey = new Map(fieldsFor('geography')!.map((f) => [f.key, f]))
    for (const key of ['parentGeography', 'parentLocation']) {
      assert.equal(byKey.get(key)?.kind, 'text', key)
      assert.equal(byKey.get(key)?.required, false, key)
    }
  })

  it('does not give every hill a flood and a pilgrimage', () => {
    // Every feature has a shape; few have portents.
    const byKey = new Map(fieldsFor('geography')!.map((f) => [f.key, f]))
    for (const key of ['localizedPhenomena', 'tourism', 'religiousSignificance']) {
      const rate = byKey.get(key)?.fillRate
      assert.ok(rate !== undefined && rate <= 0.5, `${key} should be the exception`)
    }
    assert.equal(byKey.get('geography')?.fillRate, undefined, 'the shape of it is always written')
  })

  it('stores the description as the summary and the rest as attributes', () => {
    const item = draftToItem('geography', stair)
    assert.match(item.summary!, /^A fall of seven steps/)
    assert.equal(item.attributes!.parentGeography, 'The Greyfell Range')
    assert.equal(item.attributes!.parentLocation, 'Westlandia')
    assert.equal('description' in item.attributes!, false)
    assert.equal('pronunciation' in item.attributes!, false, 'a blank is not stored')
  })

  it('reads it back into the form', () => {
    const stored = { ...draftToItem('geography', stair), id: 'x', tags: [] } as unknown as Item
    const draft = itemToDraft('geography', stored)
    assert.equal(draft.description, stair.description)
    assert.equal(draft.parentGeography, 'The Greyfell Range')
  })
})
