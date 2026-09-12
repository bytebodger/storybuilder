# Terminology fields

The spec lives in [store/src/terminology-fields.ts](../store/src/terminology-fields.ts).

A word, and what it means here — what the locals call the swamps they live beside. Nine fields, and six
of them are the company the word keeps.

| Field | Stored as | Covers |
| --- | --- | --- |
| Name | item name | Required. The term itself. |
| Pronunciation | attribute | [Common to every container](containers.md#fields-every-container-gets). |
| **Meaning** | item summary | What it means, and what using it says about the speaker. |
| Associated Locations | attribute (list) | Where it is said. |
| Associated Institutions | attribute (list) | Who uses it as a term of art. |
| Associated Ethnicities | attribute (list) | Who says it, and who it is said about. |
| Associated Languages | attribute (list) | Where it comes from. |
| Associated People | attribute (list) | Anyone it is named for or coined by. |
| Associated Theology | attribute (list) | Faiths that claim it, or forbade it. |

## Meaning is the summary

There is no Description field here, and there should not be. For a term, the summary *is* the meaning:
what another article should show when the word turns up in it is what the word means, and a separate
paragraph about the word would say the same thing twice. So Meaning carries `storeAs: 'summary'`.

Its help asks for more than a definition — whether the word is polite or coarse, current or
old-fashioned, neutral or an insult, and where the plain sense and the working sense differ. A term
nobody can misuse is not worth an article.

Pronunciation earns its place here more than in most containers: a word invented for a world is exactly
the thing a reader cannot say aloud without being told.

## Six associations, none of them a given

Most terms belong to one corner of a world. A word used by dockhands in one port has no theology, no
institution and no famous speaker — but a generator handed six association fields fills all six, and
every piece of slang becomes a matter of state.

| Field | Rate | |
| --- | --- | --- |
| Associated People | 30% | most words have nobody behind them |
| Associated Theology | 30% | |
| Associated Institutions | 35% | |
| Associated Locations | 50% | |
| Associated Ethnicities | 50% | and the one where the offence usually lives |
| Associated Languages | 50% | |

Meaning carries no rate. See [fill-rates.md](fill-rates.md).

**Associated Ethnicities** asks for the peoples who use the word *and* the peoples it is used about,
because those are often not the same — which is where a slur differs from a name, and where a story can
start.
