import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { applyForgeResponse, buildForgePrompt, extractJson } from '../src/forge.ts'

const req = (fill: string[], current: Record<string, unknown> = {}) => ({
  container: 'universe',
  fill,
  current,
})

const fauna = (fill: string[], current: Record<string, unknown> = {}) => ({
  container: 'fauna',
  universe: 'phonon',
  fill,
  current,
})

describe('locks are enforced here, not in the prompt', () => {
  it('drops a field that was not requested, however plausible it looks', () => {
    const raw = '{"tone": "elegiac", "name": "Something Better"}'
    const { values, dropped } = applyForgeResponse(raw, req(['tone'], { name: 'Exoria' }))

    assert.deepEqual(values, { tone: 'elegiac' })
    assert.deepEqual(dropped, ['name'])
  })

  it('drops every unrequested key even when nothing requested comes back', () => {
    const raw = '{"geography": "Endless salt flats.", "origins": "A god sneezed."}'
    const { values, dropped } = applyForgeResponse(raw, req(['tone']))

    assert.deepEqual(values, {})
    assert.deepEqual(dropped.sort(), ['geography', 'origins'])
  })

  it('drops keys that are not universe fields at all', () => {
    const raw = '{"tone": "wry", "__proto__": "x", "notes": "hello"}'
    const { values, dropped } = applyForgeResponse(raw, req(['tone']))

    assert.deepEqual(Object.keys(values), ['tone'])
    assert.ok(dropped.includes('notes'))
  })
})

describe('reading the response', () => {
  it('finds the object inside prose and code fences', () => {
    const raw = 'Here you go:\n\n```json\n{"tone": "elegiac"}\n```\n\nHope that helps!'
    assert.deepEqual(extractJson(raw), { tone: 'elegiac' })
  })

  it('returns nothing rather than guessing when there is no object', () => {
    assert.equal(extractJson('I could not think of anything.'), null)
  })

  it('calls an answer with no object in it a failure, not an empty answer', () => {
    // These are different things downstream. A blank result reads as "the
    // generator chose to fill nothing in", and a whole batch of fields once
    // came back that way, reported in a footnote and retried by nobody.
    const result = applyForgeResponse('nothing here', req(['tone']))
    assert.deepEqual(result.values, {})
    assert.match(result.error ?? '', /no JSON object/)
  })

  it('says so when the run produced no output at all', () => {
    assert.match(applyForgeResponse('', req(['tone'])).error ?? '', /returned nothing/)
  })

  it('coerces values into the shape the field declares', () => {
    const raw = '{"genres": "space opera, gothic horror", "totalYears": "about 4000 years"}'
    const { values } = applyForgeResponse(raw, req(['genres', 'totalYears']))

    assert.deepEqual(values.genres, ['space opera', 'gothic horror'])
    assert.equal(values.totalYears, 4000)
  })

  it('treats an empty generated value as no answer', () => {
    const { values } = applyForgeResponse('{"tone": "   ", "themes": []}', req(['tone', 'themes']))
    assert.deepEqual(values, {})
  })
})

describe('one form, many containers', () => {
  it('brief the generator from the container it was asked about', () => {
    const prompt = buildForgePrompt(fauna(['anatomy'], { name: 'Bottonfly' }))

    assert.match(prompt, /Use the article-forge skill/)
    assert.match(prompt, /Container: fauna/)
    assert.match(prompt, /Universe: phonon/)
    assert.match(prompt, /anatomy \(prose, 2-4 sentences\)/)
    // A universe field is not a fauna field and must not leak into the brief.
    assert.doesNotMatch(prompt, /naturalLaws/)
  })

  it('drops a key that belongs to a different container entirely', () => {
    const raw = '{"anatomy": "Eight legs, four wings.", "naturalLaws": "No magic."}'
    const { values, dropped } = applyForgeResponse(raw, fauna(['anatomy']))

    assert.deepEqual(Object.keys(values), ['anatomy'])
    assert.deepEqual(dropped, ['naturalLaws'])
  })

  it('generates nothing for a container with no spec', () => {
    // Deliberately not a container in the catalog. Every one of those has a
    // spec now, so naming a real one meant rewriting this line each time.
    const { values } = applyForgeResponse('{"name": "The Pass"}', {
      container: 'no-such-container',
      fill: ['name'],
      current: {},
    })
    assert.deepEqual(values, {})
  })
})

describe('the prompt', () => {
  it('names the fields to fill and the values to cohere with', () => {
    const prompt = buildForgePrompt(req(['tone', 'themes'], { name: 'Exoria', genres: ['space opera'] }))

    assert.match(prompt, /Use the universe-forge skill/)
    assert.match(prompt, /tone \(short string\)/)
    assert.match(prompt, /themes \(array of short strings\)/)
    assert.match(prompt, /must not be changed/)
    assert.match(prompt, /Exoria/)
    // Fields that are neither requested nor set must not appear as instructions.
    assert.doesNotMatch(prompt, /geography \(/)
  })

  it('tells the model to find a centre when the form is empty', () => {
    assert.match(buildForgePrompt(req(['name'])), /form is empty/)
  })
})
