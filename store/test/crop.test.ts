import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { boxOf, cropSvg, growToShore, pad } from '../src/import/crop.ts'

const canvas = { width: 1000, height: 1000 }
const SVG = '<?xml version="1.0"?><svg id="fantasyMap" width="1000" height="1000" version="1.1"><g/></svg>'

describe('framing a region', () => {
  it('bounds a set of points', () => {
    assert.deepEqual(boxOf([{ x: 10, y: 40 }, { x: 30, y: 20 }]), { x0: 10, y0: 20, x1: 30, y1: 40 })
  })

  it('pads by a share of the longer side, so a thin box is not swamped', () => {
    const padded = pad({ x0: 100, y0: 100, x1: 300, y1: 150 }, 0.1, canvas)
    assert.deepEqual(padded, { x0: 80, y0: 80, x1: 320, y1: 170 })
  })

  it('never pads past the edge of the map', () => {
    assert.deepEqual(pad({ x0: 10, y0: 10, x1: 990, y1: 990 }, 0.5, canvas), {
      x0: 0, y0: 0, x1: 1000, y1: 1000,
    })
  })
})

describe('growing a frame out to the shore', () => {
  /** Water in the middle, land beyond x=700 and above y=300. */
  const cells = []
  for (let x = 0; x < 1000; x += 10) {
    for (let y = 0; y < 1000; y += 10) {
      cells.push({ x, y, land: x > 700 || y < 300 })
    }
  }

  it('stops when a side meets land', () => {
    const grown = growToShore({ x0: 480, y0: 600, x1: 520, y1: 620 }, cells, canvas)
    assert.ok(grown.x1 > 660 && grown.x1 <= 760, `east edge reached the coast: ${grown.x1}`)
    assert.ok(grown.y0 < 380 && grown.y0 >= 250, `north edge reached the coast: ${grown.y0}`)
  })

  it('runs to the map edge where there is no shore', () => {
    const grown = growToShore({ x0: 480, y0: 600, x1: 520, y1: 620 }, cells, canvas)
    assert.equal(grown.x0, 0, 'nothing but water to the west')
    assert.equal(grown.y1, 1000, 'nothing but water to the south')
  })

  it('is not stopped by a lone island', () => {
    // One land cell in open water must not read as a coastline.
    const withIsland = cells.map((c) => (c.x === 300 && c.y === 610 ? { ...c, land: true } : c))
    const grown = growToShore({ x0: 480, y0: 600, x1: 520, y1: 620 }, withIsland, canvas)
    assert.equal(grown.x0, 0)
  })
})

describe('applying the frame to the file', () => {
  it('sets a viewBox and resizes, leaving the drawing untouched', () => {
    const out = cropSvg(SVG, { x0: 100, y0: 200, x1: 400, y1: 500 })
    assert.match(out, /viewBox="100 200 300 300"/)
    assert.match(out, /width="300"/)
    assert.match(out, /height="300"/)
    // Every element survives: this is a window, not an edit.
    assert.match(out, /<g\/>/)
    assert.match(out, /id="fantasyMap"/)
  })

  it('replaces an existing view rather than adding a second', () => {
    const once = cropSvg(SVG, { x0: 0, y0: 0, x1: 500, y1: 500 })
    const twice = cropSvg(once, { x0: 10, y0: 10, x1: 110, y1: 110 })
    assert.equal(twice.match(/viewBox=/g)?.length, 1)
    assert.equal(twice.match(/\swidth="/g)?.length, 1)
    assert.match(twice, /viewBox="10 10 100 100"/)
  })

  it('keeps the xml declaration ahead of the element', () => {
    assert.match(cropSvg(SVG, { x0: 0, y0: 0, x1: 10, y1: 10 }), /^<\?xml/)
  })

  it('refuses a box with no area', () => {
    assert.throws(() => cropSvg(SVG, { x0: 100, y0: 100, x1: 100, y1: 200 }), /needs a box with area/)
  })

  it('refuses a file that is not an svg', () => {
    assert.throws(() => cropSvg('<html></html>', { x0: 0, y0: 0, x1: 10, y1: 10 }), /No <svg>/)
  })
})
