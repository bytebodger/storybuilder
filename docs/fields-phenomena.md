# Phenomenon fields

The spec lives in [store/src/phenomena-fields.ts](../store/src/phenomena-fields.ts).

What happens, where [cosmology](fields-cosmology.md) holds the bodies it may happen to and
[geography](fields-geography.md) the ground it happens on. A comet is cosmology; the night its passage
turned the harbour green is a phenomenon. See
[containers.md](containers.md#cosmology-and-phenomena).

| Field | Stored as | Covers |
| --- | --- | --- |
| Name | item name | Required. What the witnesses call it. |
| Pronunciation | attribute | [Common to every container](containers.md#fields-every-container-gets). |
| Description | item summary | What happens and what people make of it. Shown wherever it is mentioned. |
| **First Observed** | **`beginDate`** | When it was first recorded. |
| Frequency | attribute | How often — as precisely as this world can say. |
| Source | attribute | What causes it, and what people believe causes it. |
| Manifestation / Visualization | attribute | What a witness sees, hears and smells, first sign to last. |
| Associated Location(s) | attribute (list) | Where it happens, and where it is seen from. |
| Associated Legend(s) | attribute (list) | The stories grown up around it. |
| History | attribute | The occurrences worth remembering. |
| Societal Impact | attribute | What people do about it. |

## Frequency is the field that does the work

It is a short `text` field, sitting with the facts beside the prose, and it is **never rolled away**. A
phenomenon without a frequency is a rumour. *Every seventeenth summer* is a fact a character can plan
around, dread, or be caught out by; *occasionally* is not. The help text asks for a number where this
world could give one, and accepts `once, in 604` — a single occurrence is a frequency too.

**First Observed** is the item's `beginDate`, beside every other container's words for when a thing
began. It is rolled at 50%, because plenty of phenomena have always been there as far as anyone knows,
and the help text offers the honest middle answer: *first written of in 604; older in the telling.*

## Source asks for the disagreement

What causes it and what people say causes it are rarely the same, and both are canon. The help text
also says the thing this container most needs: where the truth is not established, **say so** rather
than settling it. A world's unexplained phenomenon is allowed to stay unexplained — that is usually why
it earned an article.

## Fill rates

| Field | Rate | |
| --- | --- | --- |
| First Observed | 50% | many have always been there |
| Associated Legend(s) | 50% | |
| History | 50% | |
| Societal Impact | 60% | |

Description, Frequency, Source, Manifestation and Associated Locations carry no rate: what happens, how
often, why, what it looks like and where are what the article is for. See
[fill-rates.md](fill-rates.md).
