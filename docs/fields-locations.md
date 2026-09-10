# Location fields

The spec lives in [store/src/locations-fields.ts](../store/src/locations-fields.ts).

`locations` is deliberately broad — a planet, a country, a city, a district, a battlefield — so the
fields are the ones every bounded place has an answer to, and [`kind`](containers.md#kinds) carries
the distinction between them. Physical features themselves belong in `geography`; the **Geography**
field here describes the terrain a place sits in and names the features it sits among.

| Field | Stored as | Covers |
| --- | --- | --- |
| Name | item name | What the place is called. |
| Pronunciation | attribute | A plain respelling. [Common to every container](containers.md#fields-every-container-gets). |
| Parent Location | attribute | The larger place it sits inside. Links itself when that has an article. |
| Description | item summary | The opening paragraph. Shown wherever the place is mentioned elsewhere. |
| Existed Since | **`beginDate`** | When it came to be. Defaults to `0` — the start of recorded canon. |
| Existed Until | **`endDate`** | When it ceased to be. Blank means no end is recorded — which is not the same as still standing. |
| Population | attribute | How many live there, and when that was counted. |
| Founders | attribute (list) | Who established it. Each name links separately. |
| Geography | attribute | The terrain it sits in and the features it sits among. |
| Climate | attribute | Seasons, weather, and what living with it costs. |
| Natural Resources | attribute | What the land yields — and what must be imported because it has none. |
| Native Wildlife | attribute | Creatures and plants found here, and their standing. |
| Demographics | attribute | Who lives here: peoples, languages, faiths, and how they sit together. |
| History | attribute | What has happened here, in order. |

## The dates are the store's dates

**Existed Since** and **Existed Until** map onto the item's `beginDate` and `endDate` columns, not
into `attributes`. That is the whole reason `storeAs` exists.

Every container will have its own words for when a thing began and ended — *Existed Since*, *Reign
Began*, *Founded*, *Fell*. If each stored its own attribute under its own key, nothing could read them
in common, and the brief renderer could not tell a skill that a drowned city is no longer standing:

```
Dol - locations - id bf3c9fff (198 - 812; NO LONGER EXTANT)
```

One column, many labels. A container adds a date field by naming it whatever suits and declaring
where it goes.

This also keeps [closure and time apart](data-model.md#things-that-arent-real-and-things-that-no-longer-are)
for locations: a country that fell is still one of the continent's countries — a closed set of three,
not two — but it is not there to be visited now.

## Defaults

**Existed Since** defaults to `0`. Year 0 is the start of recorded canon, so leaving it says the place
has always been there — which is the right answer for most geography-scale places and a poor one for a
city, and having to change it is a useful prompt.

Defaults apply to a **new** article only. Applying them to an edit would resurrect a value the author
had deliberately cleared.

## Two shapes, again

Short fields — Parent Location, the dates, Population, Founders — gather into the compact facts block
above the prose. Long fields render as sections in spec order. Lists count as short: a line of
founders is scanned like a value, not read like a paragraph. See
[fields-fauna.md](fields-fauna.md#two-shapes-of-field).

## Names that link themselves

Several fields hold names rather than relations, and the
[cross-referencer](cross-references.md) picks them up without any extra wiring:

```
Parent Location: Kell            -> Kell
Founders:        Antin Forin, III -> Antin Forin, III
Demographics:    ... Kellish ... the Ashfaith ... the Quiet Hand
                 -> Kellish, The Ashfaith, The Quiet Hand
```

Where a name has no article yet, it stays plain text — which is the prompt to
[stub it](stubs.md).

One rough edge worth knowing: **Founders** is a comma-separated list, so a single name containing a
comma — `Antin Forin, III` — splits in two when typed into the field. Entered as a value it round-trips
correctly; typed with the comma it becomes two founders.
