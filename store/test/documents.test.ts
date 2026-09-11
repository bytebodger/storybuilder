import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { draftToItem, eventsIn, fieldsFor, itemToDraft, type Item } from '../src/index.ts'

const charter = {
  name: 'The Salt Charter',
  description: 'The grant that gave the pan-workers of the Reach their own weights.',
  authors: ['Aldrica Vane', 'the Guild of Weighers'],
  originalDate: 'Written 412',
  location: 'Written at the customs house',
  legalImpact: '',
  term: 'ninety-nine years',
}

describe('the documents spec', () => {
  it('asks for the fields it was specified with, in order', () => {
    // Pronunciation is folded in from the common set, beside the name.
    assert.deepEqual(
      fieldsFor('documents')!.map((f) => f.label),
      [
        'Name',
        'Pronunciation',
        'Description',
        'Author(s)',
        'Original Date',
        'Location',
        'Related Documents',
        'Purpose',
        'Key Passages',
        'Cultural Impact',
        'Legal Impact',
        'Background',
        'History',
        'Public Reception',
        'Legacy',
        'Term',
      ],
    )
  })

  it('requires only a name', () => {
    const required = fieldsFor('documents')!
      .filter((f) => f.required)
      .map((f) => f.key)
    assert.deepEqual(required, ['name'])
  })

  it('stores the original date as the begin date', () => {
    const item = draftToItem('documents', charter)
    assert.equal(item.beginDate, 'Written 412')
    assert.equal('originalDate' in item.attributes!, false)
    assert.deepEqual(item.attributes!.authors, ['Aldrica Vane', 'the Guild of Weighers'])
    assert.equal(item.attributes!.term, 'ninety-nine years')
    assert.equal('legalImpact' in item.attributes!, false, 'a blank is not stored')
  })

  it('keeps a dated document out of the chronology', () => {
    // A begin date only places an item when it is filed under a timeline, and
    // a document is not. Its year is recorded without becoming an event.
    assert.equal(eventsIn([draftToItem('documents', charter)]).length, 0)
  })

  it('does not give everything an author or the force of law', () => {
    const byKey = new Map(fieldsFor('documents')!.map((f) => [f.key, f]))
    for (const key of ['authors', 'legalImpact', 'term']) {
      const rate = byKey.get(key)?.fillRate
      assert.ok(rate !== undefined && rate < 1, `${key} is not something every document has`)
    }
  })

  it('reads it back into the form', () => {
    const stored = { ...draftToItem('documents', charter), id: 'x', tags: [] } as unknown as Item
    const draft = itemToDraft('documents', stored)
    assert.equal(draft.originalDate, 'Written 412')
    assert.deepEqual(draft.authors, charter.authors)
  })
})
