import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { frameFromAttribute, frameToAttribute, mapSourcePath } from '../src/import/media.ts'
import { buildImportPlan } from '../src/import/azgaar.ts'
import { join } from 'node:path'

describe('a frame stored on an article', () => {
  it('is written as the viewBox it will become', () => {
    assert.equal(frameToAttribute({ x0: 1053, y0: 589, x1: 2177, y1: 1279 }), '1053 589 1124 690')
  })

  it('round-trips', () => {
    const box = { x0: 100, y0: 200, x1: 400, y1: 500 }
    assert.deepEqual(frameFromAttribute(frameToAttribute(box)), box)
  })

  it('refuses anything that is not a frame', () => {
    for (const bad of [null, undefined, 42, '', 'not a frame', '1 2 3', '1 2 0 5', '1 2 -3 4']) {
      assert.equal(frameFromAttribute(bad), null, String(bad))
    }
  })

  it('keeps the map inside the universe, so a universe can be moved whole', () => {
    // Path separators differ by platform, so compare with join rather than a pattern.
    assert.ok(mapSourcePath(join('worlds', 'watia')).endsWith(join('watia', 'media', 'map.svg')))
  })
})

describe('frames come out of the import', () => {
  const SVG = '<svg><g id="textPaths"/><g id="labels-added"/></svg>'
  const JSON_EXPORT = {
    info: { mapName: 'T', width: 1000, height: 1000 },
    settings: { populationRate: 1000 },
    mapCoordinates: { latN: 90, latS: -90, lonW: -180, lonE: 180 },
    pack: {
      states: [
        { i: 0, name: 'Neutrals' },
        { i: 1, name: 'Whitmere', form: 'Monarchy', neighbors: [] },
      ],
      provinces: [],
      burgs: [{ i: 1, name: 'Blandbury', cell: 10, capital: 1, population: 3, state: 1 }],
      cells: [
        { i: 10, p: [100, 100], state: 1 },
        { i: 11, p: [300, 400], state: 1 },
      ],
      cultures: [],
      religions: [],
      zones: [],
      routes: [],
      rivers: [],
      features: [],
      markers: [],
    },
  }
  const plan = buildImportPlan(JSON_EXPORT, SVG, { tier: 1 })
  const find = (name: string) => plan.candidates.find((c) => c.name === name)!

  it('gives every country a window onto the map', () => {
    const frame = find('Whitmere').attributes!.mapFrame
    assert.equal(typeof frame, 'string')
    const box = frameFromAttribute(frame)!
    // The country spans (100,100) to (300,400); the frame pads that and stays
    // on the canvas.
    assert.ok(box.x0 < 100 && box.x0 >= 0)
    assert.ok(box.x1 > 300 && box.x1 <= 1000)
    assert.ok(box.y1 > 400)
  })

  it('gives one to nothing else, since only a country has an extent here', () => {
    assert.equal(find('Blandbury').attributes?.mapFrame, undefined)
  })
})

describe('frames for things that are not countries', () => {
  const SVG = [
    '<svg><g id="textPaths">',
    '<path id="textPath_addedLabel1" d="M100,100L300,120"/>',
    '<path id="textPath_addedLabel2" d="M600,600L800,600"/>',
    '</g><g id="labels-added">',
    '<text id="addedLabel1" data-label-type="added"><textPath xlink:href="#textPath_addedLabel1">Arnborne Mountains</textPath></text>',
    '<text id="addedLabel2" data-label-type="added"><textPath xlink:href="#textPath_addedLabel2">Sontersea</textPath></text>',
    '</g></svg>',
  ].join('')

  /** Land in the top half, water below: the two labels sit one in each. */
  const heights: number[] = []
  for (let row = 0; row < 100; row++) for (let col = 0; col < 100; col++) heights.push(row < 50 ? 40 : 0)

  const EXPORT = {
    info: { mapName: 'T', width: 1000, height: 1000 },
    settings: { populationRate: 1000 },
    mapCoordinates: { latN: 90, latS: -90, lonW: -180, lonE: 180 },
    grid: { cells: heights.map((h) => ({ h })), spacing: 10, cellsX: 100 },
    pack: {
      states: [{ i: 0, name: 'Neutrals' }],
      provinces: [],
      burgs: [],
      cells: [
        { i: 1, p: [200, 700], f: 9 },
        { i: 2, p: [400, 760], f: 9 },
        { i: 3, p: [700, 300], f: 4 },
      ],
      cultures: [],
      religions: [],
      zones: [],
      routes: [],
      rivers: [{ i: 1, name: 'Conghambe', cells: [1, 2], parent: 1 }],
      // A feature records how many cells it has, not which ones.
      features: [{ i: 4, name: 'Harden', type: 'lake', cells: 1 }],
      markers: [],
    },
  }
  const plan = buildImportPlan(EXPORT, SVG, { tier: 3 })
  const frameOf = (name: string) =>
    frameFromAttribute(plan.candidates.find((c) => c.name === name)?.attributes?.mapFrame)

  it('frames a river along its course', () => {
    const box = frameOf('Conghambe')!
    assert.ok(box, 'a river gets a frame')
    // Its cells run from (200,700) to (400,760); the frame contains both.
    assert.ok(box.x0 <= 200 && box.x1 >= 400)
    assert.ok(box.y0 <= 700 && box.y1 >= 760)
  })

  it('frames a lake, whose cells have to be found the other way round', () => {
    // feature.cells is the count 1, so the extent comes from the cell claiming
    // the feature - here (700,300).
    const box = frameOf('Harden')!
    assert.ok(box, 'a lake gets a frame')
    assert.ok(box.x0 <= 700 && box.x1 >= 700)
    assert.ok(box.y0 <= 300 && box.y1 >= 300)
  })

  it('frames a range on its own label curve', () => {
    // Over land, so the curve is the shape: no growing outward.
    const box = frameOf('Arnborne Mountains')!
    assert.ok(box.x0 <= 100 && box.x1 >= 300)
    assert.ok(box.x1 - box.x0 < 500, 'held close to the range itself')
  })

  it('frames a sea by reaching for its shores instead', () => {
    // Over water, so the frame grows until land rings it - much wider than the
    // label, and reaching up into the land above.
    const range = frameOf('Arnborne Mountains')!
    const sea = frameOf('Sontersea')!
    assert.ok(sea.y0 < 500, 'it reached up to the coast')
    assert.ok(sea.x1 - sea.x0 > range.x1 - range.x0, 'and is wider than a label')
  })
})
