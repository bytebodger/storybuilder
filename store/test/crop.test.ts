import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  boxOf,
  cropSvg,
  enclosure,
  gridSampler,
  growToShore,
  pad,
  relabelCoordinates,
  fitVignette,
} from '../src/import/crop.ts'

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

describe('coordinate labels on a cropped frame', () => {
  /** Azgaar writes meridians along the top (y=7) and parallels down the left (x=15). */
  const LABELLED = [
    '<svg width="1000" height="1000">',
    '<g id="coordinateLabels" style="font:12px monospace">',
    '<text x="200" y="7">120°W</text>',
    '<text x="600" y="7">30°E</text>',
    '<text x="900" y="7">90°E</text>',
    '<text x="15" y="300">60°N</text>',
    '<text x="15" y="700">30°S</text>',
    '</g></svg>',
  ].join('')

  const labelsIn = (svg: string) =>
    [...svg.matchAll(/<text\b([^>]*)>([^<]*)<\/text>/g)].map((m) => ({
      x: Number(/x="([-\d.]+)"/.exec(m[1])?.[1]),
      y: Number(/y="([-\d.]+)"/.exec(m[1])?.[1]),
      text: m[2],
    }))

  it('brings a meridian label down to the top of the frame', () => {
    const out = relabelCoordinates(LABELLED, { x0: 500, y0: 400, x1: 800, y1: 600 })
    const [label] = labelsIn(out)
    assert.equal(label.text, '30°E')
    assert.equal(label.x, 600, 'it stays on its own line')
    assert.ok(label.y > 400 && label.y < 420, `and sits just inside the top edge: ${label.y}`)
  })

  it('brings a parallel label across to the left of the frame', () => {
    // This frame keeps a meridian too, so pick the one being tested.
    const out = relabelCoordinates(LABELLED, { x0: 500, y0: 200, x1: 800, y1: 400 })
    const label = labelsIn(out).find((l) => l.text === '60°N')!
    assert.ok(label, 'the parallel survived')
    assert.equal(label.y, 300, 'it stays on its own line')
    assert.ok(label.x > 500 && label.x < 540, `and sits just inside the left edge: ${label.x}`)
  })

  it('drops labels whose lines are not in the frame', () => {
    const out = relabelCoordinates(LABELLED, { x0: 500, y0: 400, x1: 800, y1: 600 })
    const texts = labelsIn(out).map((l) => l.text)
    // 120°W and 90°E are outside horizontally; 60°N and 30°S vertically.
    assert.deepEqual(texts, ['30°E'])
  })

  it('keeps every label when the frame is the whole map', () => {
    const out = relabelCoordinates(LABELLED, { x0: 0, y0: 0, x1: 1000, y1: 1000 })
    assert.equal(labelsIn(out).length, 5)
  })

  it('shows the degrees the generator worked out, not ones it recomputed', () => {
    const out = relabelCoordinates(LABELLED, { x0: 0, y0: 0, x1: 1000, y1: 1000 })
    assert.deepEqual(labelsIn(out).map((l) => l.text), ['120°W', '30°E', '90°E', '60°N', '30°S'])
  })

  it('leaves a map with no coordinate layer alone', () => {
    const bare = '<svg width="10" height="10"><g id="terrain"/></svg>'
    assert.equal(relabelCoordinates(bare, { x0: 0, y0: 0, x1: 10, y1: 10 }), bare)
  })
})

describe('labels against the edge of a frame', () => {
  const EDGY = [
    '<svg width="1000" height="1000"><g id="coordinateLabels">',
    '<text x="500" y="7">30°E</text>',
    '<text x="15" y="402">60°N</text>',
    '</g></svg>',
  ].join('')
  const at = (svg: string, text: string) => {
    const m = new RegExp(`<text\\b([^>]*)>${text}</text>`).exec(svg)!
    return { x: Number(/x="([-\d.]+)"/.exec(m[1])![1]), y: Number(/y="([-\d.]+)"/.exec(m[1])![1]) }
  }

  it('nudges a parallel inside when its line hugs the top edge', () => {
    // The line is 2px below the frame's top; centred there, half the text
    // would be cut off.
    const out = relabelCoordinates(EDGY, { x0: 100, y0: 400, x1: 900, y1: 900 })
    const label = at(out, '60°N')
    assert.ok(label.y >= 406, `moved inside the frame: ${label.y}`)
    assert.ok(label.y < 420, 'but still reads as belonging to its line')
  })

  it('nudges a meridian inside when its line hugs the side', () => {
    const out = relabelCoordinates(EDGY, { x0: 495, y0: 0, x1: 900, y1: 900 })
    const label = at(out, '30°E')
    assert.ok(label.x > 500, `moved inside the frame: ${label.x}`)
  })

  it('leaves a label alone when its line is well inside', () => {
    const out = relabelCoordinates(EDGY, { x0: 100, y0: 100, x1: 900, y1: 900 })
    assert.equal(at(out, '30°E').x, 500)
    assert.equal(at(out, '60°N').y, 402)
  })
})

describe('the vignette, whose geometry is a share of the viewport', () => {
  const VIGNETTED = [
    '<svg width="1000" height="1000">',
    '<defs><mask id="vignette-mask">',
    '<rect x="0" y="0" width="100%" height="100%" fill="white"/>',
    '<rect id="vignette-rect" fill="black" x="0.3%" y="0.4%" width="99.6%" height="99.2%" rx="5%" ry="5%" filter="blur(20px)"/>',
    '</mask></defs>',
    '<g id="terrain"><path d="M0,0"/></g>',
    '<g id="vignette" mask="url(#vignette-mask)" opacity="0.3" fill="#000000">',
    '<rect x="0" y="0" width="100%" height="100%"/>',
    '</g></svg>',
  ].join('')

  it('is taken off by default, being a flourish for a whole map', () => {
    const out = fitVignette(VIGNETTED, { x0: 100, y0: 500, x1: 900, y1: 900 })
    assert.equal(/<g id="vignette"/.test(out), false)
    // Everything else survives untouched.
    assert.match(out, /<g id="terrain">/)
    assert.match(out, /vignette-mask/, 'the mask definition is harmless and stays')
  })

  it('is refitted to the frame when asked for, in user space', () => {
    const out = fitVignette(VIGNETTED, { x0: 100, y0: 500, x1: 900, y1: 900 }, true)
    const layer = /<g id="vignette"[\s\S]*?<\/g>/.exec(out)![0]

    // The overlay must start where the view starts, not at the canvas origin.
    assert.match(layer, /x="100"/)
    assert.match(layer, /y="500"/)
    assert.match(layer, /width="800"/)
    assert.match(layer, /height="400"/)
    assert.equal(/100%/.test(layer), false, 'no percentage geometry survives')
  })

  it('moves the mask with it, so the soft edge lands on the overlay', () => {
    const out = fitVignette(VIGNETTED, { x0: 100, y0: 500, x1: 900, y1: 900 }, true)
    const mask = /<mask id="vignette-mask">[\s\S]*?<\/mask>/.exec(out)![0]

    assert.match(mask, /<rect x="100" y="500" width="800" height="400" fill="white"\/>/)
    assert.equal(/"[\d.]+%"/.test(mask), false, 'the mask is in user space too')
    // The dark rect sits just inside the frame, as it did inside the canvas.
    const inner = /<rect id="vignette-rect"[^>]*\/>/.exec(mask)![0]
    assert.match(inner, /x="103\.2"/)
    assert.match(inner, /width="793\.6"/)
  })

  it('leaves a map with no vignette alone', () => {
    const bare = '<svg><g id="terrain"/></svg>'
    assert.equal(fitVignette(bare, { x0: 0, y0: 0, x1: 10, y1: 10 }), bare)
  })
})

describe('coordinate labels paint last', () => {
  const LAYERED = [
    '<svg width="1000" height="1000">',
    '<g id="coordinates"><g id="coordinateGrid"><path d="M0,0"/></g>',
    '<g id="coordinateLabels"><text x="500" y="7">30°E</text></g>',
    '</g>',
    '<g id="terrain"><path d="M1,1"/></g>',
    '<g id="borders"><path d="M2,2"/></g>',
    '</svg>',
  ].join('')

  it('lifts the group to the end, so nothing is drawn over it', () => {
    const out = relabelCoordinates(LAYERED, { x0: 100, y0: 0, x1: 900, y1: 500 })
    assert.ok(
      out.indexOf('coordinateLabels') > out.indexOf('id="borders"'),
      'the labels come after every other layer',
    )
    assert.match(out, /<g id="coordinateLabels">[\s\S]*<\/g><\/svg>$/)
  })

  it('leaves it where it was in the layer stack only once', () => {
    const out = relabelCoordinates(LAYERED, { x0: 100, y0: 0, x1: 900, y1: 500 })
    assert.equal(out.match(/id="coordinateLabels"/g)?.length, 1)
    // The grid it used to sit beside is untouched.
    assert.match(out, /<g id="coordinateGrid">/)
  })

  it('adds no empty group when every label falls outside the frame', () => {
    const out = relabelCoordinates(LAYERED, { x0: 0, y0: 600, x1: 100, y1: 900 })
    assert.equal(/coordinateLabels/.test(out), false)
    assert.match(out, /<g id="terrain">/)
  })
})
