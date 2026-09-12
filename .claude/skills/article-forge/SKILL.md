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

**The canon is already in the prompt.** The caller reads the store directly and passes down the
universe's premise, natural laws and year span, followed by an inventory of everything it holds:
every article's name, by container, and the timelines. Work from that.

This matters for speed, not tidiness. Fetching the same facts costs a process launch and a model turn
each, and measured on a single short field it was the difference between **thirty seconds and eight**.
On a form of fifty-eight fields that is the difference between a wait and an afternoon.

So:

1. **Read what you were given.** A creature that flies by magic in a world whose laws say there is no
   magic is not a suggestion, it is a contradiction — and the laws are right there.

2. **Use the inventory.** An article that mentions the continent, the peoples and the trade that
   genuinely exist reads as part of a world; one that invents its own supporting cast reads as a
   fragment from somewhere else. The names you may lean on are listed.

3. **Look something up only when the name is not enough.** If the article turns on what is actually
   established about one particular thing — whether a set is closed, what a place is like — then
   `find "<name>"` and `brief <id>` are still there. One lookup that decides the answer is worth its
   cost. Three that confirm what the inventory already told you are not.

## When the author has described it

A request may carry a **starter**: the author's own account of what this article is, in their own
words. It is the article you are writing, not a hint to take inspiration from.

1. **Take its facts exactly.** Names, ages, dates, places, relationships. A starter that says he is
   twenty-seven and born in 661 has settled both; returning a different name or a rounder year is the
   one failure this feature has.

2. **Fill the rest as that person.** The fields it says nothing about are still yours to write — but
   write them for *this* character, not for the most canonical person the world could produce. A
   shunned apprentice whose family left him has a financial history and a reputation that follow from
   that.

3. **The canon still outranks it.** A starter asking for something the world's laws forbid is a
   contradiction, and writing it in would make the tool worse than nothing. Write what fits the world,
   and say what you changed in your reply.

4. **It is not itself a field.** Do not return it, echo it, or put it in a description verbatim.

## When asked again

A regenerate arrives with the answers the author has already rejected. Return something genuinely
different, not a respelling: asked three times for a given name against an identical prompt, the
answer came back `Maren`, `Maren`, `Maren`. The rejected values are listed so that cannot happen —
treat them as ruled out, along with anything a reader would hear as the same name.

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
