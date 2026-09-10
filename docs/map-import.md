# Importing a generated map

Azgaar's Fantasy Map Generator exports two files, and **both are needed**. Neither is a superset of
the other, which is not obvious and cost me an hour of wrong assumptions.

| File | Holds | Size, for one world |
| --- | --- | --- |
| `*.json` (Full) | Everything the generator made: states, provinces, settlements, rivers, lakes, sites, cultures, religions, roads, events — with a complete hierarchy. | 75 MB |
| `*.svg` | The rendered map, and **the labels the author added by hand**. | 13 MB |

## The hand-added labels are the important part

Azgaar's data model has no concept of a mountain range, a strait, or an open sea. So a label naming
one is annotation placed *around* the tool — and the "Full" JSON export, all 75 MB of it, contains not
a single one. Searching it for `Sontersea`, `Arnborne`, `Imerald` or `Eyrenes` returns nothing.

They are also the most valuable names in the export. A generator produced every country and every
settlement; a person decided these six were worth naming. **They import at every tier**, including
the smallest, because nothing else will ever recover them.

They live in `<g id="labels-added">`, each a `<text>` bound to a curve in `#textPaths` — which is why
they arc across the map. The midpoint of that curve places the label, and since both files share one
2560×1279 canvas, that coordinate drops into the JSON's cell grid to give the label a parent:

```
LABEL                  CANVAS x,y   STATE       PROVINCE           BIOME
Imerald Range          1855, 501    Charnham    Padsfield Land     Grassland
Arnborne Mountains      654, 721    Linbeck     Brasbutia Clan     Taiga
Sontersea              1236, 668    Neutrals    -                  Marine
```

`Sontersea` landing outside any state is the correlation working: it is open water.

A label arcs across the thing it names, and that curve is the closest thing to a shape it has. Every
point along it is dropped into the cell grid, so a range labelled across a border reports **every**
country it crosses rather than whichever one its midpoint landed in:

```
Arnborne Mountains   Waresia, Linbeck, Wigan Marches
Eiriton Mountains    Granith, Whitmere
The Eyrenes          Whitmere, Farn Ecton
Imerald Range        Charnham
Sontersea            (open water — no country)
Strait of Arnock     (open water — no country)
```

Reading the midpoint alone gave Arnborne one country instead of three. Each crossing becomes a tag
with the role `crosses` / `crossed by` — a peer relationship, since a range spanning three countries
is not *inside* any of them.

## Tiers

A generated world offers thousands of named things. Importing all of them buries the handful that
carry a story, so the author picks the grain — and can come back later, since a second import
[dedups](stubs.md) against the first.

| Tier | Adds | Watia |
| --- | --- | --- |
| **0** | Hand-added labels. Always, at every tier. | 6 |
| **1** (default) | Countries, capitals, peoples, faiths, named roads, recorded events. | 88 |
| **2** | Ports and settlements above a population threshold. | 648 |
| **3** | Every remaining settlement, river and lake. | 2,864 |

From inside a universe, **Import a map** in the sidebar plans and reviews an import. From the command
line:

```bash
npm run sb --silent -- --universe watia import-map map.svg map.json --tier 1
```

Files are named by path rather than uploaded, in both places: the bridge runs on the author's own
machine, and a Full export is 75 MB. Nothing is written without `--write`.

A tier 3 import of Watia writes 2,864 articles with 3,471 links in about 80 seconds. That is slower
than it sounds like it should be: the store reads from disk on every operation rather than caching,
which is right for correctness and quadratic for bulk writes. Fine for a one-off import at this size;
it would want a batch write path before anyone imports ten thousand. The dry run prints what each source yielded against what the
tier admits, so the shape of the decision is visible before anything lands.

### Two things the generator makes that a story does not want

Both are excluded at every tier, and both have a flag for the rare case.

**Provinces** (`--with-provinces`). Azgaar produces an administrative layer whether or not anyone
asked for it. Everyone knows Mos Eisley is a city on Tatooine; nobody knows or cares which province it
is in. Leaving them out also shortens every settlement's parentage to its country, which is the
relationship a reader actually holds in mind.

**Markers** (`--with-markers`). These are prompts for a game master rather than facts about a world.
Of Watia's 408, **184 repeat verbatim** — 81 named `Random encounter` carrying identical notes, 35
named `Dungeon` — and the 224 that survive are largely scenery with a label: jetties, columns, a
ruined mausoleum. A world is not richer for those articles, and the navigation is measurably worse.
When they are asked for, the repeated ones are still dropped: a name used more than once on a map is
decoration, and that test needs no list of banned words.

## What Azgaar gives beyond names

Imports are not blank stubs where the file knows more. Settlements arrive with population, port,
walls and citadel flags; countries with government form and population; and all 407 markers carry
prose the generator already wrote — *"Dormant volcano. Height: 9216ft."* That becomes the article's
summary. Only entries the file gives nothing but a name — most rivers — are recorded as stubs.

Container mapping covers 8 of the 19: states, provinces and settlements to `locations` (kinds
`country`, `province`, `city`/`town`/`village`), rivers and lakes to `geography`, cultures to
`ethnicities`, religions to `theology`, roads to `roads`, zones to `history`, and markers spread
across `geography`, `history`, `fauna`, `institutions`, `traditions` and `phenomena` by their type.

### Zones are worth keeping

Watia's twelve zones are the opposite profile from markers: every name is unique, none repeat, and
they are the only entries in the whole export that describe something *happening*. Everything else at
tier 1 is a noun — countries, capitals, peoples, faiths, roads.

```
CONFLICTS                                DISASTERS
Southesian Pillaging     Invasion        Peringdonese Famine   Disaster
Wigan Secessionists      Rebels          Manches Eruption      Eruption
Granishan Crusade        Crusade         Retescom Tsunami      Tsunami
```

A crusade spanning 8,581 cells is a continent-scale war with a name; a flood covering two is local
memory. Both are story fuel, at a cost of twelve rows.

They arrive with a name and a type and nothing else — no dates, no description — so they are stubs
with evocative names, which is the honest way to hold them.

Most zones are history. A **Fault** is not: it is a feature of the ground that will still be there
when the story is over, so it goes to `geography`.

## Cropping a region out of the map

The reason to keep a world as SVG rather than a raster: one export can be looked at whole, or at one
country, without going back to the generator.

```bash
npm run sb --silent -- crop-map map.svg map.json --state Seedon --out seedon.svg
npm run sb --silent -- crop-map map.svg map.json --label "Sontersea" --pad 0.12 --out sea.svg
npm run sb --silent -- crop-map map.svg map.json --box 1050,550,1460,840 --out region.svg
```

Cropping is done by `viewBox`, not by editing geometry: everything outside the frame stops being
drawn, everything inside keeps full vector detail, and the operation is reversible.

**A country frames itself.** Its own cells give the box — Seedon's 1,080 cells make a 352×346 window,
4% of the map, holding the country, its four neighbours and 85 settlements.

**A sea does not.** Azgaar has no object for the Sontersea: the label sits on ocean feature 1, which
spans half the canvas, because all connected water is one feature. A named sea is not a thing the
generator made — it is the space between coasts.

So the frame starts at the label's own curve and grows until **land rings it**. The test is a property
of the frame's perimeter, not of what lies beyond one edge: each side must be `--enclose` land
(default 90%) before the walk stops, and the most open side always grows first. Water still reaches
the border wherever the sea genuinely opens out — for the Sontersea, a narrow gap north and the two
southwest outlets, one of which is the Strait of Arnock. That is the sea's shape, not a fault in the
crop, which is why the result reports its edges:

```
Cropped to Sontersea, grown from its label until the coasts closed around it.
  edges ringed by land: N 90% S 95% W 98% E 95%
  604 x 589 of 2560 x 1279 (11% of the map), 8% overflow
```

### Sample the regular grid, never the packed cells

This is the trap, and it is silent. Azgaar's `pack.cells` re-samples the world: dense along coasts,
very sparse in open sea. Counting them across a stretch of ocean finds a handful of points, several
belonging to a passing island, and reports the water as **73% land**. Sampling the same frame on the
regular `grid` lattice — 448 × 224 cells at even spacing, height on every one — gives **37%**, which
is what the eye sees.

The first version of this walk used packed cells and stopped at the first peninsula, framing a bay and
calling it a sea. Nothing in the output looked wrong; the numbers were simply about a different
question.

### Not every water closes

A strait is a passage, open at both ends by definition, and no frame around one is ever ringed by
land. Each side gives up after growing `reach` without finding shore (40% of the map by default), and
a walk that fails returns a **close view of the label** rather than its sprawl — half a map around a
strait is worse than a tight one — along with the reason:

```
Cropped to Strait of Arnock — the frame reached its size limit before land closed it;
use --box to frame it yourself.
  edges ringed by land: N 22% S 0% W 59% E 40%
  397 x 544 of 2560 x 1279 (7% of the map)
```

### A crop is not smaller

The file keeps its full geometry and only the window moves, so a 4% crop is still 12.7 MB. The bulk is
7.9 MB of path data — coastlines, borders, rivers — which cannot be trimmed without clipping the
geometry, and 4.8 MB of `<use>` elements that turn out to be clip-path references carrying no
coordinates, so they cannot be filtered by position either. Losslessness is the trade.

## Reviewing an import

A tier can offer thousands of candidates, and a flat list of thousands is not a review — it is a wall
that gets accepted wholesale or abandoned. The decision an author actually makes is at the group
level: keep every country, drop every village. So groups are the interface, they start collapsed, and
rows are underneath for the audit rather than for the choosing.

```
LOCATIONS                      GEOGRAPHY                  HISTORY
  town              384          mountain-range     3       flood          2
  village           176          sea                1       crusade        1
  city               14          strait             1       invasion       1
  country            14          fault              1       tsunami        1
```

Groups sit under the container they will land in, so the list reads as the sections of the world
rather than one undifferentiated run, and the biggest group in each section is on top — that is where
the costly decision is. Each container has one **Keep all / Drop all**, and a search box confirms a
particular name made it in.

**Everything is selected by default**, which is the opposite of the [stub review](stubs.md). An author
scoped this by choosing a tier and two files; the plan is the consequence of that choice rather than a
set of guesses nobody asked for. Dropping `locations/village` from Watia's tier 2 is one click, and
takes 648 candidates down to 472.

Candidates the universe already holds are screened out before review, through the same matcher stub
proposals use — so an import can be re-run, or run after hand-authoring, without duplicating anything.

### Kinds that came from the simulation, not the world

Azgaar labels each culture Generic, Naval, Nomadic or Lake, describing how it spread across terrain
while the map was being built. That is a fact about the generator, not about a people, and carrying it
in split one Ethnicities section into four meaningless ones. Culture types are dropped. Religion
forms (folk, organized, cult, heresy) and zone types (flood, crusade, invasion) are kept, because
those describe the thing rather than how it was placed.

## Rivers, and what they run through

A river carries the cells it flows along, so the countries it crosses are a lookup rather than a
guess about where a line went. Of Watia's 1,126 rivers, 75 cross more than one country, and each gets
a tag with the role `flows through` / `watered by`.

614 of them are tributaries, and name the river they join (`flows into` / `fed by`). Azgaar marks a
river as its own parent when it joins nothing, which is not a relationship — a self-link the store
would refuse anyway, and a claim nobody should be making.

```
Conghambe — A river crossing Linbeck, Imperion.
  COUNTRY (2)   Imperion (flows through), Linbeck (flows through)
  RIVER (9)     Buckingley (fed by), Chipleton (fed by), Chishil (fed by), …
```

## What a country carries beyond its name

A first version imported names and hierarchy and nothing else, which left the store unable to answer
the first three questions anyone asks of a map: *who borders whom, who is landlocked, who sees the
sunrise first.* All three were in the export; none had been read.

**Borders** are stated outright — every state carries a `neighbors` array — and become reciprocal tags
with the role `borders`, so the relationship reads the same from either end:

```
COUNTRY (6)
  - Fartherfeld (borders)     - New Boria (borders)
  - Granith (borders)         - Waresia (borders)
  - Linbeck (borders)         - Wigan Marches (borders)
```

These are peers, not parents, which is why candidates carry `relations` separately from
`parentNames`: containment picks the most specific parent available, while every border gets written.

**Water access** is derived, and is not a boolean. A land cell records `harbor` — how much water it
touches — and `haven`, the water cell it opens onto; following the haven to its feature is what
separates a sea coast from a lake shore.

The settlement `port` flag does *not* do that job, and the reason is worth stating: of Watia's 276
ports, 120 are on the sea, 35 on lakes, and **121 are on rivers, inland of any coast**. That looks
like bad data until you remember New Orleans. Counting them apart is what stops a landlocked country
either losing its harbours or gaining a coastline:

```
Linbeck        coast=none   sea=0    river=7    lake=0
Whitmere       coast=none   sea=0    river=5    lake=0
Dalworth       coast=lake   sea=0    river=0    lake=0
Imperion       coast=sea    sea=16   river=26   lake=2
```

Linbeck's summary reads *"landlocked but reached by water, with 7 river port(s)"* — two claims that
would collapse into one wrong one under a `landlocked: true` flag.

**Position** is stored as a bounding box in **degrees**, not pixels, so it means something outside the
one image it came from. Watia spans −180 to 180 longitude across 2,560 px, which makes Farn Ecton's
eastern edge 164.2°E — the first country to see the sunrise, and 36° clear of Seedon behind it.

Canvas `y` grows southward while latitude grows northward, so the northern edge of a country is its
*smallest* y. Getting that backwards is silent: every country simply reports 0.

## Names reused across a map

A generated world reuses settlement names freely. Watia has seven Uxbrids, six Framptons, and two
Betfords — and two Torkleighs inside the same country.

Two articles sharing a name break every cross-reference to either, since the linker has no way to
choose, so clashing names are qualified by country: `Betford (Seedon)` and `Betford (Brandlemar)`.
**Every** side of a clash is qualified, not just the later ones — leaving the first bare would make a
passing mention resolve to whichever happened to be imported first, which is arbitrary dressed up as
certain. Two of a name inside one country get a numeral. Anything referring to a renamed article
follows it, so parentage does not break.

For Watia at tier 2 this qualifies 65 names, and the store then validates with zero warnings.

## Two traps, both real

**Azgaar names a province after its capital burg.** Blandbury the town sits in Blandbury the province.
Imported by bare name that would give Watia a hundred-odd pairs of articles sharing a name — one a
town, one the region around it — and every cross-reference to either would be a coin toss. Provinces
therefore import under their **full** name: `Blandbury County`.

The same collision breaks parentage more quietly. A capital's parent chain begins with its province,
whose name is the capital's own — so the parent resolves to the burg itself and the link is silently
dropped. A candidate is never offered as its own parent.

**Parents are a chain, not a name.** Each candidate carries the parents it *could* have, most
specific first — `["Blandbury County", "Whitmere"]` — and the writer takes the most specific one the
tier actually imported. Without that, tier 1 links nothing, because every settlement points at a
province that was never brought in.
