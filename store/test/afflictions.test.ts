import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { draftToItem, fieldsFor, itemToDraft, type Item } from '../src/index.ts'

const saltlung = {
  name: 'Saltlung',
  pronunciation: 'SAWLT-lung',
  description: 'A wasting cough of the salt pans, blamed on the air and caused by the brine.',
  cause: 'Believed to be bad air off the flats. In fact, years of breathing brine dust.',
  hostsAndCarriers: '',
}

describe('the afflictions spec', () => {
  it('asks for the fields it was specified with, in order', () => {
    // Pronunciation is folded in from the common set, beside the name.
    assert.deepEqual(
      fieldsFor('afflictions')!.map((f) => f.label),
      [
        'Name',
        'Pronunciation',
        'Description',
        'Transmission/Vectors',
        'Cause',
        'Symptoms',
        'Treatment',
        'Prognosis',
        'Affected Groups',
        'Hosts and Carriers',
        'Prevention',
        'Epidemiology',
        'History',
        'Cultural Impact',
      ],
    )
  })

  it('requires only a name', () => {
    const required = fieldsFor('afflictions')!
      .filter((f) => f.required)
      .map((f) => f.key)
    assert.deepEqual(required, ['name'])
  })

  it('leaves the spine of an article alone', () => {
    // Whatever rolls away, an affliction still says what it does and how it ends.
    const byKey = new Map(fieldsFor('afflictions')!.map((f) => [f.key, f]))
    for (const key of ['description', 'cause', 'symptoms', 'treatment', 'prognosis']) {
      assert.equal(byKey.get(key)?.fillRate, undefined, `${key} is not optional decoration`)
    }
  })

  it('does not spread everything', () => {
    // A disorder that arises on its own has no vectors, and a model handed the
    // field would give it some.
    const transmission = fieldsFor('afflictions')!.find((f) => f.key === 'transmission')!
    assert.ok(transmission.fillRate !== undefined && transmission.fillRate < 1)
  })

  it('stores the description as the summary and everything else as attributes', () => {
    const item = draftToItem('afflictions', saltlung)
    assert.equal(item.name, 'Saltlung')
    assert.match(item.summary!, /^A wasting cough/)
    assert.match(String(item.attributes!.cause), /brine dust/)
    assert.equal('description' in item.attributes!, false)
    assert.equal('hostsAndCarriers' in item.attributes!, false, 'a blank is not stored')
  })

  it('reads it back into the form', () => {
    const stored = { ...draftToItem('afflictions', saltlung), id: 'x', tags: [] } as unknown as Item
    const draft = itemToDraft('afflictions', stored)
    assert.equal(draft.description, saltlung.description)
    assert.equal(draft.pronunciation, 'SAWLT-lung')
  })
})
