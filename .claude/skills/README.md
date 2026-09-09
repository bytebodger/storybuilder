# Skills

The tool itself. One directory per skill, each containing a `SKILL.md` with YAML frontmatter:

```markdown
---
name: canon-check
description: Validate content against a universe's canon and report contradictions, unknown references, and timeline conflicts. Use when the user asks to check or fact-check a draft against the world.
writes: false
args: [{"name":"content","label":"Content or file path","multiline":true,"required":true}]
---
```

`name` and `description` are what Claude Code reads. `writes` and `args` are read by the bridge, which
builds the console's skill list from this directory — so a skill appears in the UI, with a form, the
moment its `SKILL.md` exists, and the console can never advertise a skill nobody wrote. `args` is a
single-line JSON array; add `hidden: true` for a skill driven by its own UI rather than the console.

Claude Code discovers skills here automatically, so a `SKILL.md` in this directory is live the moment
it is written. Keep stubs out of it — an unfinished skill will still be offered and invoked.

## Contract every skill follows

- **Read the store before writing anything.** `sb brief <id>` first, prose second. The brief states
  which relation sets are complete; a skill that skips it is guessing.
- **Default to open.** Never close a relation set on your own initiative, and never as a side effect
  of recording facts. Closure is a narrow tool for structurally bounded sets — continents, moons —
  and an author listing three religions almost always means *three that matter*. If a set looks
  genuinely bounded, propose closing it and say why; let the author decide.
- **A refusal is not a dead end.** `CANON VIOLATION` carries the reason the set was closed and the
  command to reopen it. Worlds grow; a set closed in an early pass is often simply wrong. Surface the
  reason to the author and let them choose, rather than silently working around the wall.
- **Never invent canon silently.** If a fact is needed and not established, say so and ask. A
  `CANON VIOLATION` is an answer, not an error: it is the store saying the thing you want to write is
  not true.
- **Write back what you establish.** A fact that exists only in prose will be contradicted later.
- **Cite sources.** Any asserted world fact names where it came from.
- **Write, then show the diff.** There is no staging area; the store writes immediately and git is
  the undo. A skill that changed canon ends by showing `git diff --stat universes/<id>` and saying
  how to revert. Claiming to "propose" a change while writing it would be worse than writing it
  plainly.
- **Declare reads and writes.** State up front which parts of the universe the skill touches. A skill
  that only answers questions must not write.

The planned skill set is in the [root README](../../README.md#the-skill-set); the data model is in
[docs/data-model.md](../../docs/data-model.md).
