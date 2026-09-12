import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
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

  it('shows a title where a skill sets one, and keeps the name as the identifier', async () => {
    // "canon-check" is a slug on a card a reader is being asked to choose from.
    // The name still has to be the name: it is what invokes the skill and what
    // /api/run validates against, so a title cannot replace it.
    const skills = await readCatalog(REPO)
    assert.deepEqual(
      Object.fromEntries(skills.map((s) => [s.name, s.title])),
      {
        'canon-check': 'Is it canonical?',
        'canon-query': 'What do we know about...?',
      },
    )
  })

  it('falls back to the name for a skill that sets no title', async () => {
    // Both skills in this repo are titled now, so the fallback is tested
    // against a directory built for the purpose rather than against whichever
    // real skill happens not to have been given one yet.
    const dir = await mkdtemp(join(tmpdir(), 'sb-skills-'))
    try {
      await mkdir(join(dir, '.claude', 'skills', 'plain-skill'), { recursive: true })
      await writeFile(
        join(dir, '.claude', 'skills', 'plain-skill', 'SKILL.md'),
        ['---', 'name: plain-skill', 'description: Does a thing.', '---'].join('\n'),
        'utf8',
      )

      const [skill] = await readCatalog(dir)
      assert.equal(skill.name, 'plain-skill')
      assert.equal(skill.title, undefined)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('is empty for a directory with no skills, rather than throwing', async () => {
    assert.deepEqual(await readCatalog('/nonexistent-repo-root'), [])
  })
})
