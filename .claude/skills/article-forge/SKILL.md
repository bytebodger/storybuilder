---
name: article-forge
description: Generate plausible values for empty or regenerated fields on a canon article form - a creature, a place, an institution - coherent with the fields already filled and with the universe's established canon. Use when an article form is submitted with blanks, or the user asks to suggest or regenerate article details.
writes: false
hidden: true
---

# article-forge

Fill in the blanks on one article, grounded in a world that already exists.

This is `universe-forge`'s sibling, and the difference is the whole point. A universe form has only
itself to cohere with. An article sits inside a universe that has already established its geography,
its peoples, its natural laws — and an article that ignores them is worse than a blank field, because
a blank field is honest.

**Reads:** the universe manifest, and the canon behind anything the article touches.
**Writes:** nothing. It returns proposed values; saving is the author's act.

## Input

```json
{
  "container": "fauna",
  "universe": "phonon",
  "fill": ["ecologyAndHabits", "diet"],
  "current": { "name": "Bottonfly", "description": "Massive insects of the western muddwoods." }
}
```

## Output

A single JSON object containing only the keys in `fill`. No prose, no fences, no commentary. The
caller discards anything else.

## Before generating

1. **Read the universe.** `npm run sb --silent -- --universe $U intro` gives the premise, the natural
   laws and the canon's year span. A creature that flies by magic in a world whose laws say there is
   no magic is not a suggestion, it is a contradiction.

2. **Find what the article should attach to.** If `current` names places, peoples or institutions,
   resolve them: `find "<name>"`, then `brief <id>`. What comes back tells you what is actually
   established about them — and what is closed.

3. **Look at the neighbours.** `containers` and `list <container>` show what this world already has.
   An article that mentions the continent, the peoples and the trade that genuinely exist reads as
   part of a world; one that invents its own supporting cast reads as a fragment from somewhere else.

## Rules

1. **Only the keys in `fill`.** A field absent from that list is locked or already written. Hands off.

2. **Prefer established canon to invention.** When a field needs a place, a people or an organisation,
   reach for one that exists. Inventing a new named entity is allowed but costly: it is a fact nobody
   chose, sitting in prose where no future query will find it. If you do introduce one, keep it to a
   minimum and name it in your reply's reasoning so the author knows to record it.

3. **Never contradict a closed set.** If a brief says a planet has exactly two continents, the
   creature does not range across a third. This is the one failure that makes the tool worse than
   nothing, because the contradiction will be trusted.

4. **Match the field's shape and length.** Most article fields are prose. Two to four sentences unless
   the help text says otherwise — an article is dense, not long.

5. **Write reference, not story.** These are encyclopaedia entries. No plot, no protagonist, no rising
   action. They can carry the world's own uncertainty — "some claim the creature was warped by
   practitioners of dark magic in the unrecorded annals of antiquity" — and attributing a belief to
   the people who hold it is not the same as asserting it.

6. **Be specific, and be concrete.** "A dangerous predator" is not anatomy. "Eight legs, four wings
   too small for its body, beating fast enough to drone" is. Specificity is what the author reacts to;
   a generic value gives them nothing to push against.

7. **Disagreement is the most useful thing you can write.** Where a field invites it — uses, cultural
   associations, myths — say how different peoples regard the thing differently. One group's staple
   food is another's disgusting barbarism, and that friction is what a story can later use.

8. **Cohere across the fields you generate**, not just with `current`. Diet, ecology and anatomy have
   to describe one animal.
