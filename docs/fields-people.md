# People fields

The spec lives in [store/src/people-fields.ts](../store/src/people-fields.ts).

Fifty-eight fields, the longest spec in the tool, and deliberately so: a person is what a story is
made of, and the questions worth asking about one do not compress. Only two are required — **Given
Name** and **Overview**. A person can be a name and a sentence and grow the rest as the canon needs
it.

Two things about this spec are unlike the others: [the name arrives in parts](#a-name-in-parts), and
[the form is grouped](#the-form-is-in-sections).

## A name in parts

Every other container has one **Name** field and the item's name is what was typed into it. A
person's arrives as four answers to four questions, and is one string by the time it is stored:

```
Given Name   Aldrica  ─┐
Middle Name  Corvane   ├─ item name: "Aldrica Corvane Vane III"
Family Name  Vane      │
Suffix       III      ─┘
```

Any field may declare `storeAs: 'name'`, and when more than one does, the item's name is those fields
joined in spec order. Each part is *also* kept in `attributes`, so the form can offer them back
separately — a name that arrives in parts has to be stored in parts to be edited in parts, and has to
be one string to title an article and to be found by anything looking for it.

**The honorific is not part of it.** *Queen* is how a person is addressed, not what they are called.
Folded into the name, every mention of Aldrica Vane elsewhere in the canon would fail to find the
article about Queen Aldrica Vane. It is stored as an ordinary attribute.

Blank parts are skipped, so a ferryman called Corr is an article titled `Corr`.

**Pronunciation** — [common to every container](containers.md#fields-every-container-gets) — is
anchored on the name rather than on a field called `name`, which this container does not have. It
lands after **Suffix**, the last piece of the name, and joins that section of the form.

## Nicknames are the item's aliases

**Nicknames/Aliases** declares `storeAs: 'aliases'`, so it writes to the column the store already
keeps for the purpose. That is not tidiness — it is what makes the rest of the tool behave:

- a mention of *the Ashkeeper* in any other article [links to this one](cross-references.md);
- [stub-forge](stubs.md) does not raise a stub for a name this person already answers to;
- `sb resolve` finds them by any of their names.

## The dates are the store's dates

**Birth Year** maps onto `beginDate` and **Death Year** onto `endDate`, the same two columns a city's
founding and drowning use. So a person reads back the way everything else does:

```
Aldrica Corvane Vane III - people - id 026f6105 (412 - 478; NO LONGER EXTANT)
Also known as: the Ashkeeper, Red Aldrica
```

**A blank Death Year is the one field here that makes no claim.** It covers a person who is alive and
a person whose death nobody recorded, and it does not say which. Lao Tzu is as certainly dead as
anyone and no year of it survives; Jimmy Hoffa almost certainly died in 1975 and might not have.

So the year is a *string*, and an author who knows a life ended without knowing when should say so
rather than leave the field empty:

```
Aldrica Vane - people - id 8ae285ba (from 412)
Jimmy Hoffa  - people - id 11a756af (1913 - probably 1975; NO LONGER EXTANT)
Lao Tzu      - people - id abd4d8da (about -570 - unknown; NO LONGER EXTANT)
```

Nothing does arithmetic on these, so `unknown` and `some years after 1104` are as usable as `478`.
What matters is that *something* is there: an empty field is what lets a philosopher dead two
millennia walk into a later scene. The brief reads `from 412` rather than `since 412` for the same
reason — the first says where the record starts, the second quietly asserts it never stopped.

**Birth Day** and **Death Day** stay ordinary attributes. Only the year is comparable across a
calendar this tool knows nothing about, and a column that sometimes holds `412` and sometimes holds
`4th of Hallowing, 412` is a column nothing can sort.

## The form is in sections

Fifty-eight fields in one column is a wall. A field may name the `group` it belongs to, and the form
draws a heading wherever the group changes:

| Section | Covers |
| --- | --- |
| **Name** | Honorific, the four name parts, pronunciation, nicknames |
| **In brief** | Overview, species, ethnicity, titles |
| **Life and death** | Birth and death years and days, and the places of both |
| **Family** | Parents, siblings, partners, children |
| **Body** | Sex, gender, eyes, hair, skin, height, weight |
| **Standing** | Languages, archetype, associations, religious beliefs |
| **Appearance** | Physical description, body and facial features, identifying marks, special abilities, apparel |
| **Life and experience** | Personal history, sexuality, education, employment, accomplishments, failures, trauma |
| **Character** | Intellect, morality, taboos, motivations, virtues, vices, tics, hygiene |
| **Ties and legacy** | Legacy, relationships, family ties, pets and hobbies, financial history |

Sections are **runs of the spec**, not a re-sort of it. The order above is the order the fields were
specified in; grouping only draws a line where the group changes, and a group that appeared twice
would mean the form had pulled fields out of the order they were declared in. A spec that names no
groups renders exactly as it did before sections existed, which is why nothing changed for fauna or
locations.

## Two fields worth reading twice

**Archetype** takes any known character as an analog — from any story, in or out of this universe.
Naming *Luke Skywalker* says where to start reading this person; it does not say they are modelled on
him in every particular. It is shorthand for a writer, and the generator is told as much, so it does
not go looking for a Death Star.

**Associations** is a list because one person is several things at once: prince of a region, member of
a society that does not admit to existing, founder of a guild. Each entry links to its own article
where one exists.

## Two shapes, again

Short fields — the name parts, the dates, sex, height, archetype, hygiene — gather into the compact
facts block above the prose. Long fields render as sections in spec order. Lists count as short. See
[fields-fauna.md](fields-fauna.md#two-shapes-of-field).
