import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { groupPlan } from '../src/import.ts'
import type { ImportCandidate, ImportPlan, Item } from '../../store/src/index.ts'

const candidate = (name: string, container: string, kind?: string, over: Partial<ImportCandidate> = {}): ImportCandidate => ({
  name,
  container,
  kind,
  tier: 1,
  source: 'json',
  sourceType: 'state',
  ...over,
})

const item = (name: string, container = 'locations'): Item => ({
  id: name.toLowerCase(),
  container,
  name,
  tags: [],
  createdAt: '',
  updatedAt: '',
})

const plan = (candidates: ImportCandidate[]): ImportPlan => ({ candidates, counts: [], warnings: [] })

describe('grouping a plan for review', () => {
  it('gathers candidates by what they will be in the world', () => {
    const grouped = groupPlan(
      plan([
        candidate('Seedon', 'locations', 'country'),
        candidate('Granith', 'locations', 'country'),
        candidate('Betford', 'locations', 'city'),
        candidate('Horsbumeby', 'geography', 'river'),
      ]),
      [],
    )

    // Grouped by container first, so one section of the nav reads together.
    assert.deepEqual(grouped.groups.map((g) => g.key), [
      'geography/river',
      'locations/country',
      'locations/city',
    ])
    assert.equal(grouped.total, 4)
  })

  it('puts the biggest group of a container first, as the costliest decision', () => {
    const grouped = groupPlan(
      plan([
        candidate('Seedon', 'locations', 'country'),
        ...['a', 'b', 'c'].map((n) => candidate(n, 'locations', 'village')),
      ]),
      [],
    )
    assert.deepEqual(grouped.groups.map((g) => g.key), ['locations/village', 'locations/country'])
  })

  it('sorts within a group by name, so a long list can be scanned', () => {
    const grouped = groupPlan(
      plan([candidate('Zeta', 'locations', 'city'), candidate('Alpha', 'locations', 'city')]),
      [],
    )
    assert.deepEqual(grouped.groups[0].candidates.map((c) => c.name), ['Alpha', 'Zeta'])
  })

  it('never offers what the universe already has, and says what matched', () => {
    const grouped = groupPlan(
      plan([candidate('Seedon', 'locations', 'country'), candidate('Betford', 'locations', 'city')]),
      [item('Seedon')],
    )

    assert.equal(grouped.total, 1)
    assert.equal(grouped.groups[0].candidates[0].name, 'Betford')
    assert.deepEqual(grouped.alreadyPresent, [{ name: 'Seedon', matched: 'Seedon' }])
  })

  it('screens loosely, so a re-import does not duplicate a plural', () => {
    const grouped = groupPlan(plan([candidate('Thorinfly', 'fauna')]), [item('Thorinflies', 'fauna')])
    assert.equal(grouped.total, 0)
    assert.equal(grouped.alreadyPresent[0].matched, 'Thorinflies')
  })

  it('carries the warnings through, since they explain renames', () => {
    const grouped = groupPlan(
      { candidates: [], counts: [], warnings: ['65 name(s) were reused'] },
      [],
    )
    assert.match(grouped.warnings[0], /reused/)
  })

  it('handles an empty plan without inventing a group', () => {
    const grouped = groupPlan(plan([]), [])
    assert.deepEqual(grouped.groups, [])
    assert.equal(grouped.total, 0)
  })
})
