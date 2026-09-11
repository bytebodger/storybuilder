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
45%, Uses and Cultural Associations 50%), `history` (Related Ethnicities 40%, Related Institutions
50%, Long-Term Consequences 60%), `afflictions` (Hosts and Carriers 35%, Prevention and Cultural
Impact 50%, Transmission 55%, History 60%), `cosmology` (Alternative Names, Associated Legends and
History 50%, Localized Impact 60%, Known Cycles 70%), `documents` (Legal Impact 35%, Related
Documents and Term 40%, Key Passages, Cultural Impact, Public Reception and Legacy 50%, History 60%,
Authors 75%) and `ethnicities` (Unisex Names and Major Historical Figures 40%; Birth and
Coming-of-Age Rites, Beauty, Courtship and Relationship Ideals, and Associated Institutions 50%;
Etiquette, Art & Architecture, Taboos, Myths & Legends and Gender Ideals 60%; Traditional Styles
70%) and `flora` (Symbiosis 30%, Domestication and History 40%, Uses 60%), `geography` (Tourism 30%,
Religious Significance 40%, Localized Phenomena, Climate, History and Ethnic Significance 50%, Natural
Resources 60%), [`institutions`](fields-institutions.md#not-every-institution-is-a-small-state), whose
twenty-two rates run from 20% to 60% and are listed on its own page, and `languages` (Morphology,
Syntax and Sentence Structure 40%, Phonology and Parent Languages 50%, Writing System, Vocabulary and
Cultural Significance 60%).

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

## A universe overrides what it disagrees with

The spec's number is a sensible default **across** worlds, not a fact about any of them. A court
chronicle and a fishing village disagree about how many people have a title, and both are right. So a
manifest carries the rates it differs on, and only those:

```json
"fillRates": {
  "people": { "specialAbilities": 0, "nicknames": 0.3 }
}
```

That is Phonon's, and its own laws argue for it: the manifest says **"No magic. The only unexplained
thing in the world is the Sunder Ocean"** — a world that means that should not be handing out special
abilities at the spec's 8%. Sailors, on the other hand, have nicknames.

**Zero means never, and is not the same as saying nothing.** A field with no override falls through to
the spec; a field set to `0` is switched off for this world. The lookup keeps absent and zero apart on
purpose.

**A required field stays required.** Setting `overview: 0` does nothing, because required means filled
by definition.

**A nonsense number is clamped, not obeyed.** A manifest is a file people edit by hand, so the roll
copes and `sb validate` is where the author hears about it:

```
WARNING: Fill rate set for people.honorrific, which is not a field of people
WARNING: Fill rate set for people.overview, which is required and is always filled
WARNING: Fill rates are set for "legends", which has no field spec - they do nothing
WARNING: Fill rate for locations.founders is 4 - expected a share between 0 and 1
```

A typo in a container or field name is otherwise perfectly silent: the override is never consulted,
the field keeps its default, nothing looks wrong, and the world does not behave the way its author
said it should.

### From the CLI

```bash
sb fill-rates [container]                       # effective rates, and what this world changed
sb set-fill-rate people honorific 0.7
sb set-fill-rate people honorific default       # drop the override
```

```
people
  Honorific/Title                   70%  <- set for this universe (spec says 15%)
  Given Name                       100%  (required, always)
  Middle Name                       35%
  Nicknames/Aliases                 30%  <- set for this universe (spec says 20%)
  Special Abilities                  0%  <- set for this universe (spec says 8%)
```

Only fields that are not always filled are listed, plus the required ones, so the output is the
exceptions rather than the whole spec.

## Not yet

No console UI. A per-field rate editor across fifty-eight fields is a real design problem, and the
manifest plus the CLI is enough control to find out what the numbers should be first.
