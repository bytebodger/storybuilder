import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { parseFrontmatter, readCatalog } from '../src/catalog.ts'

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

describe('frontmatter', () => {
  it('reads strings, booleans, and single-line JSON', () => {
    const front = parseFrontmatter(
      ['---', 'name: canon-add', 'description: Records things.', 'writes: true', 'args: [{"name":"a","label":"A"}]', '---', '# body'].join('\n'),
    )
    assert.equal(front?.name, 'canon-add')
    assert.equal(front?.writes, true)
    assert.deepEqual(front?.args, [{ name: 'a', label: 'A' }])
  })

  it('survives a malformed structured value rather than hiding the skill', () => {
    const front = parseFrontmatter(['---', 'name: x', 'description: y', 'args: [{broken', '---'].join('\n'))
    assert.equal(front?.name, 'x')
    assert.equal(front?.args, undefined)
  })

  it('returns null without frontmatter', () => {
    assert.equal(parseFrontmatter('# just a heading'), null)
  })
})

describe('catalog', () => {
  it('offers exactly the skills that exist on disk', async () => {
    const skills = await readCatalog(REPO)
    const names = skills.map((s) => s.name)

    assert.ok(names.includes('canon-add'))
    assert.ok(names.includes('canon-query'))
    assert.ok(names.includes('canon-check'))
    // universe-forge is driven by the universe form, not the skill console.
    assert.ok(!names.includes('universe-forge'))
  })

  it('carries the write flag and the argument spec through', async () => {
    const skills = await readCatalog(REPO)
    const add = skills.find((s) => s.name === 'canon-add')!
    const query = skills.find((s) => s.name === 'canon-query')!

    assert.equal(add.writes, true)
    assert.equal(query.writes, false)
    assert.equal(query.args[0].name, 'subject')
    assert.equal(query.args[0].required, true)
  })

  it('is empty for a directory with no skills, rather than throwing', async () => {
    assert.deepEqual(await readCatalog('/nonexistent-repo-root'), [])
  })
})
