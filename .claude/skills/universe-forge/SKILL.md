---
name: universe-forge
description: Generate plausible values for empty or regenerated fields on a universe form, coherent with the fields already filled. Use when creating a new universe, when the user asks to suggest or regenerate universe details (name, genre, tone, themes, scale, natural laws, origins, geography, cultures, inspiration), or when a universe form is submitted with blanks.
writes: false
# Driven by the universe form, which supplies its own inputs - not listed in the skill console.
hidden: true
---

# universe-forge

Fill in the blanks on a universe manifest, and nothing else.

For articles *inside* a universe - a creature, a place, an institution - use `article-forge` instead.
That one has canon to cohere with; this one is what canon is built on top of.

The universe form gives the author total freedom to write every field themselves. This skill exists
for the rest of the time — the blank field they'd rather brainstorm than agonise over. It is a
suggestion engine, not an author.

**Reads:** the current form values, and the field spec in
[store/src/universe-fields.ts](../../../store/src/universe-fields.ts).
**Writes:** nothing. It returns proposed values; saving is a separate act the author takes.

## Input

```json
{
  "fill": ["tone", "themes"],
  "current": { "name": "Exoria", "genres": ["space opera"], "totalYears": 4000 }
}
```

`fill` is the list of field keys to generate. `current` is every value the form already holds.

## Output

A single JSON object, and nothing else. No prose, no explanation, no code fence commentary.

```json
{ "tone": "elegiac", "themes": ["the quest to recover lost knowledge", "..."] }
```

## Rules

1. **Generate only the keys in `fill`.** Never return a key that wasn't asked for, even if you think
   the value is wrong or missing. A field absent from `fill` is either locked or already written by
   the author, and both mean hands off. The caller discards unrequested keys, so returning them just
   wastes the run.

2. **Cohere with `current`.** This is the whole job. The values in `current` are fixed points, and
   what you generate has to sit plausibly beside them. A universe with genre "high fantasy" does not
   get the recurring theme "rival states racing to build ever larger nuclear arsenals." If you are
   filling several fields at once, they must cohere with each other as well — one imagined world, not
   a list of independently plausible answers.

3. **Cohere across the whole set, not pairwise.** Scale, geography, and natural laws especially pull
   on each other: a `galactic` scale with geography about a single mountain range is incoherent even
   though neither field is wrong alone.

4. **Match the field's shape.** `genres`, `themes` and `inspiration` are arrays of short strings.
   `totalYears` is a number. `naturalLaws`, `origins`, `geography` and `cultures` are prose — two to
   four sentences, concrete, no throat-clearing. `name`, `tone` and `scale` are short strings.

5. **Use the field's own description.** Each field in the spec carries a `help` string saying what it
   is for and an `examples` list. The examples are calibration, not a menu — matching their register
   and specificity is the point, reusing them verbatim is not.

6. **Be specific.** "A world of magic and wonder" is not a natural law. "Magic works only on things
   that have been given a true name, and names can be stolen" is. Specificity is what makes a
   suggestion useful to react to — the author's job is to accept, reject, or edit, and a generic
   value gives them nothing to push against.

7. **Don't gold-plate the name.** If `name` is in `fill`, give one name, not a list with commentary.

## When the form is nearly empty

With little or no `current` to anchor to, decide the world's centre first — usually genre and scale —
and derive everything else from it, so the result is one coherent premise rather than a scatter of
unrelated plausible answers. Do not ask the author clarifying questions; they asked for a suggestion,
and a suggestion they dislike is easy to regenerate.
