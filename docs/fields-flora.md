# Flora fields

The spec lives in [store/src/flora-fields.ts](../store/src/flora-fields.ts).

[Fauna](fields-fauna.md)'s sibling, and shaped like it on purpose: the short reference facts first,
looked up rather than read, then the prose. For plants distinctive enough to warrant an article —
Witch's Bane Nettle, not corn.

| Field | Stored as | Covers |
| --- | --- | --- |
| Name | item name | Required. The in-world common name. |
| Pronunciation | attribute | [Common to every container](containers.md#fields-every-container-gets). |
| Conservation Status | attribute | How it stands, in this world's terms. |
| Scientific Name | attribute | Blank if this world has no naturalists. |
| Lifespan | attribute | A season, a few years, centuries. |
| Average Height | attribute | With the unit. |
| Average Width | attribute | How far it spreads — a shrub's breadth, a tree's canopy. |
| Colorings | attribute | Leaf, stem, flower, fruit — briefly. |
| Geographic Origin and Distribution | attribute | Where it began, how far it spread, where it will not grow. |
| Description | item summary | The opening paragraph. Shown wherever the plant is mentioned. |
| Anatomy | attribute | Form, and what distinguishes it on sight, smell and touch. |
| Reproduction | attribute | Seed, spore, runner, cutting — and what carries it. |
| Growth Rates & Stages | attribute | Seed to maturity, and how it changes across a year. |
| Habitats | attribute | The ground it needs, its neighbours, and what kills it. |
| Domestication | attribute | Whether it became a crop, and why not, if not. |
| Uses, Products & Exploitation | attribute | What people take from it, and who controls the trade. |
| Symbiotic and Parasitic Organisms | attribute | What lives on it, in it, or beside it. |
| History | attribute | Events it shaped, and how it first became known. |

The seven short fields, Pronunciation included, are `text` and sit beside the prose as facts, the same
[two shapes of field](fields-fauna.md#two-shapes-of-field) fauna uses. The measurements are height and
width rather than fauna's weight and length: a plant is described by how tall it stands and how far it
spreads, and almost nobody weighs one. Colorings is one of them: the
colours on sight, briefly, with how they turn through the year left to Growth Rates & Stages.

Description is optional and comes eleventh, after the facts, where the spec puts it. It is still stored
as the summary, so every other article shows it when the plant is mentioned — position in the form
changes nothing about that.

## Fill rates

| Field | Rate | |
| --- | --- | --- |
| Symbiotic and Parasitic Organisms | 30% | as for fauna |
| Domestication | 40% | |
| History | 40% | |
| Uses, Products & Exploitation | 60% | higher than fauna's 50%: a plant worth an article is usually worth one for its uses |

Everything else carries no rate, the measurements included, since nearly every plant has a height and a
spread. See
[fill-rates.md](fill-rates.md).
