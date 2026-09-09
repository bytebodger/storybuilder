---
name: stub-forge
description: Read a saved article and propose stub placeholders for in-universe terms it references but does not explain - people, places, orders, creatures. Use after an article is saved, or when the user asks what loose ends an article left behind.
writes: false
hidden: true
---

# stub-forge

Find what an article leans on that the world has not yet written down.

Worldbuilding cascades. An article about the Dawn Reavers mentions Parth, where they are based; Parth
would mention the families that run its docks; those would mention the guild that licenses them.
Writing every supporting article first means never finishing the first one. So the references get
recorded as **stubs** — a name and a container, nothing else — and the author writes them when they
choose.

**Reads:** the saved article, and the universe's existing items.
**Writes:** nothing. It proposes; the author accepts or rejects each one, and the bridge creates what
they accept.

## Input

```json
{
  "universe": "phonon",
  "container": "fauna",
  "item": { "id": "c1cba029", "name": "Bottonfly" },
  "fields": {
    "description": "Massive insects of the muddwood regions, central to casterway societies.",
    "domestication": "Famously domesticated by Antin Forin, third potentate of the Archane Order."
  }
}
```

Only fields the author actually filled are passed. A blank field was left blank deliberately and has
nothing to scan.

## Output

A single JSON object. No prose, no fences.

```json
{
  "candidates": [
    { "term": "Antin Forin", "container": "people", "context": "third potentate of the Archane Order", "field": "domestication" },
    { "term": "Archane Order", "container": "institutions", "context": "an order with potentates", "field": "domestication" },
    { "term": "muddwood", "container": "geography", "context": "a region type the creature inhabits", "field": "description" },
    { "term": "casterway", "container": "ethnicities", "context": "a people who use the creature", "field": "description" }
  ]
}
```

- **`term`** — the name as it should be titled, not as it appeared inflected. "casterway societies"
  yields `casterway`; "the Archane Order's" yields `Archane Order`.
- **`container`** — your best guess from the container catalog. The author can change it, so guess
  rather than omitting; a wrong guess costs one dropdown, a missing one costs attention.
- **`context`** — a short phrase, from the article, saying what the term appears to be. This is what
  the author reads when deciding, and it is what the eventual stub is worth having.
- **`field`** — which field it came from.

## What to propose

1. **Proper nouns that are not explained.** People, orders, ships, cities, battles. The easiest and
   usually the most valuable.

2. **Common nouns that are clearly of this world.** `thorinfly`, `muddwood`, `casterway`. These are
   often *more* valuable than proper nouns, because they are the vocabulary a world is actually built
   from, and they are the ones a later reader will not recognise as invented.

3. **Terms used as though the reader knows them.** The tell is a definite article or an appositive
   doing work no earlier sentence did: "the Sundering", "the third potentate".

## What not to propose

- **Anything the store already has.** Do check — `npm run sb --silent -- --universe $U resolve "<term>"`
  will tell you, and it understands plurals, articles, possessives and aliases, so "thorinfly" finds
  an existing "Thorinflies". The bridge filters your list against the store again before the author
  sees it, so a duplicate is not a disaster, but a candidate list padded with things that already
  exist trains the author to skim.
- **The article's own subject**, or its aliases.
- **Ordinary English.** "Canopy", "harbour", "mating season" are not world vocabulary. If the term
  would appear unremarked in a book about our world, leave it.
- **Adjectives and descriptions that only look like names.** "the deep rust dyers prize" names no
  thing.
- **Every variant of one term.** Propose it once, under the title it should have.

## Judgement

Be willing to propose a handful, not a hundred. A long list is a chore and gets rejected wholesale; a
short list of the terms the world genuinely rests on gets accepted. If an article mentions twenty
things and four of them matter, propose four.

If nothing qualifies, return `{"candidates": []}`. That is a good outcome, not a failed run.

Do **not** write the stubs, and do not draft any content for them. A stub is a name and a container.
Generating articles for the stubs would spawn references of their own, and the cascade would not stop.
