# Fill rates

An optional field is not one a generator may skip if it feels like it. Handed one, a model fills it —
every time, without fail. Ask fifty people for an honorific and you get fifty Captains.

So how often a field is filled at all is declared on the field and **rolled in code**:

```ts
{
  key: 'honorific',
  label: 'Honorific/Title',
  required: false,
  fillRate: 0.15,
  ...
}
```

`rollOmissions(container)` reads them off the spec and returns the keys this particular article does
not have. Those keys never enter the generation request, so there is nothing for a model to helpfully
fill in.

## What the number means

**The share of articles in which this field comes back non-empty.** It covers two things that reduce
to the same operation:

- fields most people do not *have* — an honorific, a suffix, a special ability in a world with no
  magic;
- fields everyone has and few articles bother to *record* — what they keep as pets, what they will not
  talk about.

Either way the question is how often it should be filled, and the answer is not "always".

## The rules

**No rate means always.** Every spec behaved that way before this existed, and most fields still
should: whatever else rolls away, an article still has to be an article. Overview, Personal History,
Physical Description and Motivations carry no rate on purpose.

**A required field is never omitted**, whatever its spec claims. Required means filled by definition.

**It applies to filling a whole form, not to Regenerate.** Clicking Regenerate on Honorific is a
direct request and is always honoured — you asked for an honorific, you get one. A rate only decides
whether the field is *offered* when the whole article is being written at once.

**A skipped field says so.** Otherwise an author looking at an empty Honorific cannot tell whether the
generator skipped it, failed at it, or decided this person has none — and the third is the answer,
which is the whole point:

> Left blank on purpose — not everyone has one: Honorific/Title, Middle Name, Suffix, Titles,
> Identifying Characteristics, Special Abilities, Education, Accomplishments & Achievements, Failures
> & Embarrassments, Trauma, Taboos, Pets & Hobbies. Regenerate any of them to fill it anyway.

## What is declared where

`people` — the container that provoked this:

| Field | Rate | |
| --- | --- | --- |
| Special Abilities | 8% | no magic in this world, and few people anywhere |
| Suffix | 10% | |
| Honorific/Title | 15% | |
| Nicknames/Aliases | 20% | |
| Legacy | 25% | most people leave none worth recording |
| Titles | 25% | |
| Taboos | 30% | |
| Middle Name | 35% | |
| Financial History | 35% | |
| Trauma | 40% | everyone has some; few articles record it |
| Identifying Characteristics | 45% | |
| Pets & Hobbies | 45% | |
| Failures & Embarrassments | 50% | |
| Accomplishments & Achievements | 55% | |
| Education | 60% | |

`locations` (Founders 45%, Existed Until 20%, Native Wildlife 50%, Natural Resources 60%), `fauna`
(Beauty Ideals and Gender Ideals 15%, Domestication and Symbiosis 30%, Historical Impact 35%, Myths
45%, Uses and Cultural Associations 50%) and `history` (Related Ethnicities 40%, Related Institutions
50%, Long-Term Consequences 60%).

**Existed Until at 20%** is the one worth pausing on. It maps to the store's `endDate`, and a blank
there is a claim that a place still stands — so a generator filling it every time was quietly drowning
four cities in five.

## Every container, not just the one with a skeleton

`rollFor()` returns a roll for any container that has a field spec. `people` gets the
[full skeleton](rolled-skeleton.md) — trade, birthplace, lifespan, standing — and everything else gets
the omissions alone, which is already the difference between an article and a form with every box
ticked.

## It also makes the form faster

Fewer fields asked for is fewer fields to write. A person went from **five generation batches to
three**: the roll settles seven fields, omits eight or so, and two more are
[forged in code](names.md).

## Not yet

Rates are per spec, not per universe. A world where titles are ordinary and one where they are rare
currently share a number, and letting a universe override it is the obvious next move — the manifest
is already the place where a world says what it is like.
