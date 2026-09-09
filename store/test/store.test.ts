import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { JsonFileStore } from '../src/json-store.ts'
import { createUniverse, listUniverses, openUniverse, toUniverseId } from '../src/universes.ts'
import { renderBrief, renderUniverseBrief } from '../src/brief.ts'
import { validate } from '../src/validate.ts'
import { CONTAINER_TYPES, containerType } from '../src/containers.ts'
import { CanonViolation, type ContainerFile } from '../src/types.ts'

let root: string

before(async () => {
  root = await mkdtemp(join(tmpdir(), 'sb-test-'))
})
after(async () => {
  await rm(root, { recursive: true, force: true })
})

/** The scenario from the design discussion, verbatim. */
async function phonon() {
  const dir = await mkdtemp(join(root, 'u-'))
  const store = await JsonFileStore.create(dir, { id: 'phonon-test', name: 'Phonon Test' })
  const planet = await store.add({ container: 'planet', name: 'Phonon' })
  const east = await store.add({ container: 'continent', name: 'Eastlandia', links: [{ to: planet.id }] })
  const west = await store.add({ container: 'continent', name: 'Westlandia', links: [{ to: planet.id }] })
  await store.setClosure(planet.id, 'continent', 'closed', 'The two-continent geography is structural to the series.')
  return { store, dir, planet, east, west }
}

describe('closure', () => {
  it('refuses a third continent once the set is closed', async () => {
    const { store, planet } = await phonon()
    const south = await store.add({ container: 'continent', name: 'Southlandia' })

    await assert.rejects(() => store.link(planet.id, south.id), (e: unknown) => {
      assert.ok(e instanceof CanonViolation)
      // The message names the real members, so a legendary one is never counted
      // among them and the author is told exactly what the set contains.
      assert.match(e.message, /closed set of continent: Eastlandia, Westlandia/)
      return true
    })

    // And the refusal left nothing behind on either side.
    assert.equal((await store.get(planet.id))!.tags.length, 2)
    assert.equal((await store.get(south.id))!.tags.length, 0)
  })

  it('refuses a third continent created with an inline link', async () => {
    const { store, planet } = await phonon()
    await assert.rejects(
      () => store.add({ container: 'continent', name: 'Southlandia', links: [{ to: planet.id }] }),
      CanonViolation,
    )
  })

  it('a legend is a legend, not a continent, so it never touches the closed set', async () => {
    const { store, planet } = await phonon()
    const atlantis = await store.add({
      container: 'legend',
      name: 'Southlandia',
      summary: 'Sailors swear it lies south of the ice. It does not.',
      links: [{ to: planet.id }],
    })

    const { related } = await store.neighborhood(planet.id)
    assert.deepEqual(related.continent.items.map((i) => i.name), ['Eastlandia', 'Westlandia'])
    assert.equal(related.continent.closure, 'closed')
    assert.deepEqual(related.legend.items.map((i) => i.id), [atlantis.id])
    assert.equal(related.legend.closure, 'open')
  })

  it('refuses to promote a legend into a closed set of continents', async () => {
    const { store, planet } = await phonon()
    const atlantis = await store.add({ container: 'legend', name: 'Southlandia', links: [{ to: planet.id }] })

    // The lost continent cannot simply be found: Phonon is known to have two.
    await assert.rejects(() => store.move(atlantis.id, 'continent'), CanonViolation)
    assert.equal((await store.get(atlantis.id))!.container, 'legend')
  })

  it('promotes a legend once the set is deliberately reopened, retyping both ends of the edge', async () => {
    const { store, planet } = await phonon()
    const atlantis = await store.add({ container: 'legend', name: 'Southlandia', links: [{ to: planet.id }] })

    await store.setClosure(planet.id, 'continent', 'uncharted')
    const promoted = await store.move(atlantis.id, 'continent')

    assert.equal(promoted.container, 'continent')
    // The planet's tag for it must be retyped too, or the one-pass read would
    // still file a continent under 'legend'.
    const planetAfter = await store.get(planet.id)
    assert.equal(planetAfter!.tags.find((t) => t.relatedTo === atlantis.id)!.type, 'continent')

    const { related } = await store.neighborhood(planet.id)
    assert.equal(related.continent.items.length, 3)
    assert.equal(related.legend, undefined)
    assert.deepEqual(await validate(store), [])
  })

  it('allows new members of an uncharted set - a discovery, not a contradiction', async () => {
    const { store, planet } = await phonon()
    await store.setClosure(planet.id, 'continent', 'uncharted')
    const south = await store.add({ container: 'continent', name: 'Southlandia' })
    await store.link(planet.id, south.id)

    const { related } = await store.neighborhood(planet.id)
    assert.equal(related.continent.items.length, 3)
    assert.equal(related.continent.closure, 'uncharted')
  })

  it('counts a continent that sank as a member, and says it is gone', async () => {
    const { store, planet } = await phonon()
    await store.setClosure(planet.id, 'continent', 'uncharted')
    const atlantis = await store.add({
      container: 'continent',
      name: 'Atlantis',
      beginDate: 'Year 0',
      endDate: 'Year 812',
      summary: 'Verified, charted, and thoroughly underwater.',
      links: [{ to: planet.id }],
    })
    await store.setClosure(planet.id, 'continent', 'closed', 'Three across recorded time; one of them sank.')

    // Membership is across all recorded time: the set is three, not two.
    const { related } = await store.neighborhood(planet.id)
    assert.equal(related.continent.items.length, 3)
    assert.ok(related.continent.items.some((i) => i.id === atlantis.id))

    // But a brief must not leave a sunken continent looking walkable.
    const text = renderBrief(await store.neighborhood(planet.id))
    assert.match(text, /Atlantis \[\w+\] \(Year 0 - Year 812; NO LONGER EXTANT\)/)
    assert.match(text, /Phonon has exactly 3 of type continent/)
  })

  it('reports a closed set with no members - "it has none" is a fact', async () => {
    const { store, planet } = await phonon()
    await store.setClosure(planet.id, 'moon', 'closed', 'Phonon has no moons; the night sky matters to the plot.')
    const { related } = await store.neighborhood(planet.id)
    assert.equal(related.moon.closure, 'closed')
    assert.deepEqual(related.moon.items, [])
  })
})

describe('coarse containers, fine closure', () => {
  /** The taxonomy is deliberately broad, so closure keys on kind. */
  async function worldWithKinds() {
    const dir = await mkdtemp(join(root, 'k-'))
    const store = await JsonFileStore.create(dir, { id: 'kinds', name: 'Kinds' })
    const phonon = await store.add({ container: 'locations', kind: 'planet', name: 'Phonon' })
    await store.add({ container: 'geography', kind: 'continent', name: 'Eastlandia', links: [{ to: phonon.id }] })
    await store.add({ container: 'geography', kind: 'continent', name: 'Westlandia', links: [{ to: phonon.id }] })
    await store.add({ container: 'geography', kind: 'ocean', name: 'The Sunder', links: [{ to: phonon.id }] })
    await store.setClosure(phonon.id, 'continent', 'closed', 'Two continents; the crossing is the spine of the series.')
    return { store, phonon }
  }

  it('closes continents without closing the rest of geography', async () => {
    const { store, phonon } = await worldWithKinds()

    const third = await store.add({ container: 'geography', kind: 'continent', name: 'Northlandia' })
    await assert.rejects(() => store.link(phonon.id, third.id), (e: unknown) => {
      assert.ok(e instanceof CanonViolation)
      assert.match(e.message, /closed set of continent: Eastlandia, Westlandia/)
      return true
    })

    // A river is geography too, and nothing about it was settled.
    const river = await store.add({ container: 'geography', kind: 'river', name: 'The Kell' })
    await store.link(phonon.id, river.id)
    const { related } = await store.neighborhood(phonon.id)
    assert.equal(related.river.items.length, 1)
    assert.equal(related.river.closure, 'open')
  })

  it('groups the neighbourhood by kind, not by container', async () => {
    const { store, phonon } = await worldWithKinds()
    const { related } = await store.neighborhood(phonon.id)

    assert.deepEqual(Object.keys(related).sort(), ['continent', 'ocean'])
    assert.equal(related.continent.closure, 'closed')
    assert.equal(related.ocean.closure, 'open')
  })

  it('checks a retype into a closed kind, even within the same container', async () => {
    const { store, phonon } = await worldWithKinds()
    const island = await store.add({
      container: 'geography',
      kind: 'island',
      name: 'Northlandia',
      links: [{ to: phonon.id }],
    })

    // Same container, so nothing moves on disk - but it would become a third
    // continent, and that is the claim being refused.
    await assert.rejects(() => store.move(island.id, 'geography', 'continent'), CanonViolation)
    assert.equal((await store.get(island.id))!.kind, 'island')
  })

  it('still keys on container for items with no kind', async () => {
    const { store, planet } = await phonon()
    const { related } = await store.neighborhood(planet.id)
    assert.equal(related.continent.closure, 'closed')
  })
})

describe('a world that grows', () => {
  it('leaves sets open by default, so accretion is the normal case', async () => {
    const { store, east } = await phonon()
    const kell = await store.add({ container: 'country', name: 'Kell', links: [{ to: east.id }] })
    await store.add({ container: 'religion', name: 'The Ashfaith', links: [{ to: kell.id }] })
    await store.add({ container: 'religion', name: 'The Sunder Rite', links: [{ to: kell.id }] })

    // Months later, a minor cult nobody had thought of. No ceremony required.
    const cult = await store.add({ container: 'religion', name: 'The Quiet Hand', links: [{ to: kell.id }] })

    const { related } = await store.neighborhood(kell.id)
    assert.equal(related.religion.closure, 'open')
    assert.equal(related.religion.items.length, 3)
    assert.ok(related.religion.items.some((i) => i.id === cult.id))
  })

  it('tells an open set apart from a complete one in words, not by counting', async () => {
    const { store, east } = await phonon()
    const kell = await store.add({ container: 'country', name: 'Kell', links: [{ to: east.id }] })
    await store.add({ container: 'religion', name: 'The Ashfaith', links: [{ to: kell.id }] })
    const text = renderBrief(await store.neighborhood(kell.id))

    assert.match(text, /may have more of type religion than are recorded here/)
    assert.match(text, /do not contradict what is listed/)
  })

  it('refuses to close a set without a reason', async () => {
    const { store, planet } = await phonon()
    await assert.rejects(() => store.setClosure(planet.id, 'moon', 'closed'), /requires a reason/)
  })

  it('carries the reason into the refusal, and names the way out', async () => {
    const { store, planet } = await phonon()
    const north = await store.add({ container: 'continent', name: 'Northlandia' })

    await assert.rejects(() => store.link(planet.id, north.id), (e: unknown) => {
      assert.ok(e instanceof CanonViolation)
      assert.match(e.message, /Why it was closed: The two-continent geography is structural/)
      assert.match(e.message, /Reopen it deliberately/)
      assert.match(e.message, new RegExp(`sb set-closure ${planet.id} continent open`))
      return true
    })
  })

  it('reopens cheaply, and keeps the record of what was once settled', async () => {
    const { store, planet } = await phonon()
    const north = await store.add({ container: 'continent', name: 'Northlandia' })

    await store.setClosure(planet.id, 'continent', 'open', 'Book 3 needs a polar landmass; two was too tidy.')
    await store.link(planet.id, north.id)

    const { related } = await store.neighborhood(planet.id)
    assert.equal(related.continent.closure, 'open')
    assert.equal(related.continent.items.length, 3)
    // The reopening is itself a recorded decision, not an erasure.
    assert.match(related.continent.closureNote!, /Book 3 needs a polar landmass/)
  })

  it('does not mistake a kind-keyed closure for an empty set', async () => {
    const dir = await mkdtemp(join(root, 'v-'))
    const store = await JsonFileStore.create(dir, { id: 'vk', name: 'VK' })
    const planet = await store.add({ container: 'locations', kind: 'planet', name: 'Phonon' })
    await store.add({ container: 'geography', kind: 'continent', name: 'Eastlandia', links: [{ to: planet.id }] })
    await store.setClosure(planet.id, 'continent', 'closed', 'Structural.')

    // The tag's type is 'geography'; the closure key is 'continent'. Comparing
    // the two directly would report a closed set with no members.
    assert.deepEqual(await validate(store), [])
  })

  it('warns about a closed set with no reason, however it got there', async () => {
    const { store, dir, planet } = await phonon()
    const path = join(dir, 'store', 'planet.json')
    const file = JSON.parse(await readFile(path, 'utf8')) as ContainerFile
    file.items.find((i) => i.id === planet.id)!.closure = { continent: { state: 'closed' } }
    await writeFile(path, JSON.stringify(file, null, 2))

    const issues = await validate(store)
    assert.ok(issues.some((i) => i.severity === 'warning' && /no reason recorded/.test(i.message)))
  })
})

describe('edges', () => {
  it('writes both halves of a link and removes both on unlink', async () => {
    const { store, planet, east } = await phonon()
    assert.deepEqual((await store.get(east.id))!.tags, [{ type: 'planet', relatedTo: planet.id }])

    await store.unlink(planet.id, east.id)
    assert.equal((await store.get(east.id))!.tags.length, 0)
    assert.equal((await store.get(planet.id))!.tags.length, 1)
  })

  it('records roles so same-typed relations stay distinguishable', async () => {
    const { store } = await phonon()
    const a = await store.add({ container: 'country', name: 'Karn' })
    const b = await store.add({ container: 'country', name: 'Vesh' })
    await store.link(a.id, b.id, { a: 'at war with', b: 'occupied by' })

    assert.equal((await store.get(a.id))!.tags[0].role, 'at war with')
    assert.equal((await store.get(b.id))!.tags[0].role, 'occupied by')
  })

  it('drops every reciprocal tag when an item is removed', async () => {
    const { store, planet, east } = await phonon()
    await store.remove(east.id)
    assert.equal((await store.get(planet.id))!.tags.length, 1)
    assert.equal(await store.get(east.id), null)
  })
})

describe('one-pass read', () => {
  it('returns the whole neighbourhood grouped by type', async () => {
    const { store, east } = await phonon()
    const country = await store.add({ container: 'country', name: 'Kell', links: [{ to: east.id }] })
    const city = await store.add({ container: 'city', name: 'Dol', links: [{ to: country.id }] })
    await store.add({ container: 'religion', name: 'The Ashfaith', links: [{ to: country.id }] })
    await store.setClosure(country.id, 'city', 'closed', 'Kell is a one-city country by design.')

    const { related } = await store.neighborhood(country.id)
    assert.deepEqual(Object.keys(related).sort(), ['city', 'continent', 'religion'])
    assert.equal(related.city.items[0].id, city.id)
    assert.equal(related.city.closure, 'closed')
    assert.equal(related.continent.closure, 'open')
  })

  it('states completeness in words a model cannot misread as a list-so-far', async () => {
    const { store, planet } = await phonon()
    const text = renderBrief(await store.neighborhood(planet.id))
    assert.match(text, /COMPLETE\. Phonon has exactly 2 of type continent/)
    assert.match(text, /Do not introduce another/)
    assert.match(text, /Eastlandia/)
    assert.match(text, /Westlandia/)
  })
})

describe('universe isolation', () => {
  it('cannot see or reach items in another universe', async () => {
    await JsonFileStore.create(join(root, 'alpha'), { id: 'alpha', name: 'Alpha' })
    await JsonFileStore.create(join(root, 'beta'), { id: 'beta', name: 'Beta' })

    const alpha = await openUniverse('alpha', root)
    const beta = await openUniverse('beta', root)
    const secret = await alpha.add({ container: 'planet', name: 'Phonon' })

    assert.equal(await beta.get(secret.id), null)
    assert.deepEqual(await beta.list(), [])
    assert.deepEqual(await beta.find('Phonon'), [])
    await assert.rejects(() => beta.link(secret.id, secret.id))
  })

  it('lists only directories that carry a manifest', async () => {
    await mkdir(join(root, 'not-a-universe'), { recursive: true })
    const names = await listUniverses(root)
    assert.ok(names.includes('alpha'))
    assert.ok(names.includes('beta'))
    assert.ok(!names.includes('not-a-universe'))
  })

  it('refuses to open a universe that does not exist', async () => {
    await assert.rejects(() => openUniverse('nowhere', root), /No universe "nowhere"/)
  })
})

describe('the container catalog', () => {
  it('carries a home for celestial bodies', () => {
    const cosmology = containerType('cosmology')
    assert.ok(cosmology, 'cosmology is in the catalog')
    assert.ok(cosmology.kinds?.includes('planet'))
    assert.ok(cosmology.kinds?.includes('moon'))
  })

  it('uses keys the store will accept as file names', () => {
    // A key that fails this becomes an unwritable container path, and the
    // failure would only surface the first time someone filed something there.
    for (const type of CONTAINER_TYPES) {
      assert.match(type.key, /^[a-z0-9][a-z0-9-]*$/, `${type.key} is not a valid container name`)
      assert.ok(type.label.trim() && type.singular.trim() && type.description.trim(), type.key)
    }
  })

  it('has no duplicate keys or labels', () => {
    const keys = CONTAINER_TYPES.map((c) => c.key)
    const labels = CONTAINER_TYPES.map((c) => c.label)
    assert.equal(new Set(keys).size, keys.length)
    assert.equal(new Set(labels).size, labels.length)
  })

  it('marks exactly one container as narrative', () => {
    const narrative = CONTAINER_TYPES.filter((c) => c.narrative).map((c) => c.key)
    assert.deepEqual(narrative, ['tales'])
  })
})

describe('universe manifest', () => {
  it('defaults the canon span to 1000 years and keeps blanks blank', async () => {
    const store = await createUniverse('spec-defaults', { name: 'Exoria' }, root)
    const m = await store.manifest()

    assert.equal(m.name, 'Exoria')
    assert.equal(m.totalYears, 1000)
    // Saving is not generation: an unfilled field stays unfilled.
    assert.equal(m.tone, undefined)
    assert.equal(m.genres, undefined)
  })

  it('carries a pronunciation for the name of the world itself', async () => {
    const store = await createUniverse(
      'spec-said',
      { name: 'Exoria', pronunciation: 'ex-OR-ee-uh' },
      root,
    )
    assert.equal((await store.manifest()).pronunciation, 'ex-OR-ee-uh')
    assert.match(await renderUniverseBrief(store), /Exoria \(said "ex-OR-ee-uh"\)/)
  })

  it('slugifies a name into a directory-safe id', () => {
    assert.equal(toUniverseId('The Ashfall Cycle'), 'the-ashfall-cycle')
    assert.equal(toUniverseId('  Farion V!! '), 'farion-v')
  })

  it('refuses a duplicate universe', async () => {
    await createUniverse('spec-dupe', { name: 'Once' }, root)
    await assert.rejects(() => createUniverse('spec-dupe', { name: 'Twice' }, root), /already exists/)
  })

  it('states the canon span, and stays silent about fields left empty', async () => {
    const store = await createUniverse(
      'spec-brief',
      {
        name: 'Exoria',
        totalYears: 400,
        genres: ['space opera'],
        themes: ['the quest to recover lost knowledge'],
        naturalLaws: 'Faster-than-light travel exists, but only along fixed ancient corridors.',
      },
      root,
    )
    const text = await renderUniverseBrief(store)

    assert.match(text, /Canon spans Year 0 to Year 400/)
    assert.doesNotMatch(text, /said/)
    assert.match(text, /Genre: space opera/)
    assert.match(text, /NATURAL LAWS: Faster-than-light/)
    // An empty tone is silence, not an invitation to pick one.
    assert.doesNotMatch(text, /Tone:/)
    assert.doesNotMatch(text, /CULTURES:/)
  })
})

describe('stubs', () => {
  it('is a third state: not absent, not described', async () => {
    const { store } = await phonon()
    const parth = await store.add({ container: 'locations', name: 'Parth', stub: true })

    assert.equal(parth.stub, true)
    assert.equal(parth.summary, undefined)
    // The name is committed, so a later mention resolves rather than looking new.
    assert.equal((await store.find('Parth')).length, 1)
  })

  it('says in the brief what may and may not be said about it', async () => {
    const { store } = await phonon()
    const parth = await store.add({ container: 'locations', name: 'Parth', stub: true })
    const text = renderBrief(await store.neighborhood(parth.id))

    assert.match(text, /STUB/)
    assert.match(text, /You may refer to it/)
    assert.match(text, /may not state anything about it/)
  })

  it('is marked wherever it appears in another neighbourhood', async () => {
    const { store, east } = await phonon()
    await store.add({ container: 'locations', name: 'Parth', stub: true, links: [{ to: east.id }] })

    const text = renderBrief(await store.neighborhood(east.id))
    assert.match(text, /Parth \[\w+\] \(stub\)/)
  })

  it('stops being a stub once it is written', async () => {
    const { store } = await phonon()
    const parth = await store.add({ container: 'locations', name: 'Parth', stub: true })
    const written = await store.update(parth.id, { stub: undefined, summary: 'A port city.' })

    assert.equal(written.stub, undefined)
    assert.doesNotMatch(renderBrief(await store.neighborhood(parth.id)), /STUB/)
  })
})

describe('validate', () => {
  it('catches a one-sided edge left by a hand edit', async () => {
    const { store, dir, planet, east } = await phonon()
    const path = join(dir, 'store', 'continent.json')
    const file = JSON.parse(await readFile(path, 'utf8')) as ContainerFile
    file.items.find((i) => i.id === east.id)!.tags = []
    await writeFile(path, JSON.stringify(file, null, 2))

    const issues = await validate(store)
    const errors = issues.filter((i) => i.severity === 'error')
    assert.equal(errors.length, 1)
    assert.match(errors[0].message, /One-sided edge/)
    assert.equal(errors[0].itemId, planet.id)
  })

  it('is clean for a well-formed store', async () => {
    const { store } = await phonon()
    assert.deepEqual(await validate(store), [])
  })
})
