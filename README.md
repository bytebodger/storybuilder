# Storybuilder

**Storybuilder is a worldbuilding workbench: a canon store that knows what has been established, a
set of Claude Code skills that draft and fact-check content against it, and a React/TypeScript UI for
driving them.**

The problem it solves is *drift*. Any long-running fictional world — a novel series, a campaign
setting, a game, a shared universe — accumulates facts faster than a human, or a language model with
a finite context window, can hold in mind. Chapter 12 gives a character brown eyes; chapter 31 makes
them grey. A planet established as having two continents quietly grows a third.

That last failure is the one worth looking at closely, because it is not a memory problem. Show a
model two continents and it cannot tell whether the planet **has** two or whether two have been
**written down so far**. Those look identical in the data and mean opposite things, and asked to
write a story, a model resolves the ambiguity generously. So the store records completeness as a
fact of its own — `Phonon.continent = closed` — and refuses the third continent rather than hoping
nobody asks for it.

The tool is mostly skills, not application code. The skills are the product; the store is what makes
them trustworthy, and the frontend is a convenience layer over both.

---

## Core ideas

| Idea | What it means here |
| --- | --- |
| **Containers are flat** | Everything descends from a universe and nothing else. A creature's range crosses two continents and also belongs to a ritual and an ethnic group - three relationships, no tree - so relationships are tags, not structure. |
| **A universe is sealed** | The universe is the top of the hierarchy. Nothing crosses between universes — not ids, not names, not lookups — and that is enforced by construction, not by a rule someone has to remember. |
| **Completeness is a fact** | "These are all of them" is recorded, not inferred from what happens to be present. It is the difference between canon and a list so far. |
| **Open is the default** | Worlds are built in passes over years, so accretion is the normal case. Closure is a narrow tool for structurally bounded sets, it is never applied automatically, and closing one requires saying why. |
| **Canon is authoritative** | Prose is downstream of the store. A draft that contradicts canon means one of the two is wrong, and the tool says so rather than quietly picking a side. |
| **Skills are the interface** | Each authoring operation is a skill with a defined contract about what it reads and what it writes. |
| **Humans approve canon changes** | Skills propose; you review the diff. Generation is cheap, canon is expensive. |

---

## How it holds the line

```
$ npm run sb -- --universe phonon brief <phonon-id>

Phonon - planet - id fbea71f1

A temperate world of two continents divided by the Sunder Ocean.

CONTINENT (2) - COMPLETE. Phonon has exactly 2 of type continent, listed here.
Do not introduce another; if the story needs one, say so and ask.
  - Eastlandia [509b3c98]
  - Westlandia [f0eb2d7b]

LEGEND (1) - OPEN. More of type legend may be established.
  - Southlandia [99159fcf]
```

```
$ npm run sb -- --universe phonon link <phonon-id> <new-continent-id>

CANON VIOLATION

Phonon (planet) has a closed set of continent: Eastlandia, Westlandia. Adding
"Northlandia" would contradict established canon. Either it is not a continent of
Phonon, or it belongs in a different container, or the set must be reopened
deliberately.
```

Closing a set requires a reason, and that reason travels into every refusal along with the command to
reopen — because a world is built in passes over years, and a set closed in an early pass is often
just wrong. Most sets should never be closed at all: `Phonon.continent` yes, `Kell.religion` no.

Southlandia is a `legend`, not a continent, so it never threatens the closed set — the container
boundary draws the line, with no per-item "is this real" flag. A continent that genuinely sank is a
different case: it stays a continent and carries an `endDate`, because closure is membership across
all recorded time while dates say which members are extant *now*. See
[docs/data-model.md](docs/data-model.md).

---

## Repository layout

```
storybuilder/
├── .claude/
│   └── skills/            # The tool itself — one directory per skill
├── store/                 # Canon store: data model, container catalog, JSON backend, `sb` CLI, tests
├── universes/             # Content. One directory per universe; each is self-contained
│   ├── _template/         # Skeleton for a new universe
│   └── phonon/            # Worked example
│       ├── universe.json  # Manifest: premise, hard rules, voice
│       ├── store/         # Canon. One JSON file per container
│       ├── narrative/     # outlines / drafts / published
│       └── notes/         # Scratch, not yet canon
├── web/                   # React + TypeScript + Vite frontend
├── bridge/                # Local Node service the frontend calls to run skills
└── docs/                  # Data model and design notes
```

Universes are deliberately isolated from tooling. You can copy `universes/my-universe/` into another
repository, or keep it in a private submodule, without taking the skills with it.

---

## The store

The store is the foundation everything else stands on. Full spec:
[docs/data-model.md](docs/data-model.md). In short: **universe → container → item → tag**, where
containers are kinds of thing (`planet`, `country`, `religion`), items are entities, and tags are
edges written on both endpoints so any item can be read with its whole neighbourhood in one pass — a
country with its cities, continent, religions and ethnicities, without a join.

The nineteen container types - people, cosmology, locations, geography, theology, fauna, tales and the
rest - are
listed in [docs/containers.md](docs/containers.md), along with what separates a reference article from
a tale, and why items carry a free-form `kind`.

It is JSON files inside each universe today, behind a `Store` interface. Swapping in Postgres or a
document store later means writing one class behind that interface and changing nothing that calls
it.

```bash
npm install && npm test
```

```bash
npm run sb -- --universe phonon brief <id>
```

---

## The skill set

Planned skills, grouped by what they touch. Each is a directory under `.claude/skills/` containing a
`SKILL.md`; invoke one in Claude Code by name, or from the UI.

**Establishing the world**

- `universe-forge` — Suggest values for blank fields on the universe form, coherent with what the author has already written. **Built.** See [docs/universe-form.md](docs/universe-form.md).
- `article-forge` — The same for an article inside a universe, grounded in canon that already exists rather than in the form alone. **Built.**
- `stub-forge` — After an article is saved, propose placeholders for the terms it leans on but never explains. **Built.** See [docs/stubs.md](docs/stubs.md).
- `canon-add` — Record a new entity, place it in the right container, and wire its relations. Refuses to widen a closed set. **Built.**
- `name-forge` — Generate names that fit the world's conventions and don't collide with one already in use.

**Interrogating the world**

- `canon-query` — "What do we know about X?" A sourced brief, plus what is explicitly *not* established. **Built.**
- `world-brief` — A condensed bible for a specific audience: a co-author, an illustrator, a game master.
- `timeline` — Query the chronology and flag ordering conflicts.

**Producing content**

- `outline` — Build outlines bound to canon, so structure work can't wander off-world.
- `scene-draft` — Draft prose for a beat. Loads the relevant canon first, then writes, then reports which new facts the draft implies.

**Defending the world**

- `canon-check` — Validate content against canon: contradictions, unknown references, closed-set violations, dates outside the canon's span. **Built.**
- `continuity-pass` — Sweep a draft or the whole corpus for drift and propose reconciling edits.

---

## The frontend

`web/` is a React + TypeScript (Vite) console for people who would rather click than type. Pick a
universe, pick a skill, fill in its arguments as a form, submit, and watch the output — with the
universe's premise and hard rules on screen throughout, so the constraints a run is held to stay
visible.

It talks to `bridge/`, a small local Node service that runs skills via the Claude Code CLI. The
bridge is the only piece trusted with your working tree; the frontend is a static app.

```bash
cd bridge && npm install && npm run dev
```

```bash
cd web && npm install && npm run dev
```

---

## Status

Scaffolding and foundation. What exists:

- [x] Canon store: data model, closure enforcement, `sb` CLI, 28 passing tests
- [x] Universe manifest, field spec, and the `universe-forge` generation skill
- [x] Home screen and universe create/edit form, with per-field lock / clear / regenerate
- [x] The core canon skills: `canon-query`, `canon-add`, `canon-check`
- [x] Skill catalog read from `.claude/skills/`, so the console offers only skills that exist
- [x] Container catalog and per-universe navigation, including empty sections
- [x] Kinds, so coarse containers can still carry fine completeness claims
- [x] Generic field specs: one form, one generator, any container. `universe`, `fauna` and `locations` have specs
- [x] Stubs: a third state between absent and described, with reference scanning on save
- [x] Two-round save flow: loose ends first, then a canon check that reads the result. See [docs/save-flow.md](docs/save-flow.md)
- [x] Cross-references: article prose links to the articles it mentions, stubs included. See [docs/cross-references.md](docs/cross-references.md)
- [x] Map import from Azgaar exports, tiered, with hand-added labels always included. See [docs/map-import.md](docs/map-import.md)
- [x] Worked example universe (`universes/phonon`)
- [x] Frontend and bridge scaffolds, wired to the store
- [ ] The remaining skills: `name-forge`, `outline`, `scene-draft`, `continuity-pass`, `world-brief`, `timeline`
- [ ] Temporal queries — dates are recorded and surfaced, not yet filtered on
- [ ] Named ages and eras ("Year 432 of the First Age")
- [ ] Field specs for the remaining fifteen containers
- [ ] Author-defined container types
- [ ] The story-building workflow, grounded in established canon
- [ ] Canon indexing, so large universes don't re-read the corpus on every call
