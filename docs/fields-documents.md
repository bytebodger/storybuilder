# Document fields

The spec lives in [store/src/documents-fields.ts](../store/src/documents-fields.ts).

An article **about** a document, not the document. A charter's article says when it was made, who
wrote it and what it changed. Quoting from it is optional, and Key Passages is the only field that
does.

| Field | Stored as | Covers |
| --- | --- | --- |
| Name | item name | Required. What people call it, which is often not its title. |
| Pronunciation | attribute | [Common to every container](containers.md#fields-every-container-gets). |
| Description | item summary | What it is, who made it, why it matters. Shown wherever it is mentioned. |
| Author(s) | attribute (list) | Who wrote, compiled or signed it. Blank means nobody knows. |
| **Original Date** | **`beginDate`** | When it was written, published, or only found — and which. |
| Location | attribute | Where it was written, published, posted, or found — and which. |
| Related Documents | attribute (list) | What it answers, amends or replaces, and what answered it. |
| Purpose | attribute | What it was meant for, and what it was used for. |
| Key Passages | attribute | A few lines in its own voice, and why they matter. |
| Cultural Impact | attribute | What it changed in how people live and think, and among whom. |
| Legal Impact | attribute | What it bound, granted, forbade or overturned. |
| Background | attribute | The circumstances it was written in. |
| History | attribute | What happened to the document itself: copies, losses, forgeries. |
| Public Reception | attribute | How it was received, and by whom. |
| Legacy | attribute | What it is remembered for, long after. |
| Term | attribute | How long what it said held. |

The short fields — authors, date, location, related documents, term — sit beside the prose rather than
in it, as [fauna's measurements](fields-fauna.md#two-shapes-of-field) do.

## Original Date is the begin date, loosely

It is written to the item's `beginDate`, beside every other container's words for when a thing began,
so a brief can tell a reader how old a document is without knowing this spec.

What the date marks is loose on purpose. **Written, published, or only found** can be centuries apart,
and for a great many old documents the moment one surfaced is the only moment anybody knows. So the
value says which — `Written 412`, `Found 1130` — and Location follows the same rule.

A document is not filed under a [timeline](timelines.md). Its year is recorded without becoming an
event, so it does not appear in Chronology, and a date with no readable year in it warns about nothing.

## Not every document is a treaty

Several fields are things most documents do not have. A letter has no legal force, a ledger has no
public reception, and much old writing has no author anyone can name. Handed those fields, a
generator fills them, and every document in the world comes out a charter signed by someone famous.
So they are rolled:

| Field | Rate | |
| --- | --- | --- |
| Legal Impact | 35% | most documents never had the force of law |
| Related Documents | 40% | |
| Term | 40% | blank for anything that never held in force |
| Key Passages | 50% | quoting is optional; the article is about the document |
| Cultural Impact | 50% | |
| Public Reception | 50% | a private document had none until it was found |
| Legacy | 50% | |
| History | 60% | |
| Author(s) | 75% | anonymous is a real answer, and a common one |

Description, Original Date, Location, Purpose and Background carry no rate. See
[fill-rates.md](fill-rates.md).
