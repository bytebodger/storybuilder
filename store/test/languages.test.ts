import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { draftToItem, fieldsFor, itemToDraft, type Item } from '../src/index.ts'

const kellish = {
  name: 'Kellish',
  pronunciation: 'KELL-ish',
  description: 'The tongue of Kell and its Reach, spoken wherever the salt trade reaches.',
  parentLanguages: ['the Old Tongue'],
  spokenBy: 'Kellish, the Guild of Weighers',
  vocabulary: 'Eleven words for the state of a tide, and none at all for a mountain.',
}

describe('the languages spec', () => {
  it('asks for the fields it was specified with, in order', () => {
    assert.deepEqual(
      fieldsFor('languages')!.map((f) => f.label),
      [
        'Name',
        'Pronunciation',
        'Description',
        'Parent Languages',
        'Spoken By',
        'Geographic Distribution',
        'Writing System',
        'Phonology',
        'Morphology',
        'Syntax',
        'Vocabulary',
        'Sentence Structure',
        'Cultural Significance',
      ],
    )
  })

  it('requires only a name', () => {
    const required = fieldsFor('languages')!
      .filter((f) => f.required)
      .map((f) => f.key)
    assert.deepEqual(required, ['name'])
  })

  it('keeps the two name lists as lists, so each entry links itself', () => {
    const byKey = new Map(fieldsFor('languages')!.map((f) => [f.key, f]))
    for (const key of ['parentLanguages', 'spokenBy']) {
      assert.equal(byKey.get(key)?.kind, 'list', key)
    }
  })

  it('rolls the linguistics rather than asking for five paragraphs of textbook', () => {
    // Asked about the morphology of a language nobody has described, a model
    // writes a paragraph true of a thousand languages and of no one in this
    // world. An unwritten language is ordinary too.
    const byKey = new Map(fieldsFor('languages')!.map((f) => [f.key, f]))
    for (const key of ['phonology', 'morphology', 'syntax', 'vocabulary', 'sentenceStructure',
      'writingSystem']) {
      const rate = byKey.get(key)?.fillRate
      assert.ok(rate !== undefined && rate <= 0.6, `${key} should not be filled every time`)
    }
    // What the article is for stays.
    assert.equal(byKey.get('spokenBy')?.fillRate, undefined)
    assert.equal(byKey.get('distribution')?.fillRate, undefined)
  })

  it('stores the description as the summary and the lists as attributes', () => {
    const item = draftToItem('languages', kellish)
    assert.match(item.summary!, /^The tongue of Kell/)
    assert.deepEqual(item.attributes!.parentLanguages, ['the Old Tongue'])
    assert.deepEqual(item.attributes!.spokenBy, ['Kellish', 'the Guild of Weighers'])
    assert.equal('description' in item.attributes!, false)
  })

  it('reads it back into the form', () => {
    const stored = { ...draftToItem('languages', kellish), id: 'x', tags: [] } as unknown as Item
    const draft = itemToDraft('languages', stored)
    assert.equal(draft.description, kellish.description)
    assert.deepEqual(draft.parentLanguages, ['the Old Tongue'])
  })
})
