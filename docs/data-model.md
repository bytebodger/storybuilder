# Data model

Canon is a store, not a pile of prose. Skills read from it before writing anything, and write back to
it when they establish something new. This document is the contract between them.

## The hierarchy

**Universe → container → item → tag.**

A **universe** is the top of the world. Nothing is shared between universes: no ids, no names, no
lookups. That isolation is structural rather than a rule that gets checked — a `Store` handle is
bound to one universe at construction, there is no method that takes a universe id, and there is no
way to name an item in another one. Cross-universe leakage isn't a bug that can occur.

A **container** is a kind of thing: `planet`, `continent`, `country`, `city`, `religion`, `ethnicity`,
`legend`. Containers aren't declared anywhere and there's no fixed list — a container file appears the
first time something is put in it. On disk, one JSON file per container, in the shape you'd query it:

```json
{
  "container": "continent",
  "items": [{ "id": "65a75a60", "name": "Eastlandia", "tags": [] }]
}
```

An **item** is one entity. Ids are unique within a universe and are how everything refers to
everything else, so items can be renamed without breaking a single reference.

A **tag** is an edge: `{ type, relatedTo, role? }`, where `type` is the container of the item at the
other end. Edges are written on **both** endpoints, so any item can be read with its whole
neighbourhood in one pass — the country, its cities, its continent, its religions, its ethnicities,
without a join.

That redundancy is deliberate but never hand-maintained. `link` and `unlink` write both halves,
`move` retypes both halves, and `validate` catches any half a hand-edit has knocked out of agreement.
The duplication is a read optimisation the store is responsible for, not a fact recorded twice.

`role` exists for when `type` alone is ambiguous. Two countries can be neighbours or belligerents,
and a skill needs to know which; roles are recorded per side, so Karn is `at war with` Vesh while
Vesh is `occupied by` Karn.

## Closure: the part that stops invention

This is the point of the whole design.

A list of two continents cannot, by itself, tell a skill whether the planet **has** two continents or
whether two have been **written down so far**. Those look identical in the data and mean opposite
things, and a model asked to write a story resolves the ambiguity in the generous direction. It
invents Southlandia.

So completeness is declared, per relation type, on the item that owns the set:

```json
{
  "name": "Phonon",
  "closure": {
    "continent": {
      "state": "closed",
      "note": "The two-continent geography is structural: the Sunder crossing is the spine of the series.",
      "setAt": "2026-09-08T00:00:00.000Z"
    }
  }
}
```

| Value | Meaning | Effect |
| --- | --- | --- |
| `open` (default) | More may be established later. | No constraint. New members get recorded, not invented in passing. |
| `closed` | These are all of them. | Adding another member throws `CanonViolation`. Requires a stated reason. |
| `uncharted` | More may exist in-world, undiscovered. | No constraint — but a new one is a *discovery*, an authored fact rather than an accident. |

`uncharted` is not a synonym for `open`. `open` is the author not having decided; `uncharted` is the
author deciding that the map has edges. Only one of them means something inside the fiction.

### Which sets to close, and which to leave alone

**Most sets should stay open.** A universe is built the way a wiki is built — in passes, over years,
never all at once — so new material forcing revisions to old material is the normal case, not a
failure. Closure is a narrow tool for the minority of sets that are genuinely bounded, and using it
anywhere else turns every later session into an argument with the store.

| Close it | Leave it open |
| --- | --- |
| Continents of a planet | Religions of a country |
| Moons of a planet | Cities of a country |
| Planets of a system | Characters, factions, guilds |
| The founding members of an order | Anything that splinters, accretes, or has minor instances |

The test is whether the set is **structurally bounded** — small, stable, and load-bearing for the
story — not merely whether the author can currently list its members. A writer saying "Kell has three
religions" almost always means *three that matter*, and closing that set walls off the minor upland
cult they haven't thought of yet. A writer saying "Phonon has two continents" means two.

Two different things also drive an open set's growth, and it is worth recording which:

- **In-universe change.** A religion splinters in Year 400. The world changed; the new item gets a
  `beginDate`.
- **Out-of-universe elaboration.** The author simply hadn't mentioned the cult before. The world did
  not change; the record caught up. No date.

Mechanically these are the same operation — an addition to an open set. But a continuity pass reading
back over the corpus needs to tell them apart, and only the dates can say.

### Closing requires a reason

`setClosure(..., 'closed')` will not proceed without a note, and the note travels into every refusal.
This is the difference between a constraint a later session can evaluate and one it can only obey. A
closed set is a wall; a wall with no sign gets treated as structural whether it is or not, and the
safe move — leaving it alone — is often the wrong one.

Reopening costs nothing by comparison: no reason is required, though one given is kept, so the record
of what was once settled survives. `validate` warns about any closed set whose reason is missing.

Closure is enforced at the only places membership can change — `link`, `add` with inline links, and
`move` — so there is no path into a closed set that skips the check. A refusal names the existing
members, because a skill that has just been told "no" needs to know what the answer actually is:

```
CANON VIOLATION

Phonon (planet) has a closed set of continent: Eastlandia, Westlandia.

Why it was closed: The two-continent geography is structural: the Sunder crossing is
the spine of the series.

Adding "Northlandia" would contradict that. Three legitimate ways forward, and the third
is not a defeat - worlds grow, and a set closed in an early pass is often just wrong:
  1. It is not a continent of Phonon.
  2. It belongs in a different container.
  3. The set was closed too early. Reopen it deliberately:
     sb set-closure 10440468 continent open --reason "..."
```

A closed set with no members is a fact too. `closure: { "moon": "closed" }` with nothing in it says
the planet has no moons, and briefs report it that way.

## Things that aren't real, and things that no longer are

Two different problems, two different mechanisms, and it is worth being clear about which is which.

**A legend is a different kind of thing.** Atlantis-as-myth goes in a `legend` container, not
`continent`. It can be linked to Phonon, written about, and believed in by characters, and it never
comes near the closed set of continents — because it isn't a continent, it's a legend. No special
casing and no per-item "is this real" flag: the container boundary already draws the line.

If a legend turns out to be real, `move` retypes it — and because retyping makes it a new member of
the target set, the promotion is checked exactly like a new link. A lost continent cannot be found on
a planet already known to have two. Reopening the set is a deliberate act, and has to happen first.

**A continent that sank is a real continent.** It stays in `continent`, with an `endDate`. This is
where closure and time have to be kept apart:

> **Closure is membership across all recorded time. Dates say which members are extant at a given
> moment.**

Phonon's closed set of continents is *three* — Eastlandia, Westlandia and Atlantis — even though a
present-day traveller can visit only two. Get this backwards and you have swapped one hallucination
for another: a model told "3 continents" without being told when will write a modern scene with
Atlantis still above water. So briefs mark ended members explicitly:

```
CONTINENT (3) - COMPLETE. Phonon has exactly 3 of type continent, listed here. Do not introduce another.
  - Atlantis [3f2a91c0] (Year 0 - Year 812; NO LONGER EXTANT)
  - Eastlandia [65a75a60]
  - Westlandia [47512658]
```

`beginDate` and `endDate` are free-form strings, because fictional calendars aren't ISO dates —
"Year 198", "Third Age, late". They are first-class fields rather than free-form attributes
specifically so that every skill spells them the same way. Temporal *querying* ("who was alive in
Year 400?") is not built yet; today the dates are recorded and surfaced, not filtered on.

## Item shape

```jsonc
{
  "id": "8e994cc0",
  "container": "country",
  "name": "Kell",
  "aliases": ["The Kellish Reach"],
  "summary": "A coastal country on Eastlandia's western shore.",
  "beginDate": "Year 41",                    // optional, free-form
  "endDate": null,                           // set means: existed, no longer does
  "attributes": { "population": 400000 },    // anything else, per container
  "tags": [
    { "type": "continent", "relatedTo": "65a75a60" },
    { "type": "city", "relatedTo": "9450fbe6" }
  ],
  "closure": {
    "city": { "state": "closed", "note": "Kell is a one-city country by design.", "setAt": "..." }
  },
  "sources": ["narrative/published/ch01.md"],
  "createdAt": "2026-09-08T00:00:00.000Z",
  "updatedAt": "2026-09-08T00:00:00.000Z"
}
```

`attributes` is the open extension point. Per-container conventions — a country's population, a
character's age — live there until enough of them settle to be worth promoting to real fields, the
way the dates were.

## The store interface

Everything — skills, the CLI, the bridge — goes through one interface, in
[store/src/store.ts](../store/src/store.ts). The current implementation writes JSON files inside the
universe directory. Moving to Postgres or a document store later means writing one more class behind
that interface and changing nothing that calls it. JSON files are right *now* because a world in
flight is read by humans, diffed in review, and edited by hand; they are not a commitment.

Reads are uncached — every operation goes to disk. Universes hold thousands of items, not millions,
and files get hand-edited between calls, so a stale in-memory copy is a far likelier source of a
wrong answer than the I/O is a bottleneck.

## Consistency

`sb validate` checks what the store maintains but a text editor can break:

- tags pointing at ids that do not exist
- one-sided edges
- a tag whose `type` disagrees with the target's actual container
- duplicate ids
- (warning) two items with the same name in one container
- (warning) a closed set with no members — legitimate, but worth a second look
- (warning) a closed set with no reason recorded — a later session cannot tell whether it may be reopened

Run it after editing a store file by hand.
