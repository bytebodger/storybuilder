# Affliction fields

The spec lives in [store/src/afflictions-fields.ts](../store/src/afflictions-fields.ts).

The container is broad on purpose: a disease, a disorder particular to this world, or a curse laid on a
whole people. One spec has to serve all three, so the fields are the questions every affliction has an
answer to, and the help text says what each means for the kinds it barely fits.

| Field | Stored as | Covers |
| --- | --- | --- |
| Name | item name | Required. What the people who suffer it call it. |
| Pronunciation | attribute | [Common to every container](containers.md#fields-every-container-gets). |
| Description | item summary | What it is, whom it strikes, why it is feared. Shown wherever it is mentioned. |
| Transmission/Vectors | attribute | How it passes on — including inheritance, for a curse. |
| Cause | attribute | What brings it on, believed and actual. |
| Symptoms | attribute | First sign, course, and what it looks like at its worst. |
| Treatment | attribute | What is done for it, and whether it works. |
| Prognosis | attribute | How it ends, how long that takes, what survivors are left with. |
| Affected Groups | attribute | Whom it strikes and whom it spares, and why. |
| Hosts and Carriers | attribute | What harbours it without suffering it. |
| Prevention | attribute | The sensible, the superstitious and the enforced. |
| Epidemiology | attribute | Where it occurs, how widely, and where it never does. |
| History | attribute | First record, worst outbreaks, how understanding changed. |
| Cultural Impact | attribute | Stigma, customs, laws, sayings — and which groups hold them. |

## One set of fields, three kinds of affliction

The same field asks a different question of each:

| | Disease | Disorder | Curse |
| --- | --- | --- | --- |
| **Transmission** | breath, water, a bite | usually nothing | a bloodline, an oath, a place |
| **Cause** | whatever the world thinks causes it | the same, often less agreed | who laid it, and why |
| **Treatment** | remedies, some useless | care, confinement, custom | the terms on which it lifts, if any |
| **Hosts and Carriers** | rats, wells, the untroubled | none | none, or an heir who has not yet shown it |

## Every field but the name is prose

Even Prognosis. "Fatal" with no course, no timescale and no survivors is a worse answer than a
sentence, and the article view gives it a section rather than squeezing it into the facts block beside
the pronunciation.

## What the world believes, and what is so

Cause, Treatment and Prevention each ask for both. A world without germ theory still has a cause for
its fevers, and a remedy that does nothing is still the remedy everyone uses. Both are canon; marking
which is which is what the [fauna spec](fields-fauna.md#depth-in-one-example) calls *record and
folklore are different claims*, and it is the most story-bearing thing an affliction article can say.

## Fill rates

| Field | Rate | |
| --- | --- | --- |
| Hosts and Carriers | 35% | most afflictions have none worth naming |
| Prevention | 50% | |
| Cultural Impact | 50% | |
| Transmission/Vectors | 55% | a disorder does not spread, and a model asked how it spreads will say |
| History | 60% | |

Description, Cause, Symptoms, Treatment, Prognosis, Affected Groups and Epidemiology carry no rate.
Whatever rolls away, an affliction article still says what it does, to whom, and how it ends. See
[fill-rates.md](fill-rates.md).

## What this does not fix

Transmission at 55% is a coin toss, not a judgement. It will sometimes give a disorder vectors and
sometimes leave a plague without any, because the roll does not know which kind of affliction it is
rolling for.

The real fix is the one `people` already has: a [roll](rolled-skeleton.md) that settles disease,
disorder or curse before anything is asked, and sets the rates from that. Without it, expect the
[same salience problem](rolled-skeleton.md#what-went-wrong-without-it) people had. In a world whose
genre is maritime adventure, every affliction will come back something sailors catch.
