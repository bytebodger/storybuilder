# Item fields

The spec lives in [store/src/items-fields.ts](../store/src/items-fields.ts).

**One object, not a kind of object.** If everybody owns a doodlebop and an author wants to explain what
a doodlebop is, that is a word and belongs in [terminology](fields-terminology.md). If there is only
one doodlebop — or a finite set of Seeing Stones nobody can make more of — it belongs here.

| Field | Stored as | Covers |
| --- | --- | --- |
| Name | item name | Required. What people call it. |
| Pronunciation | attribute | [Common to every container](containers.md#fields-every-container-gets). |
| Description | item summary | What it is and why anyone would cross a room for it. |
| **Created On** | **`beginDate`** | When it was made. |
| **Destroyed On** | **`endDate`** | When it was destroyed, if it was. |
| Associated Locations | attribute (list) | Where it was made, kept, and is now. |
| Associated Institutions | attribute (list) | Who made it, holds it, or claims it. |
| Associated Ethnicities | attribute (list) | Who made it, reveres it, or wants it back. |
| Associated People | attribute (list) | Who made it, carried it, was killed for it. |
| Associated Theology | attribute (list) | Faiths that use it or condemn it. |
| Dimensions | attribute | How big, in this world's terms. |
| Weight | attribute | And what that means for whoever carries it. |
| History | attribute | What has happened to it, in order. |
| Mechanics & Inner Workings | attribute | How it works, if it does anything. |
| Manufacturing Process | attribute | How it was made, and whether it could be again. |
| Significance | attribute | What it means, to whom, and what they would do to have it. |

## History and Significance are the reason it is here

Neither is ever rolled away. An object has a history precisely because there is only one of it to have
one — who held it, how it changed hands, when it was lost and found. A sword with dimensions and no
story is a line in an inventory.

Significance asks for the disagreement where there is one: a trophy to the people who took it is a
grave good to the people it was taken from, and that is usually the most story-bearing thing in the
article.

## Lost is not destroyed

**Destroyed On** is the item's `endDate`, rolled at 20% — the same rate as a city's
[Existed Until](fields-locations.md) and for the same reason. A blank is the claim that the thing still
exists somewhere, and a generator filling it every time destroys four relics in five. The help text
draws the line your spec implies: a thing merely *missing* is not destroyed, and where it went belongs
in History.

**Created On at 50%**, because half the objects worth an article are older than the records that
mention them. The help asks for the year it is first heard of rather than an invented date of
manufacture.

## Fill rates

| Field | Rate | |
| --- | --- | --- |
| Destroyed On | 20% | a blank means it is still out there |
| Associated Theology | 30% | |
| Associated Institutions | 40% | |
| Associated Ethnicities | 40% | |
| Created On | 50% | many are older than the record |
| Mechanics & Inner Workings | 50% | plenty of objects simply are what they are |
| Manufacturing Process | 50% | a method that died with its maker is often why there is only one |
| Associated Locations | 60% | |
| Associated People | 60% | |
| Weight | 60% | blank where nobody has had cause to weigh it |

Description, Dimensions, History and Significance carry no rate. See [fill-rates.md](fill-rates.md).
