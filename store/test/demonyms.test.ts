import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  containersWithFields,
  draftToItem,
  fieldsFor,
  itemToDraft,
  linkify,
  matchTerm,
  termExists,
  type Item,
} from '../src/index.ts'

const entry = (name: string, container: string, over: Partial<Item> = {}): Item =>
  ({ id: name.toLowerCase().replace(/\W/g, ''), container, name, tags: [], createdAt: '', updatedAt: '', ...over }) as Item

/** Where a demonym makes sense, and where it does not. */
const CARRIES = ['locations', 'geography', 'cosmology', 'ethnicities', 'institutions', 'theology']

describe('which containers ask for a demonym', () => {
  it('asks the ones where a thing has people', () => {
    for (const container of CARRIES) {
      const field = fieldsFor(container)!.find((f) => f.key === 'demonyms')
      assert.ok(field, `${container} asks for demonyms`)
      assert.equal(field.kind, 'list')
      assert.equal(field.storeAs, 'demonyms')
    }
  })

  it('leaves it off the ones where there is no such thing', () => {
    // There is no demonym for a legend, a tale or a disease.
    const others = containersWithFields().filter((c) => !CARRIES.includes(c))
    for (const container of others) {
      assert.equal(
        fieldsFor(container)!.find((f) => f.key === 'demonyms'),
        undefined,
        `${container} should not ask for a demonym`,
      )
    }
    assert.ok(others.length > CARRIES.length, 'most containers have no use for one')
  })

  it('reads the same on every spec that has it, because it is written once', () => {
    const helps = new Set(
      CARRIES.map((c) => fieldsFor(c)!.find((f) => f.key === 'demonyms')!.help),
    )
    assert.equal(helps.size, 1)
  })

  it('sits beside the name, not at the end of the form', () => {
    const labels = fieldsFor('locations')!.map((f) => f.label)
    assert.deepEqual(labels.slice(0, 3), ['Name', 'Pronunciation', 'Demonyms'])
  })
})

describe('storing a demonym', () => {
  it('goes to its own column, not into attributes', () => {
    const item = draftToItem('locations', { name: 'Kell', demonyms: 'Kellish, Kell-folk' })
    assert.deepEqual(item.demonyms, ['Kellish', 'Kell-folk'])
    assert.equal('demonyms' in (item.attributes ?? {}), false)
  })

  it('reads back into the form', () => {
    const stored = {
      ...draftToItem('locations', { name: 'Kell', demonyms: ['Kellish'] }),
      id: 'x',
      tags: [],
    } as unknown as Item
    assert.deepEqual(itemToDraft('locations', stored).demonyms, ['Kellish'])
  })
})

describe('what a demonym is for', () => {
  const world = [
    entry('The Netherlands', 'locations', { demonyms: ['Dutch', 'Netherlander'] }),
    entry('Kell', 'locations', { demonyms: ['Kellish'] }),
    entry('Dol', 'locations'),
  ]

  it('links a word that shares no letters with the article title', () => {
    // The whole point: nothing in "The Netherlands" tells a reader that "Dutch"
    // refers to it.
    const links = linkify('A Dutch carrack put in at Dol.', world)
      .filter((s) => s.target)
      .map((s) => ({ text: s.text, to: s.target!.name }))
    assert.deepEqual(links, [
      { text: 'Dutch', to: 'The Netherlands' },
      { text: 'Dol', to: 'Dol' },
    ])
  })

  it('stops a stub being raised for a people already recorded', () => {
    assert.equal(termExists('Dutch', world), true)
    assert.equal(matchTerm('Netherlanders', world)[0].via, 'demonym')
    assert.equal(termExists('Frisian', world), false)
  })

  it('never outranks something that is actually titled that', () => {
    // "Kellish" is the people of Kell and an article of its own. A reader who
    // follows it wants the people, not the port.
    const both = [...world, entry('Kellish', 'ethnicities')]
    const link = linkify('The Kellish keep the tide.', both).find((s) => s.target)!
    assert.equal(link.target!.name, 'Kellish')
    assert.equal(link.target!.container, 'ethnicities')

    const matches = matchTerm('Kellish', both)
    assert.equal(matches[0].via, 'name')
    assert.equal(matches.length, 2, 'the port is still a match, second')
  })
})
