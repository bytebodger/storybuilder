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

One caveat: the midpoint is where the *text* sits, not the centre of what it names. A label spanning
three provinces is placed in whichever one it happens to cross. Good enough to suggest a parent, not
good enough to assert an extent.

## Tiers

A generated world offers thousands of named things. Importing all of them buries the handful that
carry a story, so the author picks the grain — and can come back later, since a second import
[dedups](stubs.md) against the first.

| Tier | Adds | Watia |
| --- | --- | --- |
| **0** | Hand-added labels. Always, at every tier. | 6 |
| **1** | Countries, capitals, peoples, faiths, named roads, recorded events. | 88 |
| **2** | Provinces, ports, settlements above a population threshold. | ~700 |
| **3** | Every settlement, river, lake and marked site. | 3,686 |

```bash
npm run sb --silent -- --universe watia import-map map.svg map.json --tier 1
```

Nothing is written without `--write`. The dry run prints what each source yielded against what the
tier admits, so the shape of the decision is visible before anything lands.

## What Azgaar gives beyond names

Imports are not blank stubs where the file knows more. Settlements arrive with population, port,
walls and citadel flags; countries with government form and population; and all 407 markers carry
prose the generator already wrote — *"Dormant volcano. Height: 9216ft."* That becomes the article's
summary. Only entries the file gives nothing but a name — most rivers — are recorded as stubs.

Container mapping covers 8 of the 19: states, provinces and settlements to `locations` (kinds
`country`, `province`, `city`/`town`/`village`), rivers and lakes to `geography`, cultures to
`ethnicities`, religions to `theology`, roads to `roads`, zones to `history`, and markers spread
across `geography`, `history`, `fauna`, `institutions`, `traditions` and `phenomena` by their type.

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
