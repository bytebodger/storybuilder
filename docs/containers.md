# Containers

The kinds of thing a universe can hold. Declared in
[store/src/containers.ts](../store/src/containers.ts), which is what the navigation renders from — so
a section appears in the sidebar whether or not anything is in it yet.

That emptiness is the point. A nav built only from what exists shows an author what they have already
written; a nav built from the catalog shows them what their world has not yet said anything about.

| Container | Holds |
| --- | --- |
| **People** | Major characters at any point in the timeline. |
| **Cosmology** | Celestial bodies and the sky as the world sees it: stars, planets, moons, constellations, comets. |
| **Locations** | Inhabited or bounded places: a city, a district, a country, a region, a battlefield. |
| **Geography** | Physical features: ranges, forests, valleys, bays, lakes, oceans, rivers, caves, cliffs, waterfalls, islands, archipelagos, peninsulas, plains, straits, jungles, glaciers. |
| **Roads** | Key roads, passes and paths — including small ones that matter strategically or historically. |
| **Institutions** | Formal hierarchies with infrastructure, and decentralised bodies: guilds, secret societies, fraternities. |
| **Ethnicities** | Including race, and self-defined groups genetically indistinct from their neighbours but holding distinct traditions. |
| **Languages** | Who speaks them, where, their written and spoken character, their lineage. |
| **Theology** | Religions and cults of any size; also individual deities, doctrines and dogmas. |
| **Traditions** | Recurring observances: festivals, coronation rites, religious observances, superstitious rituals. |
| **History** | Distinct events. The Battle of Silverfield; the fall of an empire; a coronation. |
| **Legends** | In-universe myths, resting on real history or entirely invented within the fiction. |
| **Documents** | In-universe documents, described from the outside: when made, by whom, what they changed. |
| **Fauna** | Creatures distinctive enough for their own article. An ice dragon, not a squirrel. |
| **Flora** | Likewise for plants. Witch's Bane Nettle, not corn. |
| **Afflictions** | A disease, a disorder particular to this world, or a curse laid on a whole people. |
| **Phenomena** | Natural or supernatural: a whirlpool that never dissipates; a sky that sometimes answers. |
| **Terminology** | Terms particular to this universe — what the locals call the swamps they live beside. |
| **Tales** | Works of in-universe fiction. The only narrative container. |

History events are additionally filed into **timelines** — a tree of buckets rooted at each universe's
Universal History, described in [timelines.md](timelines.md). A timeline is not a container: it holds
no article and has no field spec.

The list is a starting point, not a fixed schema. The store never refused an unlisted container, and
the nav shows anything it finds under one, labelled as outside the catalog. Author-defined container
types are a later feature; for now, adding one means adding it to the catalog.

## Fields

A container may declare a field spec: the form the author fills in, and the list the generator is
briefed from. Ten exist so far — the universe manifest ([universe-form.md](universe-form.md)),
[fauna](fields-fauna.md), [locations](fields-locations.md), [people](fields-people.md),
[history](fields-history.md), [afflictions](fields-afflictions.md), [cosmology](fields-cosmology.md),
[documents](fields-documents.md), [ethnicities](fields-ethnicities.md) and [flora](fields-flora.md). A
container without one is not broken; its entries are the name, summary
and tags every container supports, and a spec can be added later without migrating anything.

Specs are data, in [store/src/fields.ts](../store/src/fields.ts). Adding a container's spec makes its
form appear, makes its fields generatable, and makes them accepted on save, with nothing else to
change.

### Fields every container gets

Some fields belong on anything with a name, and are declared once in
[common-fields.ts](../store/src/common-fields.ts) rather than pasted into each spec.
**Pronunciation** is the first of them, and it reaches every container with a spec — the universe
manifest included, since a world's own name is as invented as anything inside it.

Each common field carries what it follows, because position is part of the definition — a
pronunciation belongs beside the name, not appended after the history. The anchor is matched against a
field's `storeAs` before its key, and the last match wins, so `'name'` means *after the name* whatever
the name field is called — and lands after the final piece of a name that arrives in pieces, as
[a person's](fields-people.md#a-name-in-parts) does. An inserted field also joins the form section of
whatever it was placed beside. A container that declares the field itself keeps its own version, so a
common field is a default rather than a rule.

Composition happens once, where specs are registered, and the raw per-container arrays are not
exported: `fieldsFor()` is the only way to read a spec, and it always returns the composed one. A
consumer cannot accidentally read a spec the form and the generator never use.

Any container can hold a **stub** — a name recorded without an article, so a reference in one article
does not have to be written out before that article can be finished. See [stubs.md](stubs.md).

## Articles are not stories

Every container except `tales` holds **reference articles** — wiki entries about the world. They can
be vivid, and they can carry the world's own uncertainty:

> Some legends claim the amarti did not evolve in this environment, but were crafted and warped by
> practitioners of dark magic in the unrecorded annals of antiquity.

But they have no plot, no character development, and no rising action. They are the encyclopaedia
entry, not the novel. `tales` is where fiction itself goes, and it is marked `narrative: true` so
skills can tell the difference — the standards for drafting an article and for drafting a scene are
not the same, and a skill that confuses them writes encyclopaedia prose into a story, or plot into an
encyclopaedia.

This split is also what makes the eventual story-building workflow worth having: suggestions grounded
in a universe that has already been described beat suggestions generated from nothing. That workflow
is out of scope until the canon-building half is solid.

## Hierarchy is a relationship, not a structure

Containers are flat. Everything descends from a universe and nothing else, because most real
relationships are not hierarchies.

A country sits on a continent, which reads like containment. But a creature's range crosses two
continents, and it also belongs to a ritual and to an ethnic group — three relationships, no tree.
Forcing that into a hierarchy means picking one true parent and losing the rest, so the store holds
relationships as tags: reciprocal edges, any item to any item, each optionally carrying a role.

See [data-model.md](data-model.md).

## Kinds

Containers are coarse on purpose — one `locations` section is easier to navigate than five — but
completeness claims are not. "Phonon has exactly two continents" is a claim about continents; closing
all of `geography` would close its rivers and mountains along with them.

So an item may carry a **kind**: a free-form subtype within its container. `locations` holds a planet,
a country and a city; `geography` holds continents and an ocean. Relation sets group by kind where one
is present, and closure keys on the same string:

```
CONTINENT (2) - COMPLETE. Phonon has exactly 2 of type continent, listed here.
  - Eastlandia [57156dca]
  - Westlandia [922c85f0]

OCEAN (1) - OPEN. Phonon may have more of type ocean than are recorded here.
  - The Sunder [50606d1e]
```

Kinds are advisory. The catalog suggests common ones per container; nothing enforces them, and an item
without a kind groups and closes by its container exactly as it did before kinds existed.

## Cosmology and Phenomena

`cosmology` holds the bodies: a planet, its moons, a comet on a ninety-one-year return. `phenomena`
holds what happens — including things that happen in the sky. A festival where the sky sometimes
answers is a phenomenon; the star it is addressed to is cosmology.

The split matters for closure. A world can have exactly two moons and any number of unexplained
lights, and those are different claims about different sets:

```
MOON (2) - COMPLETE. Phonon has exactly 2 of type moon, listed here.
  Why: Two moons, and the tide tables depend on there being exactly two.
  - Little Verrin [d2ee59bf]
  - Verrin [81730339]

OCEAN (1) - OPEN. Phonon may have more of type ocean than are recorded here.
  - The Sunder [50606d1e]
```

Both sets hang off the same planet, and closing the moons left the comets, stars and constellations
of `cosmology` entirely open.
