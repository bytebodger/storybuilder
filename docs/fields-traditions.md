# Tradition fields

The spec lives in [store/src/traditions-fields.ts](../store/src/traditions-fields.ts).

Recurring observances: festivals, coronation rites, religious observances, superstitious rituals. The
last container in the catalog to get a spec.

| Field | Stored as | Covers |
| --- | --- | --- |
| Name | item name | Required. What the people who keep it call it. |
| Pronunciation | attribute | [Common to every container](containers.md#fields-every-container-gets). |
| Description | item summary | What is done, by whom, and what for. Shown wherever it is mentioned. |
| **Established On** | **`beginDate`** | When it began, where it did. |
| **Ended On** | **`endDate`** | When it was last kept, if it has stopped. |
| Frequency | attribute | How often it comes round. |
| Associated Locations | attribute (list) | Where it is kept, and where it must be. |
| Associated Institutions | attribute (list) | Who runs it, pays for it, or claims the right to. |
| Associated Ethnicities | attribute (list) | Who keeps it, and who it excludes. |
| Associated People | attribute (list) | Anyone it is for or named after. |
| Associated Theology | attribute (list) | Faiths that claim it, or tried to forbid it. |
| History | attribute | What was added, dropped, banned, or went wrong. |
| Execution | attribute | What actually happens, in order. |
| Components and Tools | attribute | What it needs, and who keeps those things between times. |
| Participants & Key Roles | attribute | Who takes part, and who may not. |

## Frequency and Execution are the article

Neither is ever rolled away. A tradition is a thing people **do**, on an occasion that comes round —
*at every launching*, and *the bell is rung once for each man the year took*. Those are what a scene can
be built on. "An important ritual observed by many" is not, and is what a generator writes when nothing
insists otherwise.

Execution's help asks for one thing more: **what counts as doing it wrong**. A rite with no way to fail
is decoration; a rite you can botch in front of everyone is a story.

## Both dates are rolled low

**Established On at 40%** — most customs were never established. They were done until they were a
tradition, the same point [roads](fields-roads.md#most-ways-were-never-established) makes about paths.
**Ended On at 20%** — a blank end is the claim that the rite is still kept, the same claim a blank
[Existed Until](fields-locations.md) makes about a city. A generator filling both every time invents a
founding decree for a superstition and then abolishes it.

## Fill rates

| Field | Rate | |
| --- | --- | --- |
| Ended On | 20% | a blank means it is still kept |
| Associated People | 30% | most customs have nobody behind them |
| Established On | 40% | most were never established |
| Associated Institutions | 40% | |
| Associated Theology | 40% | a custom older than the faith that adopted it |
| History | 50% | |
| Components and Tools | 50% | |
| Associated Locations | 60% | |
| Associated Ethnicities | 60% | |
| Participants & Key Roles | 70% | |

Description, Frequency and Execution carry no rate. See [fill-rates.md](fill-rates.md).
