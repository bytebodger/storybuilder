import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { groupPlan } from '../src/import.ts'
import { importedAttributes } from '../../store/src/index.ts'
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

/** An article as a previous import left it, fingerprint and all. */
const importedItem = (c: ImportCandidate): Item => ({
  ...item(c.name, c.container),
  kind: c.kind,
  summary: c.summary,
  attributes: importedAttributes(c),
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

describe('a review of a re-import', () => {
  const granith = candidate('Granith', 'locations', 'country', { summary: 'A monarchy.' })
  const changed = candidate('Granith', 'locations', 'country', { summary: 'A republic.' })
  const fresh = candidate('Bay of Whispers', 'geography', 'bay')

  it('offers what is new and what the map now disagrees with', () => {
    const grouped = groupPlan(plan([changed, fresh]), [importedItem(granith)])
    const names = grouped.groups.flatMap((g) => g.candidates.map((c) => c.name))

    assert.deepEqual(names.sort(), ['Bay of Whispers', 'Granith'])
    assert.equal(grouped.delta.new, 1)
    assert.equal(grouped.delta.update, 1)
  })

  it('leaves out what the map still agrees with', () => {
    const grouped = groupPlan(plan([granith]), [importedItem(granith)])
    assert.equal(grouped.total, 0)
    assert.equal(grouped.delta.unchanged, 1)
    assert.deepEqual(grouped.alreadyPresent, [{ name: 'Granith', matched: 'Granith' }])
  })

  it('leaves out an article written since it was imported, rather than offering to overwrite it', () => {
    const written: Item = { ...importedItem(granith), summary: 'A kingdom of terraced hills.' }
    const grouped = groupPlan(plan([changed]), [written])

    assert.equal(grouped.total, 0, 'not offered')
    assert.equal(grouped.delta.edited, 1)
  })

  it('names what a previous import made that the map has dropped', () => {
    const dalworth = candidate('Dalworth', 'locations', 'country')
    const grouped = groupPlan(plan([granith]), [importedItem(granith), importedItem(dalworth)])
    assert.deepEqual(grouped.delta.missing, ['Dalworth'])
  })
})
