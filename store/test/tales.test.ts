import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { defaultValues, draftToItem, fieldsFor, itemToDraft, type Item } from '../src/index.ts'

const chapter = {
  name: 'The Quay at Night',
  standalone: false,
  parentTale: 'The Chronicles of Finrock',
  previousTale: 'The Salt Bride',
  story: 'The bell sounded twice before anyone thought to count.',
}

describe('the tales spec', () => {
  it('asks for the fields it was specified with, in order', () => {
    assert.deepEqual(
      fieldsFor('tales')!.map((f) => f.label),
      [
        'Title',
        'Pronunciation',
        'Standalone?',
        'Parent Tale Container',
        'Previous Tale (Chapter)',
        'Next Tale (Chapter)',
        'Story',
      ],
    )
  })

  it('calls it a Title and stores it as the name', () => {
    // Nobody asks what a story is called by asking its name. Everything that
    // finds or titles an article still reads the item's name column.
    const title = fieldsFor('tales')!.find((f) => f.storeAs === 'name')!
    assert.equal(title.label, 'Title')
    assert.equal(title.key, 'name')
    assert.equal(draftToItem('tales', chapter).name, 'The Quay at Night')
  })

  it('requires a title and an answer to standalone', () => {
    const required = fieldsFor('tales')!
      .filter((f) => f.required)
      .map((f) => f.key)
    assert.deepEqual(required, ['name', 'standalone'])
    assert.equal(defaultValues('tales').standalone, true, 'a new tale stands alone until it does not')
  })

  it('keeps a false answer rather than reading it as a blank', () => {
    // The trap a boolean field walks into: `false` is an answer, and a required
    // field holding it is filled.
    const item = draftToItem('tales', chapter)
    assert.equal(item.attributes!.standalone, false)
    assert.equal(itemToDraft('tales', { ...item, id: 'x', tags: [] } as unknown as Item).standalone, false)
  })

  it('takes a written yes or no, for a file edited by hand', () => {
    assert.equal(draftToItem('tales', { name: 'A', standalone: 'no' }).attributes!.standalone, false)
    assert.equal(draftToItem('tales', { name: 'A', standalone: 'yes' }).attributes!.standalone, true)
    assert.throws(() => draftToItem('tales', { name: 'A', standalone: 'perhaps' }), /required/)
  })

  it('hangs the three chapter fields off the standalone answer', () => {
    // They are only worth asking once a tale is part of something longer.
    for (const key of ['parentTale', 'previousTale', 'nextTale']) {
      const field = fieldsFor('tales')!.find((f) => f.key === key)!
      assert.deepEqual(field.showWhen, { field: 'standalone', equals: false })
    }
    // And nothing else in the tool hides a field it means to ask about.
    const shown = fieldsFor('tales')!.filter((f) => !f.showWhen).map((f) => f.key)
    assert.deepEqual(shown, ['name', 'pronunciation', 'standalone', 'story'])
  })

  it('reads it back into the form', () => {
    const stored = { ...draftToItem('tales', chapter), id: 'x', tags: [] } as unknown as Item
    const draft = itemToDraft('tales', stored)
    assert.equal(draft.parentTale, 'The Chronicles of Finrock')
    assert.equal(draft.previousTale, 'The Salt Bride')
    assert.equal(draft.nextTale, null)
    assert.match(String(draft.story), /^The bell sounded twice/)
  })
})
