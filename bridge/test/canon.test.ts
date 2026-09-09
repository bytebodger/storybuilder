import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildCanonCheckPrompt, extractFindings, screenFindings, type Finding } from '../src/canon.ts'
import type { Item } from '../../store/src/index.ts'

const item = (name: string, container = 'people'): Item => ({
  id: name.toLowerCase().replace(/\W/g, ''),
  container,
  name,
  tags: [],
  createdAt: '',
  updatedAt: '',
})

const finding = (over: Partial<Finding> = {}): Finding => ({
  kind: 'unknown-reference',
  passage: 'domesticated by Antin Forin',
  ...over,
})

describe('the stub round runs first, and this one reads the result', () => {
  it('drops an unknown reference the author just accepted as a stub', () => {
    // The stub was created between the two rounds, so the name now resolves.
    const store = [item('Antin Forin, III')]
    const { findings, resolved } = screenFindings(
      [finding({ term: 'Antin Forin, III' })],
      store,
    )

    assert.deepEqual(findings, [])
    assert.equal(resolved[0].matched, 'Antin Forin, III')
  })

  it('keeps an unknown reference the author declined to stub', () => {
    // Declining a stub is saying the thing is not real. Prose that leans on it
    // is a finding, and reporting it is the point of running second.
    const { findings } = screenFindings([finding({ term: 'Archane Order' })], [item('Antin Forin, III')])

    assert.equal(findings.length, 1)
    assert.equal(findings[0].term, 'Archane Order')
  })

  it('matches loosely, so a stub titled in the plural still resolves', () => {
    const { findings } = screenFindings([finding({ term: 'thorinfly' })], [item('Thorinflies', 'fauna')])
    assert.deepEqual(findings, [])
  })
})

describe('screening findings', () => {
  it('never drops a contradiction, which code cannot adjudicate', () => {
    const { findings } = screenFindings(
      [finding({ kind: 'contradiction', term: 'Dol', passage: 'Dol lies inland' })],
      [item('Dol', 'locations')],
    )
    assert.equal(findings.length, 1)
  })

  it('orders the serious ones first', () => {
    const { findings } = screenFindings(
      [
        finding({ kind: 'unknown-reference', term: 'Parth', passage: 'based in Parth' }),
        finding({ kind: 'out-of-span', passage: 'in Year 4000' }),
        finding({ kind: 'closed-set', passage: 'all three continents' }),
        finding({ kind: 'contradiction', passage: 'Dol lies inland' }),
      ],
      [],
    )
    assert.deepEqual(findings.map((f) => f.kind), [
      'closed-set',
      'contradiction',
      'out-of-span',
      'unknown-reference',
    ])
  })

  it('collapses the same complaint reported twice', () => {
    const { findings } = screenFindings([finding({ term: 'Parth' }), finding({ term: 'Parth' })], [])
    assert.equal(findings.length, 1)
  })

  it('drops a finding with no passage, and repairs an unknown kind', () => {
    const { findings } = screenFindings(
      [finding({ passage: '  ' }), { kind: 'nonsense' as Finding['kind'], passage: 'something' }],
      [],
    )
    assert.equal(findings.length, 1)
    assert.equal(findings[0].kind, 'contradiction')
  })
})

describe('reading the response', () => {
  it('finds the object in fences and commentary', () => {
    const raw = 'Checked:\n```json\n{"findings":[{"kind":"closed-set","passage":"three continents"}]}\n```'
    assert.equal(extractFindings(raw)?.[0].kind, 'closed-set')
  })

  it('treats an empty list as a real answer', () => {
    assert.deepEqual(extractFindings('{"findings": []}'), [])
  })

  it('returns null rather than guessing', () => {
    assert.equal(extractFindings('Looks fine to me.'), null)
  })
})

describe('the prompt', () => {
  it('tells the skill the stub round already happened', () => {
    const prompt = buildCanonCheckPrompt(
      'phonon',
      { id: 'c1', name: 'Bottonfly', container: 'fauna' },
      { description: 'Massive insects.' },
    )
    assert.match(prompt, /Use the canon-check skill/)
    assert.match(prompt, /already been offered to the author as stubs/)
    assert.match(prompt, /declined/)
    assert.match(prompt, /"findings"/)
  })
})
