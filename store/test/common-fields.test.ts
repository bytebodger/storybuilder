import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { COMMON_FIELDS, composeSpec } from '../src/common-fields.ts'
import { FIELD_SPECS, containersWithFields, fieldsFor } from '../src/fields.ts'
import type { FieldSpec } from '../src/field-spec.ts'

const field = (key: string, over: Partial<FieldSpec> = {}): FieldSpec => ({
  key,
  label: key,
  kind: 'text',
  required: false,
  default: null,
  help: '',
  ...over,
})

describe('fields common to every article container', () => {
  it('reaches every container that has a spec', () => {
    for (const container of containersWithFields()) {
      const keys = fieldsFor(container)!.map((f) => f.key)
      for (const { field: common } of COMMON_FIELDS) {
        assert.ok(keys.includes(common.key), `${container} has ${common.key}`)
      }
    }
  })

  it('leaves the universe manifest alone', () => {
    // It describes the world, not a thing inside it - the same reason a stub
    // can never be a universe.
    assert.equal(FIELD_SPECS.universe.some((f) => f.key === 'pronunciation'), false)
  })

  it('puts the field where it belongs, not at the end', () => {
    const composed = composeSpec([field('name'), field('description'), field('history')])
    assert.deepEqual(composed.map((f) => f.key), ['name', 'pronunciation', 'description', 'history'])
  })

  it('appends when the anchor is missing rather than dropping the field', () => {
    const composed = composeSpec([field('title'), field('body')])
    assert.deepEqual(composed.map((f) => f.key), ['title', 'body', 'pronunciation'])
  })

  it('lets a container keep its own version of a common field', () => {
    const own = field('pronunciation', { label: 'How to say it', required: true })
    const composed = composeSpec([field('name'), own])

    assert.equal(composed.filter((f) => f.key === 'pronunciation').length, 1)
    assert.equal(composed.find((f) => f.key === 'pronunciation')!.label, 'How to say it')
  })

  it('is stable: composing twice changes nothing', () => {
    const once = composeSpec([field('name'), field('description')])
    assert.deepEqual(composeSpec(once), once)
  })

  it('does not mutate the spec it was given', () => {
    const original = [field('name')]
    composeSpec(original)
    assert.equal(original.length, 1)
  })
})

describe('pronunciation itself', () => {
  it('is optional, short, and asks for a respelling', () => {
    const [{ field: pronunciation }] = COMMON_FIELDS
    assert.equal(pronunciation.key, 'pronunciation')
    assert.equal(pronunciation.kind, 'text')
    assert.equal(pronunciation.required, false)
    assert.match(pronunciation.help, /respelling/)
  })

  it('sits beside the name in a real container', () => {
    const keys = fieldsFor('locations')!.map((f) => f.key)
    assert.equal(keys[keys.indexOf('name') + 1], 'pronunciation')
  })
})
