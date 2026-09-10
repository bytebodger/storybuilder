# Timelines

A timeline is a bucket for history, and a place in a tree of them. **It is not a container type.** It
holds no article, describes nothing, and has no field spec. What it does is say which stretch of a
universe's history an event belongs to, and which larger stretch that one sits inside:

```
Universal History
  History of Waresia
    Reign of King Tarinian
      War of the Stewards
```

The model lives in [store/src/timelines.ts](../store/src/timelines.ts) — pure functions over a flat
list — with reading and writing in [json-store.ts](../store/src/json-store.ts). The split is
deliberate: what counts as a valid tree is the part worth testing, and it has to hold whether a change
arrives from the console, the CLI or a skill.

## Every universe has a Universal History

It is created with the universe, and it is the one timeline the author does not control: it cannot be
renamed, moved, or removed. Everything else in the tree is defined by where it sits relative to it, so
it has nowhere to be moved to, and renaming it would rename the frame of reference.

Its id is the fixed string `universal` rather than a minted one. An event can therefore default to it
without a lookup, and code can recognise it without asking the store. Ids are per universe — a store
handle is bound to one — so the same id in every universe collides with nothing.

**A universe that predates this feature gets one on first read.** `timelines()` writes the root if the
file is missing rather than returning an empty list, so nothing downstream has to handle the case
where a universe has no history at all. The write only happens when something was actually missing.

## Fields

| Field | Required | Default |
| --- | --- | --- |
| Name | yes | — |
| Parent Timeline | yes | Universal History |

That is the whole of it. Every timeline has a parent except the root, and a new one goes under the
Universal History unless told otherwise.

## A timeline has no dates

It carries no start year and no end year. **Its span is whatever its events say it is** — the earliest
year filed anywhere beneath it to the latest:

```ts
spanOf(timelines, events, 'reign-of-tarinian')  // → { first: 412, last: 431 }
```

Two things follow. A timeline cannot disagree with its own contents, and a reign that turns out to
have begun a year earlier does not have to be corrected in two places. And the span reaches **the
whole subtree**, not just the events filed directly: the War of the Stewards was fought during the
Reign of King Tarinian, and nothing on the war has to say so.

A timeline with no events has *no* span rather than a zero-length one. "Nothing has been filed here
yet" and "everything here happened in year 0" are different claims, and only one of them is usually
true.

`spanOf` takes years already numeric. What a year *is* belongs to the `history` spec, not to this: a
universe may count in years, reigns or ages, and whatever turns one into something comparable belongs
beside the field that holds it.

## The rules, and where they live

All of them are checked in code against the actual tree, never asked of a prompt. `assertValidPlacement`
runs on every add and every edit, so the same rules hold however a change arrives:

| | |
| --- | --- |
| A name is required | and unique within the universe, case-insensitively |
| A parent must exist | and defaults to the root |
| A timeline is not its own parent | nor its own ancestor |
| **No cycles** | moving a timeline under its own descendant is refused |
| The root has no parent | and cannot be given one |

The cycle check is the one that matters. Moving the History of Waresia under the War of the Stewards
would cut both loose: the pair would still point at each other, and nothing walking down from the
Universal History would ever reach either again.

### Removing one promotes its children

Deleting the Reign of King Tarinian says the reign is not a useful grouping. It does not say the War
of the Stewards never happened — so the war moves up to take the reign's place:

```
Removed "History of Waresia". 2 timeline(s) moved up to Universal History:
Reign of King Tarinian, War of the Stewards.
```

**Still open:** what happens to the *events* filed under a removed timeline. Nothing can be filed
under one yet, so there is nothing to strand; when the `history` container lands, removal will have to
either move its events up alongside its children or refuse while any remain. That is a decision about
history, not about timelines, and it belongs with the spec that introduces them.

### Reading a broken tree

`treeOf` re-hangs a timeline whose parent has gone missing onto the root rather than dropping it. The
store does not allow that to happen; a file edited by hand can. Losing a stretch of history to a typo
is worse than showing it in the wrong place.

## From the CLI

```bash
sb timelines                               # the tree
sb new-timeline "Reign of King Tarinian" --under "History of Waresia"
sb rename-timeline <ref> --name "The Long Reign"
sb move-timeline <ref> --under <ref>
sb remove-timeline <ref>
```

A `<ref>` is a timeline id or its name — names are unique within a universe, so trying each in turn is
honest rather than ambiguous.

## From the bridge

| | |
| --- | --- |
| `GET /api/timelines?universe=` | the tree, flattened, with a `depth` on each |
| `POST /api/timelines` | `{ universe, name, parent? }` |
| `PATCH /api/timelines` | `{ universe, id, name?, parent? }` |
| `DELETE /api/timelines?universe=&id=` | |

The list comes back in tree order with a depth rather than nested, because every consumer so far wants
to draw an indented list — and because the arranging is done by one tested function in the store
rather than a second one in the browser that can drift from it. A rejected placement is a `400` with
the store's own message: the tree said no, which is an answer rather than a fault.

## Where they are kept

`universes/<id>/timelines.json`, beside the manifest rather than inside `store/`. Everything in that
directory is a container, and `containers()` reads it by listing files — so filing timelines there
would put *timelines* in the nav as a thing to write articles about.

## Not yet built

The **UI**. Timelines are worth looking at alongside the events in them, and there are no events yet.
See [containers.md](containers.md) for where `history` will sit.
