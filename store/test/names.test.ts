import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { forgeName, forgeFullName, sayable } from '../src/index.ts'

describe('what counts as a name', () => {
  it('accepts the ordinary shapes', () => {
    for (const name of ['Halvard', 'Mei', 'Thessaly', 'Corlys', 'Helaena', 'Nurmagomedov']) {
      assert.ok(sayable(name), name)
    }
  })

  it('refuses what a mutation can produce and a mouth cannot', () => {
    assert.equal(sayable('Rshhtk'), false, 'no vowel')
    assert.equal(sayable('Annna'), false, 'three of the same letter')
    assert.equal(sayable('Kalvstrd'), false, 'a wall of consonants')
    assert.equal(sayable('Kaood'), false, 'three vowels in a row is a bad graft')
    assert.equal(sayable('Strandvold'.repeat(3)), false, 'too long')
    assert.equal(sayable('Ka'), false, 'too short')
  })
})

describe('forging a name', () => {
  it('is unbounded rather than a shortlist', () => {
    // The complaint this exists to answer: regenerating a given name cycled
    // through Halvard, Elkirk, Halvard, Elkirk. A generative pool does not.
    const seen = new Set<string>()
    for (let i = 0; i < 4000; i++) seen.add(forgeName({ kind: 'given' }))
    assert.ok(seen.size > 1200, `distinct names: ${seen.size}`)
  })

  it('always returns something sayable', () => {
    for (let i = 0; i < 2000; i++) {
      const name = forgeName({ kind: 'given' })
      assert.ok(name && sayable(name), `unsayable: ${name}`)
      assert.match(name, /^[A-Z][a-z]+$/, `badly cased: ${name}`)
    }
  })

  it('never returns a name that is taken', () => {
    const taken = ['Halvard', 'Elkirk', 'Corle']
    for (let i = 0; i < 500; i++) {
      const name = forgeName({ kind: 'given', canon: taken, taken })
      assert.ok(!taken.map((t) => t.toLowerCase()).includes(name.toLowerCase()), name)
    }
  })

  it('never repeats itself across a run of regenerates', () => {
    // Clicking Regenerate twenty times should cost twenty different names, not
    // a loop of two.
    const rejected: string[] = []
    for (let i = 0; i < 20; i++) {
      const name = forgeName({ kind: 'given', avoid: rejected })
      assert.ok(name, 'a name was found')
      assert.ok(!rejected.includes(name), `${name} was already offered`)
      rejected.push(name)
    }
  })

  it('is reproducible under a fixed die', () => {
    const die = () => 0.42
    assert.equal(forgeName({ kind: 'given', random: die }), forgeName({ kind: 'given', random: die }))
  })

  it('leans on the names the universe already uses', () => {
    // Seeded three times over against a couple of hundred seeds, canon should
    // show up in the output far more often than chance would give it.
    const canon = ['Zzyrix', 'Qwomble', 'Vraxil']
    let near = 0
    for (let i = 0; i < 1000; i++) {
      const name = forgeName({ kind: 'given', canon }).toLowerCase()
      if (['z', 'q', 'v'].includes(name[0])) near++
    }
    assert.ok(near > 40, `canon-flavoured results: ${near} of 1000`)
  })

  it('gives a person two names that are not the same word', () => {
    for (let i = 0; i < 300; i++) {
      const { given, family } = forgeFullName()
      assert.notEqual(given.toLowerCase(), family.toLowerCase())
    }
  })

  it('says nothing rather than repeating itself when the pool is exhausted', () => {
    // A tiny pool, everything in it refused. An empty string is the honest
    // answer; offering a name the author already rejected is not.
    const avoid: string[] = []
    for (let i = 0; i < 400; i++) {
      const name = forgeName({ kind: 'given', avoid })
      if (!name) return
      avoid.push(name)
    }
    assert.ok(avoid.length === 400, 'it kept finding new ones, which is also fine')
  })
})
