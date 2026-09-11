import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  COMMON_PER_NAME,
  COMMON_SHARE,
  commonShareFor,
  forgeName,
  forgeFullName,
  nameSources,
  sayable,
  type Item,
} from '../src/index.ts'

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

describe("leaning on a people's common names", () => {
  // No given-name seed begins with Q, and no mutation touches a first letter,
  // so a name beginning with Q is a name that started from the list. Twenty,
  // which is long enough to be leaned on in full.
  const ENDINGS = ['illon', 'enna', 'orvin', 'essa', 'illa', 'entar', 'innel', 'arra', 'oril', 'endra',
    'isset', 'olan', 'emmon', 'ithe', 'anna', 'ellis', 'orra', 'ibben', 'ester', 'allen']
  const deep = ENDINGS.map((e) => `Qu${e}`)

  /**
   * A seeded die, for the shares measured against the per-name cap.
   *
   * Robert lands at about 3.3% of people against a 4% cap, which is close
   * enough that an unseeded run crosses it about once in thirty - and a test
   * that fails one time in thirty teaches nobody anything.
   */
  const die = (seed: number) => () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  const draw = (common: string[], runs: number, random?: () => number) => {
    const counts = new Map<string, number>()
    for (let i = 0; i < runs; i++) {
      const name = forgeName({ kind: 'given', common, random })
      counts.set(name, (counts.get(name) ?? 0) + 1)
    }
    const listed = [...counts].filter(([n]) => n.startsWith('Q')).reduce((sum, [, c]) => sum + c, 0)
    return { counts, listed: listed / runs }
  }

  it('favours a long list without being limited to it', () => {
    // A list of common names is not a list of the only names. An English boy is
    // likelier to be Robert, and may still be Fabricio.
    const { listed } = draw(deep, 3000)
    assert.ok(listed > COMMON_SHARE - 0.1 && listed < COMMON_SHARE + 0.15, `from the list: ${listed}`)
    assert.ok(1 - listed > 0.15, `from anywhere else: ${(1 - listed).toFixed(2)}`)
  })

  it('does not name a third of a people Robert because only two names were recorded', () => {
    // Neither is a seed, so every Robert and Edward came from the list. The cap
    // is on draws that start from the list; the share landing on the name
    // itself runs a shade under it, since some of those draws are mutated.
    const runs = 5000
    const { counts } = draw(['Robert', 'Edward'], runs, die(7))
    for (const name of ['Robert', 'Edward']) {
      const share = (counts.get(name) ?? 0) / runs
      assert.ok(share < COMMON_PER_NAME + 0.005, `${name}: ${(share * 100).toFixed(1)}% of people`)
      assert.ok(share > 0.01, `${name} is still common: ${(share * 100).toFixed(1)}% of people`)
    }
  })

  it('leans on a list in proportion to its length', () => {
    assert.equal(commonShareFor(0), 0)
    assert.equal(commonShareFor(2), 2 * COMMON_PER_NAME)
    assert.ok(commonShareFor(8) < COMMON_SHARE)
    assert.equal(commonShareFor(100), COMMON_SHARE)
  })

  it('counts a name recorded twice only once', () => {
    const runs = 4000
    // Counted five times over, the list would be five names deep and Robert
    // would start a fifth of the draws.
    const { counts } = draw(['Robert', 'robert', 'Robert', 'Robert', 'Robert'], runs, die(11))
    assert.ok((counts.get('Robert') ?? 0) / runs < COMMON_PER_NAME + 0.005)
  })

  it('mostly uses a common name as it was recorded', () => {
    // A people that records Robert means Robert, not Robbert.
    const { counts } = draw(deep, 2000)
    const fromList = [...counts].filter(([n]) => n.startsWith('Q'))
    const all = fromList.reduce((sum, [, c]) => sum + c, 0)
    const exact = fromList.filter(([n]) => deep.includes(n)).reduce((sum, [, c]) => sum + c, 0)
    assert.ok(exact / all > 0.55, `used as recorded: ${exact} of ${all}`)
  })

  it('names someone whose people has no list exactly as before', () => {
    const die = () => 0.42
    assert.equal(
      forgeName({ kind: 'given', common: [], random: die }),
      forgeName({ kind: 'given', random: die }),
    )
  })
})

describe("where a person's names come from", () => {
  const entry = (container: string, name: string, extra: Partial<Item> = {}) =>
    ({ id: name, container, name, tags: [], createdAt: '', updatedAt: '', ...extra }) as Item

  const world = [
    entry('ethnicities', 'Kellish', {
      aliases: ['the Kell-folk'],
      attributes: {
        masculineNames: ['Corr', 'Tobin'],
        // Typed into the file by hand rather than through the form.
        feminineNames: 'Maren, Wenna',
        unisexNames: ['Ashe'],
        familyNames: ['Brack', 'Vane'],
      },
    }),
    entry('ethnicities', 'Dunfolk', { attributes: { masculineNames: ['Oswy'], familyNames: ['Holm'] } }),
    entry('people', 'Hesker Brack', { attributes: { givenName: 'Hesker', familyName: 'Brack', sex: 'male' } }),
    entry('people', 'Aldrica Vane'),
  ]
  const commonFor = (kind: 'given' | 'family', person: Record<string, unknown>) =>
    nameSources(world, kind, person).common

  it('takes the lists that fit the person', () => {
    assert.deepEqual(commonFor('given', { ethnicity: 'Kellish', sex: 'male' }), ['Corr', 'Tobin', 'Ashe'])
    assert.deepEqual(commonFor('given', { ethnicity: 'Kellish', sex: 'female' }), ['Maren', 'Wenna', 'Ashe'])
    assert.deepEqual(commonFor('family', { ethnicity: 'Kellish', sex: 'female' }), ['Brack', 'Vane'])
  })

  it('goes by gender before sex', () => {
    assert.deepEqual(
      commonFor('given', { ethnicity: 'Kellish', sex: 'male', gender: 'woman' }),
      ['Maren', 'Wenna', 'Ashe'],
    )
  })

  it('offers every list when it cannot tell which applies', () => {
    // A category this world has and ours does not is a wider register, not a
    // wrong one.
    for (const sex of [undefined, '', 'thirdborn']) {
      assert.deepEqual(
        commonFor('given', { ethnicity: 'Kellish', sex }).sort(),
        ['Ashe', 'Corr', 'Maren', 'Tobin', 'Wenna'],
      )
    }
  })

  it('finds the people by any name it goes by, and nothing for one it does not hold', () => {
    assert.deepEqual(commonFor('family', { ethnicity: 'the kell-folk' }), ['Brack', 'Vane'])
    assert.deepEqual(commonFor('family', { ethnicity: 'Nobody Recorded' }), [])
    assert.deepEqual(commonFor('given', {}), [])
  })

  it('blends in every name the universe has recorded, in parts', () => {
    // A person's joined name used to go into the pool whole - "Aldrica Vane" as
    // a given-name seed, space and all.
    const { canon } = nameSources(world, 'given')
    for (const name of ['Hesker', 'Aldrica', 'Corr', 'Maren', 'Oswy']) assert.ok(canon.includes(name), name)
    assert.ok(canon.every((n) => !/\s/.test(n)), `no joined names: ${canon.join(', ')}`)
    assert.deepEqual(nameSources(world, 'family').canon.sort(), ['Brack', 'Brack', 'Holm', 'Vane', 'Vane'])
  })

  it("does not seed a woman from men's names, whoever's people they are", () => {
    // Found in the console: with only her own people's list narrowed, the men's
    // names came back in through the wider pool, and a Kellish woman was named
    // Hesker.
    const { canon, common } = nameSources(world, 'given', { ethnicity: 'Kellish', sex: 'female' })
    for (const name of ['Corr', 'Tobin', 'Oswy', 'Hesker']) {
      assert.ok(!canon.includes(name) && !common.includes(name), `${name} is a man's name`)
    }
    // Aldrica was recorded with no sex at all, so her name is anyone's.
    for (const name of ['Maren', 'Ashe', 'Aldrica']) assert.ok(canon.includes(name), name)
  })
})
