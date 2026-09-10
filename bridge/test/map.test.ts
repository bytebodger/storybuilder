import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { forgetMaps, renderMap } from '../src/map.ts'

const SOURCE = [
  '<?xml version="1.0"?>',
  '<svg id="fantasyMap" width="2560" height="1279" version="1.1">',
  '<defs><mask id="vignette-mask">',
  '<rect x="0" y="0" width="100%" height="100%" fill="white"/>',
  '<rect id="vignette-rect" fill="black" x="0.3%" y="0.4%" width="99.6%" height="99.2%"/>',
  '</mask></defs>',
  '<g id="coordinates"><g id="coordinateLabels">',
  '<text x="1280" y="7">0</text><text x="15" y="639">0</text>',
  '</g></g>',
  '<g id="terrain"><path d="M0,0"/></g>',
  '<g id="vignette" mask="url(#vignette-mask)"><rect x="0" y="0" width="100%" height="100%"/></g>',
  '</svg>',
].join('')

let dir: string

before(async () => {
  dir = await mkdtemp(join(tmpdir(), 'sb-map-'))
  await mkdir(join(dir, 'media'), { recursive: true })
  await writeFile(join(dir, 'media', 'map.svg'), SOURCE, 'utf8')
  forgetMaps()
})
after(async () => {
  forgetMaps()
  await rm(dir, { recursive: true, force: true })
})

describe('serving a framed map', () => {
  it('returns the whole map when no frame is asked for', async () => {
    const svg = await renderMap({ universeDir: dir })
    assert.equal(svg, SOURCE, 'untouched, byte for byte')
  })

  it('narrows the view to a stored frame', async () => {
    const svg = await renderMap({ universeDir: dir, frame: '1000 400 600 500' })
    assert.match(svg, /viewBox="1000 400 600 500"/)
    assert.match(svg, /width="600"/)
    assert.match(svg, /height="500"/)
  })

  it('applies the same treatment the CLI does', async () => {
    const svg = await renderMap({ universeDir: dir, frame: '1000 400 600 500' })

    // The vignette is off, since its geometry would land in the wrong place.
    assert.equal(/<g id="vignette"/.test(svg), false)
    // The meridian at x=1280 is inside the frame and moved to its top edge.
    assert.match(svg, /<text x="1280" y="409">0<\/text>/)
    // The parallel at y=639 is inside it too, and moved to the left edge.
    assert.match(svg, /<text x="1015.3" y="639">0<\/text>/)
    assert.equal(svg.match(/<text/g)?.length, 2)
    // And what is left paints last.
    assert.match(svg, /coordinateLabels[\s\S]*<\/svg>$/)
  })

  it('ignores a frame that is not one, rather than failing', async () => {
    assert.equal(await renderMap({ universeDir: dir, frame: 'nonsense' }), SOURCE)
    assert.equal(await renderMap({ universeDir: dir, frame: null }), SOURCE)
  })

  it('gives the same answer twice, from cache the second time', async () => {
    const once = await renderMap({ universeDir: dir, frame: '100 100 200 200' })
    const twice = await renderMap({ universeDir: dir, frame: '100 100 200 200' })
    assert.equal(once, twice)
  })

  it('reads the map again once it has been rewritten', async () => {
    await renderMap({ universeDir: dir })
    await writeFile(join(dir, 'media', 'map.svg'), SOURCE.replace('terrain', 'redrawn'), 'utf8')
    forgetMaps()

    const svg = await renderMap({ universeDir: dir })
    assert.match(svg, /id="redrawn"/, 'a re-import is not served from the old copy')
    await writeFile(join(dir, 'media', 'map.svg'), SOURCE, 'utf8')
    forgetMaps()
  })

  it('fails plainly when a universe has no map', async () => {
    await assert.rejects(() => renderMap({ universeDir: join(dir, 'nowhere') }))
  })
})

describe('a frame that keeps only part of the graticule', () => {
  it('drops the lines that fall outside it', async () => {
    // x 100..300 misses the meridian at 1280; y 100..300 misses the parallel
    // at 639. Nothing is left to label.
    const svg = await renderMap({ universeDir: dir, frame: '100 100 200 200' })
    assert.equal(/coordinateLabels/.test(svg), false)
    assert.match(svg, /viewBox="100 100 200 200"/)
  })
})
