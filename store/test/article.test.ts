import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { fieldsFor, containersWithFields } from '../src/fields.ts'
import { FAUNA_FIELDS } from '../src/fauna-fields.ts'
import { draftToItem, itemToDraft, draftToPatch } from '../src/article.ts'
import { CONTAINER_TYPES } from '../src/containers.ts'
import type { Item } from '../src/types.ts'

const bottonfly = {
  name: 'Bottonfly',
  description: 'Massive insects that populate the forested and muddwood regions of Westlandia.',
  anatomy: 'Rust-coloured bodies covered in long spikes dusted with a powdery white substance.',
  socialStructure: '   ',
}

describe('the fauna spec', () => {
  it('has every field the container needs, name and description required', () => {
    assert.equal(FAUNA_FIELDS.length, 22)
    const required = FAUNA_FIELDS.filter((f) => f.required).map((f) => f.key)
    assert.deepEqual(required, ['name', 'description'])
  })

  it('is registered against a container that actually exists', () => {
    for (const container of Object.keys({ fauna: 1 })) {
      assert.ok(fieldsFor(container), `${container} has a spec`)
    }
    // Every spec except the universe manifest must name a real container.
    const keys = new Set(CONTAINER_TYPES.map((c) => c.key))
    for (const container of containersWithFields()) {
      assert.ok(keys.has(container), `${container} is in the container catalog`)
    }
  })

  it('uses unique keys, so nothing overwrites anything on save', () => {
    const keys = FAUNA_FIELDS.map((f) => f.key)
    assert.equal(new Set(keys).size, keys.length)
  })
})

describe('form values to item', () => {
  it('routes declared fields to columns and the rest to attributes', () => {
    const item = draftToItem('fauna', bottonfly)

    assert.equal(item.container, 'fauna')
    assert.equal(item.name, 'Bottonfly')
    // Description is the summary, so briefs show it wherever the creature is listed.
    assert.match(item.summary!, /^Massive insects/)
    assert.match(String(item.attributes!.anatomy), /Rust-coloured/)
    assert.equal('description' in item.attributes!, false)
  })

  it('drops empty fields rather than storing blanks', () => {
    const item = draftToItem('fauna', bottonfly)
    assert.equal('socialStructure' in (item.attributes ?? {}), false)
    assert.equal('diet' in (item.attributes ?? {}), false)
  })

  it('ignores keys the spec does not declare', () => {
    const item = draftToItem('fauna', { ...bottonfly, smuggled: 'not a field', id: 'hax' })
    assert.equal('smuggled' in (item.attributes ?? {}), false)
    assert.equal('id' in (item.attributes ?? {}), false)
  })

  it('refuses to build an article missing a required field', () => {
    assert.throws(() => draftToItem('fauna', { name: 'Bottonfly' }), /Description is required/)
    assert.throws(() => draftToItem('fauna', { description: 'A thing.' }), /Name is required/)
  })

  it('refuses a container with no spec, rather than inventing one', () => {
    assert.throws(() => draftToItem('roads', { name: 'The Pass' }), /No field spec/)
  })

  it('round-trips through a stored item', () => {
    const built = draftToItem('fauna', bottonfly)
    const stored: Item = {
      id: 'abc',
      container: 'fauna',
      name: built.name,
      summary: built.summary,
      attributes: built.attributes,
      tags: [],
      createdAt: '',
      updatedAt: '',
    }
    const values = itemToDraft('fauna', stored)

    assert.equal(values.name, 'Bottonfly')
    assert.equal(values.description, built.summary)
    assert.equal(values.anatomy, built.attributes!.anatomy)
    assert.equal(values.diet, null)
  })

  it('produces a patch that carries every column an update touches', () => {
    const patch = draftToPatch('fauna', bottonfly)
    assert.deepEqual(Object.keys(patch).sort(), ['attributes', 'kind', 'name', 'summary'])
  })
})
