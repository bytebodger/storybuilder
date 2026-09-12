# Road fields

The spec lives in [store/src/roads-fields.ts](../store/src/roads-fields.ts).

Roads, passes and paths, including small ones — a mountain pass that controls a region's commerce earns
an article as readily as a highway. [Geography](fields-geography.md) holds the ground; this holds the
way through it.

| Field | Stored as | Covers |
| --- | --- | --- |
| Name | item name | Required. What its users call it. |
| Pronunciation | attribute | [Common to every container](containers.md#fields-every-container-gets). |
| Description | item summary | Where it runs and what it is like to travel. Shown wherever it is mentioned. |
| **Established On** | **`beginDate`** | When it was built or formally opened. |
| Location(s) | attribute (list) | What it runs between and through. |
| Purpose / Function | attribute | What it is for beyond joining two places. |
| Commercial Impact | attribute | What moves along it, and who got rich or ruined. |
| Cultural Impact | attribute | What travels it besides goods. |
| Political Impact | attribute | Who controls it, and what holding it is worth. |
| Navigability | attribute | What goes wrong on it. |
| History | attribute | What has happened on it and to it. |
| Traffic | attribute | Who is on it, and how many. |

## Navigability is the article

A road that is only a line between two places is a line on a map. A road with a fortnight of mud after
the spring rains, three tolls of which one is lawful, and a stretch the watch will not ride is a road a
story can happen on. So the field is never rolled away, and its help text asks for **what goes wrong**:
the season it closes, the miles nobody will guard, how long it takes and what a traveller needs to
survive it.

Traffic and Purpose are always filled for the same reason. Purpose asks what the road is *for* beyond
the obvious — the trade it opened, the garrison it supplies, the treaty it was built to prove — and,
where the reason it was made and the reason it is used now differ, for both.

## Most ways were never established

**Established On** is the item's `beginDate`, and it is rolled at 40% because of the point your spec
makes: it means something for a road that was built and very little for a path that was walked until it
became one. Handed the field, a generator invents a founding year for a goat track. The help text
offers the honest answers — *never built; walked*, or the year it was first paved or first patrolled.

## Fill rates

| Field | Rate | |
| --- | --- | --- |
| Established On | 40% | most ways were never established |
| Cultural Impact | 50% | |
| Political Impact | 50% | |
| History | 50% | |
| Commercial Impact | 60% | the likeliest of the three impacts |

Description, Location(s), Purpose / Function, Navigability and Traffic carry no rate. See
[fill-rates.md](fill-rates.md).
