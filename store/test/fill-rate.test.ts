import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  containersWithFields,
  fieldsFor,
  fillRateOf,
  rollOmissions,
  rollFor,
  type FillRates,
  type Universe,
} from '../src/index.ts'

/** How often each field survived the roll, over many articles. */
function survival(container: string, runs = 4000): Record<string, number> {
  const spec = fieldsFor(container) ?? []
  const kept: Record<string, number> = Object.fromEntries(spec.map((f) => [f.key, 0]))
  for (let i = 0; i < runs; i++) {
    const omitted = new Set(rollOmissions(container))
    for (const field of spec) if (!omitted.has(field.key)) kept[field.key]++
  }
  return Object.fromEntries(Object.entries(kept).map(([k, n]) => [k, n / runs]))
}

describe('how often a field is filled at all', () => {
  it('honours the rate each field declares', () => {
    // The whole mechanism: a model handed an optional field fills it, every
    // time. Ask fifty people for an honorific and you get fifty Captains.
    const rate = survival('people')
    for (const field of fieldsFor('people') ?? []) {
      if (field.fillRate === undefined || field.required) continue
      const seen = rate[field.key]
      assert.ok(
        Math.abs(seen - field.fillRate) < 0.04,
        `${field.key} kept ${(seen * 100).toFixed(0)}%, declared ${field.fillRate * 100}%`,
      )
    }
  })

  it('always fills a field that declares no rate', () => {
    const rate = survival('people', 500)
    for (const field of fieldsFor('people') ?? []) {
      if (field.fillRate !== undefined) continue
      assert.equal(rate[field.key], 1, `${field.key} is not optional and should never be skipped`)
    }
  })

  it('never omits a required field', () => {
    // A required field is filled by definition, whatever a spec claims.
    for (const container of containersWithFields()) {
      const required = (fieldsFor(container) ?? []).filter((f) => f.required).map((f) => f.key)
      for (let i = 0; i < 200; i++) {
        const omitted = rollOmissions(container)
        for (const key of required) assert.ok(!omitted.includes(key), `${container}.${key}`)
      }
    }
  })

  it('applies to every container with a spec, not only the one with a skeleton', () => {
    const context = {
      universe: { id: 'u', name: 'U', createdAt: '' } as Universe,
      items: [],
      timelines: [],
    }
    // Every spec as it is added, rather than a list to remember to extend.
    for (const container of containersWithFields().filter((c) => c !== 'people')) {
      const roll = rollFor(container, context)
      assert.ok(roll, `${container} has a roll`)
      assert.deepEqual(roll.values, {}, 'no skeleton, only omissions')
    }
    assert.equal(rollFor('legends', context), null, 'a container with no spec has no roll')
  })

  it('leaves a person with something to say', () => {
    // A form where everything optional rolled away is as useless as one where
    // nothing did. Most of the spec should survive most of the time.
    const spec = fieldsFor('people') ?? []
    let worst = spec.length
    for (let i = 0; i < 500; i++) {
      worst = Math.min(worst, spec.length - rollOmissions('people').length)
    }
    assert.ok(worst > spec.length * 0.6, `thinnest person kept ${worst} of ${spec.length} fields`)
  })
})

describe('what a universe says about its own rates', () => {
  const spec = fieldsFor('people') ?? []
  const rateOf = (key: string) => spec.find((f) => f.key === key)!

  const share = (key: string, rates: FillRates | undefined, runs = 3000) => {
    let kept = 0
    for (let i = 0; i < runs; i++) {
      if (!rollOmissions('people', rates).includes(key)) kept++
    }
    return kept / runs
  }

  it('wins over the rate the spec declares', () => {
    // A court chronicle and a fishing village disagree about how many people
    // have a title, and both are right.
    const courtly: FillRates = { people: { honorific: 0.8 } }
    assert.ok(Math.abs(share('honorific', courtly) - 0.8) < 0.04)
    assert.ok(Math.abs(share('honorific', undefined) - 0.15) < 0.04, 'and the default still stands')
  })

  it('can say never, which is not the same as saying nothing', () => {
    // Phonon's laws say there is no magic. Zero has to mean zero rather than
    // falling through to the spec's 8%.
    const mundane: FillRates = { people: { specialAbilities: 0 } }
    assert.equal(share('specialAbilities', mundane, 500), 0)
    assert.ok(share('specialAbilities', undefined, 3000) > 0.04, 'against the spec default')
  })

  it('leaves every field it does not mention alone', () => {
    const one: FillRates = { people: { honorific: 0.9 } }
    assert.ok(Math.abs(share('suffix', one) - rateOf('suffix').fillRate!) < 0.04)
  })

  it('cannot fill a field less often than always if it is required', () => {
    const silly: FillRates = { people: { givenName: 0, overview: 0 } }
    for (let i = 0; i < 200; i++) {
      const omitted = rollOmissions('people', silly)
      assert.ok(!omitted.includes('givenName') && !omitted.includes('overview'))
    }
  })

  it('clamps a nonsense number rather than behaving strangely', () => {
    // `sb validate` is where the author hears about it; the roll just copes.
    assert.equal(fillRateOf(rateOf('honorific'), 'people', { people: { honorific: 4 } }), 1)
    assert.equal(fillRateOf(rateOf('honorific'), 'people', { people: { honorific: -2 } }), 0)
  })

  it('ignores an override aimed at another container', () => {
    const elsewhere: FillRates = { locations: { honorific: 1 } }
    assert.ok(Math.abs(share('honorific', elsewhere) - 0.15) < 0.04)
  })
})

describe('the rates people declare', () => {
  it('keeps the things most people do not have rare', () => {
    const byKey = new Map((fieldsFor('people') ?? []).map((f) => [f.key, f]))
    for (const key of ['honorific', 'suffix', 'nicknames', 'specialAbilities']) {
      const rate = byKey.get(key)?.fillRate
      assert.ok(rate !== undefined && rate <= 0.25, `${key} should be the exception, not the rule`)
    }
  })

  it('leaves the spine of an article alone', () => {
    // Whatever else is rolled away, an article still has to be an article.
    const byKey = new Map((fieldsFor('people') ?? []).map((f) => [f.key, f]))
    for (const key of ['overview', 'personalHistory', 'physicalDescription', 'motivations']) {
      assert.equal(byKey.get(key)?.fillRate, undefined, `${key} is not optional decoration`)
    }
  })
})
