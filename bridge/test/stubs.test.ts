import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { extractCandidates, screenCandidates, stubContainers } from '../src/stubs.ts'
import type { Item } from '../../store/src/index.ts'

const item = (name: string, container = 'fauna', aliases?: string[]): Item => ({
  id: name.toLowerCase().replace(/\W/g, ''),
  container,
  name,
  aliases,
  tags: [],
  createdAt: '',
  updatedAt: '',
})

const existing = [item('Thorinflies'), item('Kell', 'locations'), item('Casterway', 'ethnicities', ['Casterfolk'])]

describe('screening proposals against the store', () => {
  it('drops a term the universe already has under another spelling', () => {
    const result = screenCandidates([{ term: 'thorinfly', container: 'fauna' }], existing)

    assert.deepEqual(result.candidates, [])
    assert.equal(result.alreadyKnown[0].matched, 'Thorinflies')
  })

  it('drops a term that matches an existing alias', () => {
    const result = screenCandidates([{ term: 'the Casterfolk', container: 'ethnicities' }], existing)
    assert.equal(result.candidates.length, 0)
    assert.equal(result.alreadyKnown[0].matched, 'Casterway')
  })

  it('keeps a genuinely new term, with its context', () => {
    const result = screenCandidates(
      [{ term: 'Archane Order', container: 'institutions', context: 'an order with potentates', field: 'domestication' }],
      existing,
    )

    assert.equal(result.candidates.length, 1)
    assert.equal(result.candidates[0].term, 'Archane Order')
    assert.equal(result.candidates[0].context, 'an order with potentates')
    assert.equal(result.candidates[0].field, 'domestication')
  })

  it('never proposes the article as a loose end in its own article', () => {
    const result = screenCandidates([{ term: 'Bottonflies', container: 'fauna' }], existing, {
      name: 'Bottonfly',
    })
    assert.deepEqual(result.candidates, [])
    assert.deepEqual(result.discarded, ['Bottonflies'])
  })

  it('collapses variants of one term proposed twice', () => {
    const result = screenCandidates(
      [
        { term: 'Dawn Reavers', container: 'institutions' },
        { term: 'the Dawn Reaver', container: 'institutions' },
      ],
      existing,
    )
    assert.equal(result.candidates.length, 1)
    assert.equal(result.discarded.length, 1)
  })

  it('keeps a candidate whose container is unusable, and says so', () => {
    const result = screenCandidates([{ term: 'Parth', container: 'not-a-container' }], existing)

    assert.equal(result.candidates[0].container, '')
    assert.match(result.candidates[0].note!, /choose one/)
  })

  it('discards blanks and absurd lengths', () => {
    const result = screenCandidates(
      [{ term: '   ', container: 'people' }, { term: 'x'.repeat(200), container: 'people' }],
      existing,
    )
    assert.equal(result.candidates.length, 0)
    assert.equal(result.discarded.length, 2)
  })
})

describe('a retitled stub keeps the name the prose used', () => {
  it('treats the original term and the edited title as the same thing', () => {
    // "Antin Forin" in the prose, saved as "Antin Forin, III". The alias is what
    // stops the canon check reporting the prose reference as unrecorded.
    const withAlias = [item('Antin Forin, III', 'people', ['Antin Forin'])]
    const result = screenCandidates([{ term: 'Antin Forin', container: 'people' }], withAlias)

    assert.deepEqual(result.candidates, [])
    assert.equal(result.alreadyKnown[0].matched, 'Antin Forin, III')
  })
})

describe('reading the proposal', () => {
  it('finds the list inside fences and commentary', () => {
    const raw = 'Here:\n```json\n{"candidates":[{"term":"Parth","container":"locations"}]}\n```\nDone.'
    assert.equal(extractCandidates(raw)?.[0].term, 'Parth')
  })

  it('returns null rather than guessing', () => {
    assert.equal(extractCandidates('I could not find anything.'), null)
  })

  it('reads an empty list as a real answer', () => {
    assert.deepEqual(extractCandidates('{"candidates": []}'), [])
  })
})

describe('where a stub may go', () => {
  it('offers every catalog container, and never the universe manifest', () => {
    const keys = stubContainers().map((c) => c.key)
    assert.ok(keys.includes('people'))
    assert.ok(keys.includes('geography'))
    assert.ok(keys.includes('institutions'))
    assert.equal(keys.includes('universe'), false)
    assert.ok(keys.length >= 19)
  })
})
