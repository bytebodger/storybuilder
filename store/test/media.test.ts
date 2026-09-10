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
