# Fauna fields

The spec lives in [store/src/fauna-fields.ts](../store/src/fauna-fields.ts). This page is the worked
example — what a filled-in article looks like, and at what depth.

An article for `fauna` is a reference entry, not a story. It can be vivid, and it can carry the
world's own uncertainty, but it has no plot and no protagonist. See
[containers.md](containers.md#articles-are-not-stories).

## The fields

**Name** and **Description** are required; everything else is optional, and an empty field is
honest — it means nothing has been established, and briefs stay silent about it rather than inviting
a skill to fill the gap.

| Field | Stored as | Covers |
| --- | --- | --- |
| Name | item name | The in-world common name. |
| Description | item summary | The opening paragraph. Shown wherever the creature is mentioned elsewhere. |
| Anatomy | attribute | Body plan, size, colouration, what distinguishes it on sight. |
| Biological Traits | attribute | Traits that shape how it is regarded — including exaggerations. |
| Genetics and Reproduction | attribute | Mating, clutches, parental investment, what preys on the young. |
| Growth Rate & Stages | attribute | Life cycle, stage by stage, and lifespan. |
| Ecology & Habits | attribute | Where it thrives, and where it is absent. |
| Dietary Needs & Habits | attribute | What it eats at each stage, and what depends on that. |
| Biological Cycle | attribute | Seasonal and daily rhythms. |
| Behavior | attribute | Temperament, territory, how it acts when met. |
| Social Structure | attribute | Solitary, swarming, hierarchical. |
| Domestication | attribute | Whether it has been tamed or farmed, and why not, if not. |
| Uses, Products, & Exploitation | attribute | What people take from it, and who controls the trade. |
| Geographic Origin and Distribution | attribute | Where it began and how far it has spread. |
| Average Intelligence | attribute | Problem-solving, memory, trainability. |
| Perception and Sensory Capabilities | attribute | What it senses, and what it cannot. |
| Symbiotic and Parasitic Organisms | attribute | What lives on it, in it, or beside it. |
| Cultural Associations | attribute | What it signifies, and to whom. |
| Beauty Ideals | attribute | What counts as a fine specimen, and to whom. |
| Gender Ideals | attribute | Differences between sexes, and the meaning attached to them. |
| Historical Impact | attribute | Events it shaped. |
| Associated Myths and Legends | attribute | Stories told about it, and which are known to be false. |

Name and Description map onto the store's own columns, declared by `storeAs` in the spec. That is what
lets a brief show a creature's name and opening paragraph without knowing anything about fauna. Every
other field is stored in the item's `attributes`, so a container can add fields without the store
learning about them.

## Depth, in one example

The Bottonfly, at the depth these fields are meant to reach.

> **Description** — Bottonflies are massive insects that populate all forested and muddwood regions
> of Westlandia. They play a central role in many eastern casterway societies because of their many
> uses in food, dyes, and poisons.

> **Anatomy** — Bottonflies are known for their rust-coloured bodies. They are replete with long
> spikes covered in a powdery white substance. Like many of Phonon's insects, they have eight legs and
> four wings. Compared to other flying insects on the planet, their wings look as though they would be
> too small for flight. But they beat those wings with amazing speed — emanating a low, persistent
> droning sound as they make their way from branch to branch.

> **Biological Traits** — The sheer size of the species can invoke panic in many casterways. For those
> unaccustomed to the experience, being dive-bombed by a swarm of insects, each of which weighs nearly
> a kilogram, can reduce them to tears. These fears are stoked by the rampant use of bottonflies in
> casterway folklore and horror stories. Although cognoscenti have absolutely no record of such
> anomalies, many arbyrkid spin tales of individual bottonflies that are several metres in length.

> **Ecology & Habits** — Bottonflies thrive in the boundaries between forests and muddwoods. Although
> they can be found in areas that are solely forest or solely muddwood, their numbers are greatest
> where they can range between either biome. They are never found in the vast grasslands of the
> Boundless Plain or the rocky hills of the Stoneyards.

> **Domestication** — No serious attempt has ever been made to domesticate or farm the species.
> Many cognoscenti doubt whether it would even be possible, mostly because casterway techniques for
> corralling a swarm of *flying* insects are… limited. Ultimately the economics don't make sense:
> with the right tools and proper training, anyone can find an abundance of the creatures already in
> the wild.

Three things these examples teach, which the help text and the `article-forge` skill both lean on:

- **Absence is as concrete as presence.** "Never found in the Boundless Plain or the Stoneyards" does
  more for a range than another sentence about where it lives.
- **Record and folklore are different claims.** Cognoscenti have no record of a three-metre bottonfly;
  the arbyrkid tell stories about one. Saying both, and marking which is which, is canon.
- **Disagreement is the most story-bearing thing in an article.** One people's staple food is
  another's barbarism. That friction is what a tale can later use.

## A note on the source text

The examples above came from another editing system, and its markup was stripped: `@Name`
cross-references and `[i]…[/i]` emphasis are artifacts of that tool, not conventions here. Field
values are stored as plain text.
