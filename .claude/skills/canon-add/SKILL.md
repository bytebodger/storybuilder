---
name: canon-add
description: Record a new entity in a universe's canon - a country, city, character, religion, faction, legend - placing it in the right container and wiring its relations. Use when the user wants to add something to the world, establish a new place or person, or write down a fact they just invented.
writes: true
args: [{"name":"entity","label":"What to record","placeholder":"A fishing town on Kell's north coast called Vess","multiline":true,"required":true},{"name":"facts","label":"Established facts (optional)","multiline":true}]
---

# canon-add

Write something into the store so it is still true in eighteen months.

**Reads:** the manifest, and the neighbourhood of everything the new item touches.
**Writes:** one item, and its links. Nothing else.

## Before writing anything

1. **Read the constraints.** `npm run sb --silent -- --universe $U intro` — the natural laws and the
   canon's year span bound what can exist.

2. **Check it isn't already there.** `npm run sb --silent -- --universe $U find "<name>"`. A second Kell is worse than no Kell: the
   duplicate will be found by half the future queries and missed by the other half. If it exists,
   say so and offer to update it instead.

3. **Pick the container from what is in use.** `npm run sb --silent -- --universe $U containers` lists them. Reuse an existing one
   wherever it fits — `city` and `town` as separate containers will fragment every future query, and
   nothing distinguishes them that an attribute could not. Introduce a new container only for a
   genuinely new kind of thing, and say that you are doing so.

4. **Read the neighbourhood of whatever it attaches to.** `npm run sb --silent -- --universe $U brief <parent-id>`. This is where you find
   out that the parent's set is closed before you try to widen it.

## Writing

```bash
npm run sb --silent -- --universe $U add <container> "<Name>" \
  --summary "One or two sentences." --link <id> --link <id>
```

- **Link generously, in both directions of interest.** Links are what make the one-pass read work: a
  country that is linked to its continent, cities, religions and peoples can be briefed completely in
  one call. A country linked to nothing is invisible to every future query.
- **Use `--role` when the relation type is ambiguous.** Two countries can be neighbours or
  belligerents. `npm run sb --silent -- --universe $U link <a> <b> --role "at war with" --reverse-role "occupied by"`.
- **Record dates when they are known.** `--begin` and `--end` are free-form: "Year 198", "Third Age,
  late". An entity that ended still belongs in its container; the end date is what keeps it from
  walking around in a present-day scene.
- **Summaries are for reading in passing.** One or two sentences, concrete. This is what every future
  brief will show when the item is mentioned in a list.

## When the store refuses

A `CANON VIOLATION` is an answer, not an obstacle. It means the parent's set of this kind of thing is
closed, and the message names the members and the reason it was closed.

**Stop and tell the author.** Show them the reason, and the three ways forward the message names: it
is not that kind of thing, it belongs in a different container, or the set was closed too early and
should be deliberately reopened. Reopening is an ordinary authorial decision — worlds grow, and a set
closed in an early pass is often simply wrong — but it is *theirs*, not yours.

Never work around a refusal by renaming the item, attaching it somewhere else, or putting it in a
different container to slip past the check.

## Never close a set

Do not run `set-closure` on your own initiative, and never as a side effect of recording facts.

An author saying "Kell has three religions" almost always means *three that matter* — closing that
set walls off the upland cult they have not invented yet. Closure is for sets that are structurally
bounded: continents, moons, the founding members of an order. If a set looks genuinely bounded, say
so and propose closing it with a reason. Let the author decide.

## Afterwards

The store writes immediately; git is the undo. Show what changed and how to reverse it:

```bash
git diff --stat universes/$U
```

Then report the new item's id, what it was linked to, and anything you deliberately did not record
because it was not established.
