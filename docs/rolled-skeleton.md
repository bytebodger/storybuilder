# The rolled skeleton

Canon should **constrain, not compose**.

It is very good at the first — *what does this world forbid* — and hopeless at the second. Asked which
of the permitted things a person is, a model does not sample. It reaches for whatever the canon makes
loudest, every single time.

The code is [store/src/skeleton.ts](../store/src/skeleton.ts), pure and seedable. The bridge serves it
at `GET /api/skeleton`, and the article form applies it before it asks for a single word.

## What went wrong without it

Phonon's manifest says: genre **maritime adventure**, theme **the folly of unbridled ambition**,
natural law **an ocean no one has crossed and returned from**.

Every person generated in it came back a sea captain who had died trying to cross the Sunder.

That is not a failure of imagination. It is the highest-scoring answer to the question as asked — the
most on-theme person the world can contain. The bug was in the rubric: **a theme is what a story is
about, not what every person in the world is about.** Most people in a world about unbridled ambition
are the ones who watched somebody ambitious drown. A world with an uncrossable ocean still has
magistrates and cooks who have never once thought about crossing it.

## Randomness in code, coherence in the model

The die settles what a die can settle, against what the store actually holds:

| Rolled | From |
| --- | --- |
| Given and family name | [forged in code](names.md) - usually from their own people's common names, never only from them |
| Trade | the universe's professions list |
| Place of birth | the `locations` it holds |
| Ethnicity | the `ethnicities` it holds |
| Sex, gender | the words this universe has already used, ours only as a fallback |
| Birth year | the canon's span |
| Death year | birth plus an unremarkable lifespan, and 85% of the time an unremarkable death |
| Events they lived through | the timeline, filtered to their lifetime |
| Whether they have a title at all | see below |
| How close they stand to what the world is *about* | see below |

Nothing is invented. A universe with no ethnicities recorded rolls no ethnicity and leaves the field
blank, because inventing one is the behaviour this exists to prevent.

The notes are handed to the generator under a heading that says they are settled — not a starting
point, not a suggestion. Handed bare facts with no framing, a model treats them as a draft to improve
on, which puts back exactly the salience-seeking the roll removed.

## The two rolls that do the most work

### Standing

How close this person is to what the universe is about: **75% not at all, 20% adjacent, 5% caught up
in it.** Without this dial every generated person is a protagonist, and a world made entirely of
protagonists is a world where nobody bakes bread. It is also what stops every biography ending in a
doomed crossing.

### Fields most articles simply do not have

A model handed an optional field fills it. Asked for an honorific it returns one, and every person in
the world comes back a Captain with three swashbuckling nicknames. **The only way to get a person with
no title is not to ask.**

This began as five hardcoded probabilities here and is now
[`fillRate` on the field spec](fill-rates.md), which every container gets. The roll reads them off the
spec, so a container's shape is described in one place rather than two.

## Aiming it at a year

Left blank, birth is uniform across the whole canon — a person from anywhere in its history, which is
what most worldbuilding wants. About nineteen in twenty come back already dead, and that is correct
for a population of everyone who ever lived.

Give the form a year and it produces **someone alive in that year** instead.

This replaced a living-or-historical switch, which was the wrong question. A year says *which* past,
and someone who wants a living character can move the years themselves afterward. It also earns its
keep against the timeline: the events recorded near the target are handed to the generator **nearest
first**, so a year aimed at a crowded decade is written against that decade rather than whichever
eight events happened to be listed.

```
Write someone alive in year 435. They were born in 388 and were about 47 that year.
Recorded events within their lifetime, nearest 435 first: The Cooper's Strike (430),
The Souring (431), The Drowning of the Merrow (432), The Reckoning of Weights (433),
The Long Damp (434), The Purser's Flight (436), The Second Ash Fire (437),
The Quiet Winter (438), and 3 more.
```

**Birth may precede year 0.** Year 0 is where the records begin, not where the world did. Clamped
there, everyone alive in year 5 came out a toddler — the only people who could have been born inside
the canon by then. A negative birth year is allowed and explains itself: *they are older than the
chronicle, and their early life is outside what anyone wrote down.*

Only containers whose roll uses a year are offered one. `GET /api/fields` reports it as `accepts`, so
the form knows before anything is pressed.

## It also makes the form feel faster

The roll costs milliseconds against a minute for a generation, so five fields land **one second** after
the button is pressed, and the prose is written around facts already on screen. It removes fields from
the request too — a person went from five batches to four.

## Before and after

Phonon, same universe, same button:

```
before   Captain <name>, a sea captain, died attempting the Sunder crossing
         (every time)

after    fuller · servingmaid · sailmaker · cutler · distiller · tavernkeeper
         chandler · tattooist · midwife · scribe · mason · armourer
```

And one written out in full: **Hesker Brack**, a watchman of the port of Kell who kept its harbour ward
for forty years, Kellish, poor his whole life, rang the Low Watch bell and turned drunks off the
wharves. He feared being pensioned off as useless more than he feared dying, and wanted his son to
have wharf work that would not break him the way netmending broke his father. Born Dol 74, died 141 —
both years rolled before a word was written.

## Phonon's professions list

148 entries, of which **12% touch the sea**. That ratio is the correction: in a world whose genre is
maritime adventure, most people are still tanners and midwives and gravediggers. The list is the one
mechanism that was already designed to prevent this — it is carried into every brief so a generator
cannot invent a trade the world has no room for — and it was empty.

## What this does not fix

Fleshing out a universe helps but does not cure the underlying behaviour. More canon means more
attractors competing, so less collapse onto one — but the mechanism is salience-seeking, not scarcity.
Import a large map and the generator will over-index on whatever that map made most prominent. The
roll is the fix; canon volume only raises the floor.

Containers other than `people` have no roll yet and generate exactly as before.
