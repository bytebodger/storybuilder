import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { assess, countBy, digestOf, importedAttributes, DIGEST_KEY } from '../src/import/delta.ts'
import type { ImportCandidate } from '../src/import/types.ts'
import type { Item } from '../src/types.ts'

const candidate = (name: string, over: Partial<ImportCandidate> = {}): ImportCandidate => ({
  name,
  container: 'locations',
  kind: 'country',
  tier: 1,
  source: 'json',
  sourceType: 'state',
  summary: 'A monarchy.',
  attributes: { population: 100 },
  ...over,
})

/** An article as a previous import would have left it. */
const imported = (c: ImportCandidate, over: Partial<Item> = {}): Item => ({
  id: c.name.toLowerCase(),
  container: c.container,
  kind: c.kind,
  name: c.name,
  summary: c.summary,
  attributes: importedAttributes(c),
  tags: [],
  createdAt: '',
  updatedAt: '',
  ...over,
})

describe('a re-import compares rather than rebuilds', () => {
  it('leaves an article the map still agrees with alone', () => {
    const c = candidate('Granith')
    const { assessments } = assess([c], [imported(c)])
    assert.equal(assessments[0].verdict, 'unchanged')
    assert.deepEqual(assessments[0].changed, [])
  })

  it('marks an article the map has changed, and says what', () => {
    const before = candidate('Granith')
    const after = candidate('Granith', { attributes: { population: 250 }, summary: 'A republic.' })
    const { assessments } = assess([after], [imported(before)])

    assert.equal(assessments[0].verdict, 'update')
    assert.deepEqual(assessments[0].changed.sort(), ['population', 'summary'])
  })

  it('treats a name the universe has never seen as new', () => {
    const { assessments } = assess([candidate('Bay of Whispers')], [])
    assert.equal(assessments[0].verdict, 'new')
  })

  it('matches loosely, so a plural is not imported twice', () => {
    const c = candidate('Thorinflies', { container: 'fauna', kind: undefined })
    const { assessments } = assess([candidate('Thorinfly', { container: 'fauna', kind: undefined })], [imported(c)])
    assert.notEqual(assessments[0].verdict, 'new')
  })
})

describe('what an import will not touch', () => {
  it('keeps its hands off an article written since it was imported', () => {
    const c = candidate('Granith')
    const edited = imported(c, { summary: 'A kingdom of terraced hills.' })
    const { assessments } = assess([candidate('Granith', { attributes: { population: 250 } })], [edited])

    assert.equal(assessments[0].verdict, 'edited')
    // It still reports what the map now says, so the author can decide.
    assert.ok(assessments[0].changed.includes('population'))
  })

  it('notices an edit to an attribute, not only to prose', () => {
    const c = candidate('Granith')
    const edited = imported(c, { attributes: { ...importedAttributes(c), population: 999 } })
    assert.equal(assess([c], [edited]).assessments[0].verdict, 'edited')
  })

  it('never claims an article no import created', () => {
    const byHand: Item = {
      id: 'x',
      container: 'locations',
      name: 'Granith',
      summary: 'Written from scratch.',
      tags: [],
      createdAt: '',
      updatedAt: '',
    }
    const { assessments } = assess([candidate('Granith')], [byHand])
    assert.equal(assessments[0].verdict, 'authored')
    assert.equal(assessments[0].changed.length, 0)
  })
})

describe('what has left the map', () => {
  it('is reported, never removed', () => {
    const kept = candidate('Granith')
    const dropped = candidate('Dalworth')
    const { missing } = assess([kept], [imported(kept), imported(dropped)])

    assert.deepEqual(missing.map((m) => m.name), ['Dalworth'])
  })

  it('does not count an article the import never made', () => {
    const byHand: Item = {
      id: 'x',
      container: 'legends',
      name: 'Southlandia',
      tags: [],
      createdAt: '',
      updatedAt: '',
    }
    assert.deepEqual(assess([], [byHand]).missing, [])
  })
})

describe('the fingerprint', () => {
  it('ignores the order attributes happen to be in', () => {
    assert.equal(digestOf('x', { a: 1, b: 2 }), digestOf('x', { b: 2, a: 1 }))
  })

  it('changes when anything the import wrote changes', () => {
    const base = digestOf('x', { a: 1 })
    assert.notEqual(base, digestOf('y', { a: 1 }))
    assert.notEqual(base, digestOf('x', { a: 2 }))
  })

  it('does not fold itself into its own value', () => {
    assert.equal(digestOf('x', { a: 1 }), digestOf('x', { a: 1, [DIGEST_KEY]: 'anything' }))
  })

  it('drops attributes with no value, so absent and undefined agree', () => {
    const attrs = importedAttributes(candidate('X', { attributes: { population: 1, port: undefined } }))
    assert.equal('port' in attrs, false)
  })
})

describe('counting a delta', () => {
  it('tallies every verdict', () => {
    const a = candidate('A')
    const b = candidate('B')
    const counts = countBy(
      assess([a, candidate('B', { summary: 'changed' }), candidate('C')], [imported(a), imported(b)]),
    )
    assert.deepEqual(counts, { new: 1, update: 1, unchanged: 1, edited: 0, authored: 0 })
  })
})
