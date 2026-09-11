# Geography fields

The spec lives in [store/src/geography-fields.ts](../store/src/geography-fields.ts).

The physical features themselves — a range, a river, a bay, a waterfall — where
[locations](fields-locations.md) holds the inhabited and bounded places among them. The Geography field
on a location describes the terrain a place sits in; this describes the terrain.

| Field | Stored as | Covers |
| --- | --- | --- |
| Name | item name | Required. What the people near it call it. |
| Pronunciation | attribute | [Common to every container](containers.md#fields-every-container-gets). |
| Description | item summary | What it is and why it matters. Shown wherever it is mentioned. |
| Parent Geography | attribute | The larger feature it sits inside. |
| Parent Location | attribute | The place it lies within. |
| Geography | attribute | The shape of the thing itself: extent, height, depth, what it is made of. |
| Localized Phenomena | attribute | What it does to what is around it. |
| Climate | attribute | The weather in it, and what it does to the weather nearby. |
| Flora & Fauna | attribute | What grows and lives here, and its standing. |
| Natural Resources | attribute | What it yields, who works it, who claims it. |
| History | attribute | What has happened here, and how it came to be as it is. |
| Tourism | attribute | Who travels to see it, and who lives off them. |
| Ethnic Significance | attribute | What it means, and to which peoples. |
| Religious Significance | attribute | Sacred standing: whose, and what is forbidden. |

## Two parents, because there are two questions

A waterfall sits inside a mountain range and inside a country, and either may be the one worth knowing.
So the spec asks both, as separate short fields, and each links itself to the article it names.

A feature that crosses several places takes the **broader** parent: a river running through four
countries sits under the continent, or the planet, rather than under any one country it passes through.

These are names in fields, not [tags](data-model.md) — the same arrangement as a location's Parent
Location, and with the same limit: no reciprocal edge is written, so a range does not yet list the
falls recorded inside it.

## Every feature has a shape; few have portents

Localized Phenomena is the field this container most needs and most has to be protected from. Asked
what a hill does to its neighbours, a generator gives it a flood, and a world of ordinary hills becomes
a world of portents. So it is rolled, along with most of the second half of the spec:

| Field | Rate | |
| --- | --- | --- |
| Tourism | 30% | many worlds have no such thing at all |
| Religious Significance | 40% | |
| Localized Phenomena | 50% | most features do nothing to anybody |
| Climate | 50% | a range makes weather; a waterfall does not |
| History | 50% | |
| Ethnic Significance | 50% | |
| Natural Resources | 60% | as for locations |

Name, Description, both parents, Geography and Flora & Fauna carry no rate: the shape of a feature and
what lives in it are what the article is for. See [fill-rates.md](fill-rates.md).

Two of these invite disagreement, which is where the value is. Ethnic Significance asks *which* peoples
hold a meaning, because two peoples claiming the same feature differently is a story waiting to
happen; Localized Phenomena asks for what people believe a feature does as well as what it does.
