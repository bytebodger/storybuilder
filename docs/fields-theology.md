# Theology fields

The spec lives in [store/src/theology-fields.ts](../store/src/theology-fields.ts).

Religions and cults of any size, and also individual deities, doctrines and dogmas. Twenty-nine fields
in seven sections, grouped the way [institutions](fields-institutions.md) is — sections follow the
spec's order exactly, and a test holds them to it.

| Section | Fields |
| --- | --- |
| **Overview** | Name, Pronunciation, Description, **Founding Year**, **Dissolution Year**, **Aliases**, Estimated Population/Members, Founders |
| **Inside** | Structure, Culture, Public Agenda, Assets |
| **History** | History, Disbandment |
| **Reach** | Owned/Controlled Locations, Associated Locations, Associated Ethnicities, Associated Institutions |
| **Rule** | Laws & Covenants, Governance |
| **Belief** | Legends & Mythology, Origins, Ethics |
| **Faith** | Tenets of Faith, Worship Practices, Priesthood, Claimed Powers, Pantheon, Sects |

Most of this is [institutions](fields-institutions.md) again, and deliberately: a faith with a
hierarchy, property and a founding year **is** an institution that also believes something. Founding
Year and Dissolution Year are the item's `beginDate` and `endDate`, and Aliases are its `aliases`, so a
brief can say how old a faith is and what else it is called without knowing this spec.

The six fields in **Faith** are what the shared shape cannot say.

## A claim is not an establishment

**Claimed Powers** is the field this container most needs handled carefully. It asks what adherents say
their faith confers — healing, prophecy, protection, a good passage — and who is said to have shown it.
The help is explicit that recording the claim is not establishing the fact:

> where the universe's laws say nothing of the kind happens, record the claim and say that it is one

Phonon's manifest says there is no magic, and it still has priests who say otherwise. Both are true at
once, and an article that cannot hold both would force an author to choose between a world with a
miracle in it and a world with no believers.

It is rolled at 40%, so most faiths claim nothing in particular — and a universe that wants none at all
can [set it to zero](fill-rates.md#a-universe-overrides-what-it-disagrees-with), the way Phonon already
does for a person's special abilities.

## What a faith may not have

**Priesthood at 70%** — plenty of faiths keep no clergy; the household keeps its own rites, and saying
so is a fact about the faith. **Pantheon at 70%** — this container holds single deities and bare
doctrines as well as religions, and neither of those has a pantheon. **Sects at 30%**, as for an
institution.

**Dissolution Year and Disbandment at 20%** are [Existed Until](fields-locations.md) again: a blank
Dissolution Year is the claim that the faith is still kept, and a generator filling it every time
buries four rites in five.

## Fill rates

| Field | Rate |
| --- | --- |
| Dissolution Year, Disbandment | 20% |
| Sects | 30% |
| Claimed Powers, Legends & Mythology | 40% |
| Founders | 45% |
| Aliases, Assets, Ethics, Owned/Controlled Locations, Associated Ethnicities, Associated Institutions | 50% |
| Estimated Population/Members, Associated Locations, Origins | 60% |
| Priesthood, Pantheon | 70% |

Description, Founding Year, Structure, Culture, Public Agenda, History, Laws & Covenants, Governance,
Tenets of Faith and Worship Practices carry no rate. **Tenets and Worship** are the pair that make the
article: a faith piece that has rolled away what must be believed and what the faithful do has not said
anything about a faith. See [fill-rates.md](fill-rates.md).

## Two places to leave a contradiction standing

**Public Agenda** asks what a faith says it wants and, where different, what it acts as though it
wants. **Origins** asks for the account of how it began — the revelation, the vision, the first
convert — which is not the Founding Year, and where the story and the record disagree, for both. Those
gaps are usually the article.
