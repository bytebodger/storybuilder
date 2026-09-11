import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { readFile } from 'node:fs/promises'
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

    assert.ok(names.includes('canon-query'))
    assert.ok(names.includes('canon-check'))
    // universe-forge is driven by the universe form, not the skill console.
    assert.ok(!names.includes('universe-forge'))
  })

  it('keeps canon-add out of it, because the console has a better route', async () => {
    // An article form carries the field spec, the rolled skeleton, the fill
    // rates and the stub and canon-check rounds on save. A free-text box beside
    // it is a second way into canon with none of them.
    const names = (await readCatalog(REPO)).map((s) => s.name)
    assert.ok(!names.includes('canon-add'))
  })

  it('offers nothing that writes, since every write has a form', async () => {
    // Not a rule the catalog enforces - a skill is hidden one at a time, on
    // purpose. This says what is currently true, so adding a writing skill to
    // the console is a decision somebody makes rather than one that happens.
    for (const skill of await readCatalog(REPO)) {
      assert.equal(skill.writes, false, `${skill.name} writes canon and is listed`)
    }
  })

  it('carries the write flag and the argument spec through', async () => {
    // The flag still has to survive parsing, whether or not the skill carrying
    // it is offered: `writes` is what the console badges and what this asserts.
    const add = parseFrontmatter(
      await readFile(resolve(REPO, '.claude/skills/canon-add/SKILL.md'), 'utf8'),
    )
    assert.equal(add?.writes, true)
    assert.equal(add?.hidden, true)

    const query = (await readCatalog(REPO)).find((s) => s.name === 'canon-query')!
    assert.equal(query.writes, false)
    assert.equal(query.args[0].name, 'subject')
    assert.equal(query.args[0].required, true)
  })

  it('is empty for a directory with no skills, rather than throwing', async () => {
    assert.deepEqual(await readCatalog('/nonexistent-repo-root'), [])
  })
})
