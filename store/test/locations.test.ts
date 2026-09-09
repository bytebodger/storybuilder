import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { LOCATION_FIELDS } from '../src/locations-fields.ts'
import { defaultValues, draftToItem, draftToPatch, itemToDraft } from '../src/article.ts'
import { renderBrief } from '../src/brief.ts'
import type { Item } from '../src/types.ts'

const dol = {
  name: 'Dol',
  parentLocation: 'Kell',
  description: 'Kell’s capital and only deepwater port.',
  existedSince: '198',
  population: 'about 40,000',
  founders: ['Antin Forin, III'],
  climate: 'Wet, and cold enough that the harbour ices in a hard year.',
}

describe('the locations spec', () => {
  it('requires only a name', () => {
    assert.deepEqual(LOCATION_FIELDS.filter((f) => f.required).map((f) => f.key), ['name'])
    assert.equal(LOCATION_FIELDS.length, 13)
  })

  it('starts a new location at Year 0, as the spec says', () => {
    assert.equal(defaultValues('locations').existedSince, '0')
    assert.deepEqual(defaultValues('locations').founders, [])
    // A field with no default contributes nothing, rather than a null.
    assert.equal('climate' in defaultValues('locations'), false)
  })
})

describe('when a place existed', () => {
  it('stores the dates on the columns the store already understands', () => {
    const item = draftToItem('locations', { ...dol, existedUntil: '812' })

    assert.equal(item.beginDate, '198')
    assert.equal(item.endDate, '812')
    // Not duplicated into attributes, where nothing would read them.
    assert.equal('existedSince' in (item.attributes ?? {}), false)
    assert.equal('existedUntil' in (item.attributes ?? {}), false)
  })

  it('is why a fallen city is marked fallen in every brief', () => {
    // The whole reason these map onto columns: renderBrief knows endDate, and
    // knows nothing about the locations spec.
    const built = draftToItem('locations', { ...dol, existedUntil: '812' })
    const stored: Item = {
      id: 'dol',
      container: 'locations',
      name: built.name,
      summary: built.summary,
      beginDate: built.beginDate,
      endDate: built.endDate,
      tags: [],
      createdAt: '',
      updatedAt: '',
    }

    const text = renderBrief({ item: stored, related: {} })
    assert.match(text, /198 - 812; NO LONGER EXTANT/)
  })

  it('leaves a standing place with no end date', () => {
    const item = draftToItem('locations', dol)
    assert.equal(item.endDate, undefined)
  })

  it('round-trips the dates back into the form', () => {
    const built = draftToItem('locations', { ...dol, existedUntil: '812' })
    const values = itemToDraft('locations', {
      id: 'dol',
      container: 'locations',
      name: built.name,
      summary: built.summary,
      beginDate: built.beginDate,
      endDate: built.endDate,
      tags: [],
      createdAt: '',
      updatedAt: '',
    })

    assert.equal(values.existedSince, '198')
    assert.equal(values.existedUntil, '812')
    assert.equal(values.description, built.summary)
  })

  it('carries the dates through an update, so clearing one takes effect', () => {
    const patch = draftToPatch('locations', dol)
    assert.deepEqual(Object.keys(patch).sort(), [
      'attributes', 'beginDate', 'endDate', 'kind', 'name', 'summary',
    ])
    assert.equal(patch.endDate, undefined)
  })
})

describe('the rest of the fields', () => {
  it('keeps founders as a list, so each one can link separately', () => {
    const item = draftToItem('locations', dol)
    assert.deepEqual(item.attributes!.founders, ['Antin Forin, III'])
  })

  it('splits a typed list on commas', () => {
    const item = draftToItem('locations', { ...dol, founders: 'Antin Forin, III' as unknown as string[] })
    assert.deepEqual(item.attributes!.founders, ['Antin Forin', 'III'])
  })

  it('puts the prose fields in attributes and the description on the summary', () => {
    const item = draftToItem('locations', dol)
    assert.match(item.summary!, /deepwater port/)
    assert.match(String(item.attributes!.climate), /harbour ices/)
    assert.equal(item.attributes!.parentLocation, 'Kell')
  })
})
