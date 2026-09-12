import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { containersWithFields, draftToItem, fieldsFor, itemToDraft, type Item } from '../src/index.ts'
import { CONTAINER_TYPES } from '../src/containers.ts'

const watch = {
  name: 'The Low Watch',
  description: 'The bell rung over the harbour at slack water, once for each man the year took.',
  establishedOn: 'first recorded in 880; older in practice',
  endedOn: '',
  frequency: 'at every slack water of the turning tide',
  execution: 'The watchman rings once, waits the length of a held breath, and rings again.',
}

describe('the traditions spec', () => {
  it('asks for the fields it was specified with, in order', () => {
    assert.deepEqual(
      fieldsFor('traditions')!.map((f) => f.label),
      [
        'Name',
        'Pronunciation',
        'Description',
        'Established On',
        'Ended On',
        'Frequency',
        'Associated Locations',
        'Associated Institutions',
        'Associated Ethnicities',
        'Associated People',
        'Associated Theology',
        'History',
        'Execution',
        'Components and Tools',
        'Participants & Key Roles',
      ],
    )
  })

  it('requires only a name', () => {
    const required = fieldsFor('traditions')!
      .filter((f) => f.required)
      .map((f) => f.key)
    assert.deepEqual(required, ['name'])
  })

  it('always asks how often it happens and what happens', () => {
    // A tradition is a thing people do, on an occasion that comes round.
    // "An important ritual observed by many" is neither.
    const byKey = new Map(fieldsFor('traditions')!.map((f) => [f.key, f]))
    assert.equal(byKey.get('frequency')?.fillRate, undefined)
    assert.equal(byKey.get('frequency')?.kind, 'text', 'a fact to look up, not a paragraph')
    assert.equal(byKey.get('execution')?.fillRate, undefined)
  })

  it('files both dates on the store’s own columns, and fills neither often', () => {
    // Most customs were never established, and a blank end is the claim that a
    // rite is still kept.
    const item = draftToItem('traditions', watch)
    assert.equal(item.beginDate, 'first recorded in 880; older in practice')
    assert.equal(item.endDate, undefined)

    const byKey = new Map(fieldsFor('traditions')!.map((f) => [f.key, f]))
    assert.equal(byKey.get('establishedOn')?.fillRate, 0.4)
    assert.equal(byKey.get('endedOn')?.fillRate, 0.2)
  })

  it('reads it back into the form', () => {
    const stored = { ...draftToItem('traditions', watch), id: 'x', tags: [] } as unknown as Item
    const draft = itemToDraft('traditions', stored)
    assert.equal(draft.frequency, watch.frequency)
    assert.equal(draft.endedOn, null)
    assert.match(String(draft.execution), /^The watchman rings once/)
  })
})

describe('the catalog, now that every container has a spec', () => {
  it('leaves nothing without a form', () => {
    // The last one. Anything added to the catalog from here starts without a
    // spec, which is allowed - this is a statement about today, not a rule.
    const specced = new Set(containersWithFields())
    const missing = CONTAINER_TYPES.map((c) => c.key).filter((k) => !specced.has(k))
    assert.deepEqual(missing, [], `containers with no field spec: ${missing.join(', ')}`)
  })
})
