# Institution fields

The spec lives in [store/src/institutions-fields.ts](../store/src/institutions-fields.ts).

Formal hierarchies with infrastructure and decentralised bodies alike: a government, a guild, an order,
a secret society. Thirty-two fields in eight sections, grouped the way
[ethnicities](fields-ethnicities.md#grouped-without-reordering) is — sections follow the spec's order
exactly, and a test holds them to it.

| Section | Fields |
| --- | --- |
| **Overview** | Name, Pronunciation, **Demonyms**, Description, **Founding Year**, **Dissolution Year**, **Aliases**, Estimated Population/Members |
| **Lineage** | Predecessor Institutions, Successor Institutions, Parent Institution, Founders |
| **Inside** | Structure, Culture, Public Agenda, Assets |
| **History** | History, Disbandment |
| **Reach** | Owned/Controlled Locations, Associated Locations, Associated Ethnicities |
| **Activities** | Military, Technological, Religious, Diplomatic, Commercial, Educational |
| **Rule** | Laws & Covenants, Governance |
| **Belief** | Legends & Mythology, Origins, Ethics, Sects |

The five list fields — predecessors, successors, founders, and the three under Reach — hold names, each
linking to its article where one exists. Parent Institution and Estimated Population/Members are single
short fields. Everything else is prose.

## Three fields the store already understands

**Founding Year** is the item's `beginDate` and **Dissolution Year** its `endDate`, beside every other
container's words for when a thing began and ended, so a brief can say how old a body is and whether it
still stands without knowing this spec. **Aliases** are the item's `aliases`, so a mention of *the
Scale* links to the Guild of Weighers and never raises a stub.

## Not every institution is a small state

The six Activities fields are what this container most needs protecting from. A guild trades, teaches
its apprentices, and has no army and no envoys — but a model handed six activity fields writes six, and
every institution comes back with a navy, a school, a temple and a treaty.

| Field | Rate | |
| --- | --- | --- |
| Successor Institutions | 20% | |
| **Dissolution Year** | 20% | a blank is the claim it still stands |
| **Disbandment** | 20% | only for a body that is actually gone |
| Predecessor Institutions | 25% | |
| Technological Activities | 25% | |
| Parent Institution | 30% | most answer to nobody |
| Military Activities | 30% | |
| Religious Activities | 30% | |
| Sects | 30% | |
| Diplomatic Activities | 35% | |
| Educational Activities | 35% | |
| Legends & Mythology | 40% | |
| Commercial Activities | 45% | the likeliest of the six |
| Founders | 45% | many old bodies have no founder anyone can name |
| Aliases | 50% | |
| Assets | 50% | |
| Ethics | 50% | |
| Owned/Controlled Locations | 50% | |
| Associated Ethnicities | 50% | |
| Estimated Population/Members | 60% | |
| Associated Locations | 60% | |
| Origins | 60% | |

Description, Founding Year, Structure, Culture, Public Agenda, History, Laws & Covenants and Governance
carry no rate: those are what an institution article is for. See [fill-rates.md](fill-rates.md).

**Dissolution Year at 20%** is [Existed Until](fields-locations.md) again, and for the same reason. A
generator filling it every time buries four orders in five, and an empty field is what lets a
suppressed order turn up intact in a later scene.

## Two pairs that invite a contradiction

**Public Agenda** asks what a body says it is for and, where they differ, what it is actually for.
**Origins** asks for the account of how it began, which is not the Founding Year — and where the story
it tells and the record disagree, for both. That gap is usually the article.
