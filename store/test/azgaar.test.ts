import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readAddedLabels, guessGeographyKind } from '../src/import/azgaar-svg.ts'
import { buildImportPlan } from '../src/import/azgaar.ts'

/** The shape Azgaar writes: labels bound to curves, with an optional nudge. */
const SVG = `<svg>
<g id="textPaths">
  <path id="textPath_addedLabel1" d="M100,200C110,210,120,220,140,240"/>
  <path id="textPath_addedLabel2" d="M400,400L500,400"/>
</g>
<g id="labels-added" data-group="added">
  <text id="addedLabel1" data-label-type="added" data-label-shape="path"><textPath startOffset="50%" xlink:href="#textPath_addedLabel1">Arnborne Mountains</textPath></text>
  <text id="addedLabel2" data-label-type="added" transform="translate(10, -20)" data-label-shape="path"><textPath startOffset="50%" xlink:href="#textPath_addedLabel2">Sontersea</textPath></text>
</g></svg>`

/** Two states, two provinces named after their capitals, three burgs. */
const JSON_EXPORT = {
  info: { mapName: 'Test', width: 1000, height: 1000 },
  settings: { populationRate: 1000 },
  pack: {
    states: [
      { i: 0, name: 'Neutrals' },
      { i: 1, name: 'Whitmere', form: 'Monarchy', area: 500, urban: 2, rural: 8 },
      { i: 2, name: 'Seedon', form: 'Republic', area: 300, urban: 1, rural: 4 },
    ],
    // Azgaar names a province after its capital burg.
    provinces: [{ i: 1, name: 'Blandbury', fullName: 'Blandbury County', state: 1 }],
    burgs: [
      { i: 1, name: 'Blandbury', cell: 10, capital: 1, population: 3.5, state: 1 },
      { i: 2, name: 'Harborough', cell: 11, port: 3, population: 1.2, state: 1 },
      { i: 3, name: 'Tinyham', cell: 12, population: 0.2, state: 1 },
    ],
    cells: [
      { i: 10, p: [120, 220], state: 1, province: 1 },
      { i: 11, p: [130, 230], state: 1, province: 1 },
      { i: 12, p: [140, 240], state: 1, province: 1 },
    ],
    cultures: [{ i: 0, name: 'Wildlands' }, { i: 1, name: 'Dunsmouth' }],
    religions: [{ i: 0, name: 'No religion' }, { i: 1, name: 'Old Deities' }],
    zones: [{ i: 0, name: 'Granishan Crusade', type: 'Crusade' }],
    routes: [{ i: 0, name: 'Jade road' }, { i: 1, name: 'Unnamed route segment' }],
    rivers: [{ i: 1, name: 'Horsbumeby' }],
    features: [{ i: 7, name: 'Harden', type: 'lake', subtype: 'freshwater' }],
    markers: [{ i: 0, name: 'Manches Volcano', type: 'volcanoes', cell: 10, note: 'Dormant volcano.' }],
  },
}

const plan = (tier: 0 | 1 | 2 | 3) => buildImportPlan(JSON_EXPORT, SVG, { tier })
const names = (tier: 0 | 1 | 2 | 3) => plan(tier).candidates.map((c) => c.name)

describe('labels the author added by hand', () => {
  it('reads them out of the SVG, which is the only file that has them', () => {
    const labels = readAddedLabels(SVG)
    assert.deepEqual(labels.map((l) => l.name), ['Arnborne Mountains', 'Sontersea'])
  })

  it('locates each one at the midpoint of the curve it is set on', () => {
    const [arnborne] = readAddedLabels(SVG)
    assert.equal(Math.round(arnborne.x), 118)
    assert.equal(Math.round(arnborne.y), 218)
  })

  it('applies the nudge, because that is where the reader sees it', () => {
    const sontersea = readAddedLabels(SVG)[1]
    assert.equal(sontersea.x, 450 + 10)
    assert.equal(sontersea.y, 400 - 20)
  })

  it('comes in at every tier, including the smallest', () => {
    for (const tier of [0, 1, 2, 3] as const) {
      assert.ok(names(tier).includes('Arnborne Mountains'), `tier ${tier}`)
    }
  })

  it('guesses a kind from the words, and treats a -sea suffix as a sea', () => {
    assert.equal(guessGeographyKind('Arnborne Mountains'), 'mountain-range')
    assert.equal(guessGeographyKind('Strait of Arnock'), 'strait')
    assert.equal(guessGeographyKind('Sontersea'), 'sea')
    assert.equal(guessGeographyKind('The Eyrenes'), undefined)
  })

  it('warns when an SVG carries none, rather than failing quietly', () => {
    assert.match(buildImportPlan(JSON_EXPORT, '<svg></svg>', { tier: 1 }).warnings[0], /No hand-added labels/)
  })
})

describe('tiers', () => {
  it('brings in the spine at tier 1, and nothing below it', () => {
    const got = names(1)
    for (const expected of ['Whitmere', 'Seedon', 'Blandbury', 'Dunsmouth', 'Old Deities', 'Granishan Crusade', 'Jade road']) {
      assert.ok(got.includes(expected), expected)
    }
    // A non-capital settlement, a river, a lake and a marker all wait.
    for (const held of ['Harborough', 'Tinyham', 'Horsbumeby', 'Harden', 'Manches Volcano']) {
      assert.ok(!got.includes(held), held)
    }
  })

  it('adds provinces and ports at tier 2, still holding the smallest back', () => {
    const got = names(2)
    assert.ok(got.includes('Blandbury County'))
    assert.ok(got.includes('Harborough'), 'a port earns an article')
    assert.ok(!got.includes('Tinyham'), 'a hamlet under the threshold does not')
  })

  it('brings everything at tier 3', () => {
    const got = names(3)
    for (const expected of ['Tinyham', 'Horsbumeby', 'Harden', 'Manches Volcano']) {
      assert.ok(got.includes(expected), expected)
    }
  })

  it('never imports the generator placeholders', () => {
    const got = names(3)
    for (const placeholder of ['Neutrals', 'Wildlands', 'No religion', 'Unnamed route segment']) {
      assert.ok(!got.includes(placeholder), placeholder)
    }
  })

  it('reports what it found against what the tier admits', () => {
    const burgs = plan(1).counts.find((c) => c.sourceType === 'burg')!
    assert.equal(burgs.found, 3)
    assert.equal(burgs.included, 1)
  })
})

describe('a province named after its capital', () => {
  it('imports under its full name, so the two do not collide', () => {
    const got = names(2)
    assert.ok(got.includes('Blandbury County'), 'the province')
    assert.ok(got.includes('Blandbury'), 'the town')
    // One article each, not two called the same thing.
    assert.equal(got.filter((n) => n === 'Blandbury').length, 1)
  })

  it('never offers a settlement itself as its own parent', () => {
    const blandbury = plan(1).candidates.find((c) => c.name === 'Blandbury' && c.sourceType === 'burg')!
    assert.ok(!(blandbury.parentNames ?? []).includes('Blandbury'))
    assert.deepEqual(blandbury.parentNames, ['Blandbury County', 'Whitmere'])
  })

  it('offers the country when the tier left the province out', () => {
    // Tier 1 has no provinces, so the country is the parent that resolves.
    const got = new Set(names(1))
    const blandbury = plan(1).candidates.find((c) => c.sourceType === 'burg')!
    assert.equal((blandbury.parentNames ?? []).find((n) => got.has(n)), 'Whitmere')
  })
})

describe('what the generator already wrote', () => {
  it('keeps a marker note as the article summary', () => {
    const volcano = plan(3).candidates.find((c) => c.name === 'Manches Volcano')!
    assert.equal(volcano.summary, 'Dormant volcano.')
    assert.equal(volcano.container, 'geography')
    assert.equal(volcano.kind, 'volcano')
  })

  it('scales settlement population by the export rate', () => {
    const blandbury = plan(1).candidates.find((c) => c.sourceType === 'burg')!
    assert.equal(blandbury.attributes!.population, 3500)
  })

  it('routes each source to a sensible container', () => {
    const by = new Map(plan(3).candidates.map((c) => [c.name, c.container]))
    assert.equal(by.get('Whitmere'), 'locations')
    assert.equal(by.get('Dunsmouth'), 'ethnicities')
    assert.equal(by.get('Old Deities'), 'theology')
    assert.equal(by.get('Granishan Crusade'), 'history')
    assert.equal(by.get('Jade road'), 'roads')
    assert.equal(by.get('Horsbumeby'), 'geography')
  })
})
