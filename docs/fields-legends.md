# Legend fields

The spec lives in [store/src/legends-fields.ts](../store/src/legends-fields.ts).

In-universe myths and legends, whether they rest on real history or were invented whole.

| Field | Stored as | Covers |
| --- | --- | --- |
| Name | item name | Required. What the people who tell it call it. |
| Pronunciation | attribute | [Common to every container](containers.md#fields-every-container-gets). |
| **Description** | item summary | The article's own voice: what this legend is and who tells it. |
| **Year of Recording** | **`beginDate`** | When it was first written down or attested. |
| Year of Setting | attribute | When it claims to have happened. |
| Associated Documents | attribute (list) | The texts it comes down in. |
| Associated Ethnicities | attribute (list) | Who tells it, and who it is told about. |
| Associated Locations | attribute (list) | The settled places that claim it. |
| Associated Geography | attribute (list) | The bay, the pass, the stone you can still stand beside. |
| Associated People | attribute (list) | Who appears in it, and who collected it. |
| Associated Institutions | attribute (list) | Who keeps it, uses it, or is embarrassed by it. |
| **Summary** | attribute (`synopsis`) | The story itself, retold. |
| Historical Basis | attribute | What, if anything, lies under it. |
| Spread / Apocrypha | attribute | How far it travelled, and what attached itself on the way. |
| Variations | attribute | How the telling changes between peoples and generations. |
| Cultural Impact | attribute | Customs, sayings, places nobody will go after dark. |
| Literary Impact | attribute | Works that retell or borrow it. |
| Artistic Impact | attribute | How it is depicted, and where. |

## Description and Summary are different jobs

**Description** is the article talking *about* the legend — what it is, who tells it, why it matters —
and it is the item's summary, so it is what every other article shows when the legend is mentioned in
passing. **Summary** is the legend itself, retold plainly: what happens, in order, and how it ends.

Keeping them apart is what stops an article about a legend turning into the legend. The help text for
Summary asks for a synopsis rather than a performance, and sends competing endings to Variations.

Summary is stored under the key `synopsis`, because the item already has a `summary` column and that
column belongs to Description. Only the key differs; the form says **Summary**.

## Two years, and most legends have neither

**Year of Recording** is the item's `beginDate`. A legend enters the record when somebody writes it
down, and that is the date anything reading dates off the store should see. **Year of Setting** is an
attribute, because the year a story claims for itself is a claim the story makes rather than a fact
about it.

Both are rolled low — 30% and 25% — and for the reason your spec gives: most legends have no
demonstrable year of composition and no year they purport to have happened in. Handed either field, a
generator supplies one, and every myth in the world quietly becomes a dated event. The help text asks
for *first attested* rather than an invented date, and for "before the ice" rather than a number.

## Fill rates

| Field | Rate | |
| --- | --- | --- |
| Year of Setting | 25% | |
| Year of Recording | 30% | |
| Associated Documents | 35% | most legends were never written down by anyone |
| Associated Institutions | 40% | |
| Literary Impact | 40% | a world with little writing has little of this |
| Artistic Impact | 40% | |
| Associated Geography | 50% | |
| Spread / Apocrypha | 50% | |
| Associated Ethnicities | 60% | |
| Associated Locations | 60% | |
| Associated People | 60% | |
| Historical Basis | 60% | |
| Variations | 60% | |
| Cultural Impact | 60% | |

Description and Summary carry no rate: an article with neither has not said anything. See
[fill-rates.md](fill-rates.md).

**Variations** is the field to reach for when a legend feels flat. Which version a person tells is a
fact about that person — where they are from, who raised them, what they want the story to mean.
