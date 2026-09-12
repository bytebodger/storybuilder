/**
 * The skill catalog, read from `.claude/skills` at request time.
 *
 * A hardcoded list is a promise the repository does not have to keep: it can
 * advertise a skill nobody wrote, or miss one somebody did. Reading the
 * directory means the console offers exactly the skills that exist, and a skill
 * added to the repo appears without a second edit anywhere.
 */
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import type { Skill, SkillArg } from './types.ts'

/**
 * Parse a SKILL.md frontmatter block.
 *
 * Deliberately a small subset of YAML, not a parser: `key: value` per line,
 * with `true`/`false` read as booleans and anything starting `[` or `{` read as
 * JSON. That is why `args` is written as a single-line JSON array - it keeps the
 * file readable to Claude Code, which only needs `name` and `description`, while
 * carrying the extra structure the form needs without a dependency.
 */
export function parseFrontmatter(text: string): Record<string, unknown> | null {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)
  if (!match) return null

  const out: Record<string, unknown> = {}
  for (const line of match[1].split(/\r?\n/)) {
    const at = line.indexOf(':')
    if (at <= 0 || line.startsWith('#')) continue
    const key = line.slice(0, at).trim()
    const raw = line.slice(at + 1).trim()
    if (!key || raw === '') continue

    if (raw === 'true' || raw === 'false') out[key] = raw === 'true'
    else if (raw.startsWith('[') || raw.startsWith('{')) {
      try {
        out[key] = JSON.parse(raw)
      } catch {
        // A malformed structured value is skipped rather than failing the file;
        // a broken `args` line should not hide the skill entirely.
      }
    } else out[key] = raw.replace(/^["']|["']$/g, '')
  }
  return out
}

function toSkill(front: Record<string, unknown>, dirName: string): Skill | null {
  const name = typeof front.name === 'string' ? front.name : dirName
  const description = typeof front.description === 'string' ? front.description : ''
  if (!description) return null
  /*
   * `title` is what a person should see, where `name` is what the skill is.
   *
   * The name is an identifier - it is how Claude Code invokes the skill and
   * what `/api/run` validates against - so it cannot be prose. But "canon-check"
   * is a slug on a card that a reader is being asked to choose from, and "Is it
   * canonical?" is the same thing said to a person. Optional: a skill that sets
   * no title shows its name, which is what every one of them did before.
   */
  const title = typeof front.title === 'string' && front.title ? front.title : undefined
  /*
   * `hidden` keeps a skill out of the console's skill list, for two reasons
   * that come to the same thing.
   *
   * The forge skills are machinery: a form drives them and supplies their
   * inputs, so there is nothing for a person to fill in. `canon-add` is the
   * other case - the console has a better route to the same end. An article
   * form carries the field spec, the roll and the save-time rounds; a free-text
   * box beside it is a second way into canon with none of them.
   *
   * It hides the skill from `/api/run` as well, which validates against this
   * same list. That is deliberate: not offered and not reachable are the same
   * claim. Neither affects Claude Code, which reads the directory itself.
   */
  if (front.hidden === true) return null

  const args = Array.isArray(front.args) ? (front.args as SkillArg[]).filter((a) => a?.name && a?.label) : []
  return { name, title, description, args, writes: front.writes === true }
}

/** Every visible skill in `.claude/skills`, sorted by name. */
export async function readCatalog(repoRoot: string): Promise<Skill[]> {
  const dir = join(repoRoot, '.claude', 'skills')
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return []
  }

  const skills: Skill[] = []
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    let text: string
    try {
      text = await readFile(join(dir, entry.name, 'SKILL.md'), 'utf8')
    } catch {
      continue
    }
    const front = parseFrontmatter(text)
    if (!front) continue
    const skill = toSkill(front, entry.name)
    if (skill) skills.push(skill)
  }
  return skills.sort((a, b) => a.name.localeCompare(b.name))
}
