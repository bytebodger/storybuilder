import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { linkify } from '../src/linkify.ts'
import type { Item } from '../src/types.ts'

const item = (name: string, container = 'locations', over: Partial<Item> = {}): Item => ({
  id: name.toLowerCase().replace(/\W/g, ''),
  container,
  name,
  tags: [],
  createdAt: '',
  updatedAt: '',
  ...over,
})

const world = [
  item('Eastlandia', 'geography'),
  item('Thorinflies', 'fauna'),
  item('Dol'),
  item('The Quiet Hand', 'theology'),
  item('Dawn Reavers', 'institutions'),
  item('Antin Forin, III', 'people', { stub: true, aliases: ['Antin Forin'] }),
]

const linksIn = (text: string, opts = {}) =>
  linkify(text, world, opts)
    .filter((s) => s.target)
    .map((s) => ({ text: s.text, to: s.target!.name }))

const rebuild = (text: string, opts = {}) =>
  linkify(text, world, opts)
    .map((s) => s.text)
    .join('')

describe('linking a passage', () => {
  it('links a plain mention', () => {
    assert.deepEqual(linksIn('It ranges across Eastlandia.'), [
      { text: 'Eastlandia', to: 'Eastlandia' },
    ])
  })

  it('links an inflected mention to the article that exists', () => {
    // The point of the feature: "the thorinfly" reaches "Thorinflies".
    assert.deepEqual(linksIn('A close relative is the thorinfly.'), [
      { text: 'thorinfly', to: 'Thorinflies' },
    ])
  })

  it('leaves the leading article outside the link', () => {
    const segments = linkify('Worship of the Quiet Hand persists.', world)
    const link = segments.find((s) => s.target)!
    assert.equal(link.text, 'Quiet Hand')
  })

  it('prefers the longest name, so a link is never half a name', () => {
    assert.deepEqual(linksIn('The Dawn Reavers sailed.'), [
      { text: 'Dawn Reavers', to: 'Dawn Reavers' },
    ])
  })

  it('links through an alias', () => {
    assert.deepEqual(linksIn('Domesticated by Antin Forin.'), [
      { text: 'Antin Forin', to: 'Antin Forin, III' },
    ])
  })

  it('marks a stub, so the reader knows what they are following', () => {
    const link = linkify('Domesticated by Antin Forin.', world).find((s) => s.target)!
    assert.equal(link.target!.stub, true)
    assert.equal(linkify('Bound for Dol.', world).find((s) => s.target)!.target!.stub, undefined)
  })
})

describe('what it refuses to link', () => {
  it('never links an article to itself', () => {
    assert.deepEqual(linksIn('Dol is a port. Dol has docks.', { excludeId: 'dol' }), [])
  })

  it('links only the first mention, as a wiki would', () => {
    assert.deepEqual(linksIn('Eastlandia is wide. Eastlandia is old.'), [
      { text: 'Eastlandia', to: 'Eastlandia' },
    ])
  })

  it('links every mention when asked', () => {
    assert.equal(linksIn('Eastlandia is wide. Eastlandia is old.', { once: false }).length, 2)
  })

  it('does not match inside a longer word', () => {
    assert.deepEqual(linksIn('The doldrums are calm.'), [])
  })

  it('ignores ordinary English, however an article is titled', () => {
    const noisy = [...world, item('People', 'ethnicities'), item('The', 'terminology')]
    const segments = linkify('The people of the coast.', noisy)
    assert.equal(segments.filter((s) => s.target).length, 0)
  })
})

describe('the text survives intact', () => {
  it('rebuilds exactly, whitespace and punctuation included', () => {
    const text = 'Eastlandia, and the thorinfly — bound for Dol.\n\nThe Dawn Reavers sailed.'
    assert.equal(rebuild(text), text)
  })

  it('rebuilds text with no links at all', () => {
    const text = '   Nothing here matches anything.   '
    assert.equal(rebuild(text), text)
  })

  it('handles an empty passage', () => {
    assert.deepEqual(linkify('', world), [])
  })
})
