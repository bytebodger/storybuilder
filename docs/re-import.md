# Re-importing a map

A map is edited outside this tool. Azgaar is where a world is shaped, and an export is a snapshot of
it, so importing is not a one-off — a map comes back changed, often with nothing added at all.

Rebuilding from the file each time would be both wasteful and destructive. The articles carry writing
the map knows nothing about: an author's history of a kingdom is not in any export, and no import
should be able to lose it.

**So an import is a comparison.** Every candidate is matched against what the universe already holds
and given a verdict.

| Verdict | Meaning | What happens |
| --- | --- | --- |
| **new** | No article answers to this name. | Created. |
| **update** | The map has changed something, and nobody has touched the article. | The import's own fields are rewritten. |
| **unchanged** | The map says exactly what the article already does. | Nothing. |
| **edited** | The article has been written since it was imported. | **Left alone**, and what the map now says is reported. |
| **authored** | An article of this name exists that no import created. | **Left alone.** |

Nothing is ever deleted. Articles a previous import created that the export no longer mentions are
named in the report and kept — a country dropped from a map may have a page of history behind it, and
trading that away to match a file is not a choice anyone would make on the author's behalf.

## Telling the import's work from the author's

Each imported article carries a fingerprint of what the import wrote: a short hash of its summary and
the attributes the import owns, stored as `attributes.importDigest`.

Recomputing it from the stored article and finding it unchanged means nobody has touched the article
since — safe to update. Finding it different means somebody has, and the import keeps its hands off.
An article with no fingerprint was never imported, and is never claimed.

## A worked example

Two exports of Watia, a day apart. The world was edited, not regenerated: same seed, and **no
settlement moved, was renamed, was repopulated or changed hands**; no cell changed state or height.
Provinces and markers were dropped from the export. Two labels were added by hand, and two were
nudged.

An author had meanwhile rewritten the summary for Granith.

```
90 candidate(s): 2 new, 2 changed, 85 unchanged, 1 written since import, 0 authored here.

Nothing written. Re-run with --write to apply.
  changed: Imerald Range (mapPosition, spans, mapFrame)
  changed: Eiriton Mountains (mapPosition, mapFrame)
  new:     geography/-    Inerian Peninsula
  new:     geography/bay  Bay of Whispers
```

Applying it wrote four articles and touched nothing else. Granith kept its hand-written summary.

## Three things this fixed

Re-importing was already additive — it never overwrote anything — but that was as far as it went.

**New articles could not attach to old ones.** Links were resolved only among the batch being
written, so `Inerian Peninsula` arrived with no connection to Imperion, which had been imported the
day before. Link targets are now resolved against the whole universe, and a link already recorded is
not written again.

**Nothing was ever updated.** A country whose borders moved kept its old frame, coastline and
neighbours indefinitely. Changed articles are now rewritten — but only the import's own fields, and
only when the author has not taken the article over.

**Editing an imported article through the form erased its imported data.** A container's form knows
only its own spec, so saving a country wiped its map frame, population, coastline and bounds — a
worse loss than any re-import could cause. Attributes a spec does not declare now survive a save
untouched.
