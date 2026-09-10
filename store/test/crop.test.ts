import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { boxOf, cropSvg, enclosure, gridSampler, growToShore, pad } from '../src/import/crop.ts'

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
  /** A lake: open water in the middle, land on every side. */
  const basin = (x: number, y: number) => x < 200 || x > 800 || y < 200 || y > 800
  const middle = { x0: 480, y0: 490, x1: 520, y1: 510 }

  it('grows until land rings the frame', () => {
    const grown = growToShore(middle, basin, canvas)
    assert.equal(grown.closed, true)
    assert.match(grown.reason, /land closed/)

    const ring = enclosure(grown.box, basin)
    for (const side of ['N', 'S', 'W', 'E'] as const) {
      assert.ok(ring[side] >= 0.9, `${side} edge is shore: ${ring[side]}`)
    }
  })

  it('stops close to the shore rather than running on', () => {
    const { box } = growToShore(middle, basin, canvas)
    assert.ok(box.x0 < 220 && box.x0 > 120, `west edge sits near the coast: ${box.x0}`)
    assert.ok(box.x1 > 780 && box.x1 < 880, `east edge sits near the coast: ${box.x1}`)
  })

  it('is not stopped by a single island', () => {
    // One speck of land in open water is not a coastline. Sampling a strip
    // rather than the nearest point is what makes that true.
    const withIsland = (x: number, y: number) =>
      basin(x, y) || (x > 395 && x < 415 && y > 490 && y < 510)
    const { box } = growToShore(middle, withIsland, canvas)
    assert.ok(box.x0 < 220, `the walk carried past the island: ${box.x0}`)
  })

  it('gives up on a passage instead of swallowing the map', () => {
    // A channel: land north and south, open water east and west forever. No
    // frame around it is ever ringed by land, and the walk must say so rather
    // than growing until it has the whole world in view.
    const channel = (_x: number, y: number) => y < 480 || y > 520
    const grown = growToShore(middle, channel, canvas)

    assert.equal(grown.closed, false)
    assert.match(grown.reason, /passage|size limit/)
    assert.ok(grown.box.x1 - grown.box.x0 < canvas.width / 2, 'and stayed a close view')
  })

  it('reads the world from a regular lattice, not from scattered points', () => {
    // Heights on a 4x4 grid of 10px cells: top half land, bottom half water.
    const heights = [30, 30, 30, 30, 30, 30, 30, 30, 0, 0, 0, 0, 0, 0, 0, 0]
    const at = gridSampler(heights, { spacing: 10, cellsX: 4 })
    assert.equal(at(5, 5), true, 'top-left is land')
    assert.equal(at(35, 35), false, 'bottom-right is water')
    // Out of range reads as water rather than throwing.
    assert.equal(at(9999, 9999), false)
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
