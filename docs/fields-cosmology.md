# Cosmology fields

The spec lives in [store/src/cosmology-fields.ts](../store/src/cosmology-fields.ts).

The bodies, not what happens in the sky. A comet is cosmology; the night it set the harbour alight is
[history](fields-history.md), and a festival where the sky sometimes answers is phenomena — see
[containers.md](containers.md#cosmology-and-phenomena). Known Cycles is where the two touch: a return
is a property of the body, whatever people later made of it.

| Field | Stored as | Covers |
| --- | --- | --- |
| Name | item name | Required. Its most widely used name. |
| Pronunciation | attribute | [Common to every container](containers.md#fields-every-container-gets). |
| Description | item summary | What it is and how it looks from the ground. Shown wherever it is mentioned. |
| **Alternative Name(s)** | **`aliases`** | Older names, other peoples' names, sailors' names. |
| **Type** | **`kind`** | star, planet, moon, comet, asteroid, constellation. |
| Distinctive Features | attribute | What sets it apart to someone looking up. |
| Associated Legends | attribute | Stories told about it, and by whom. |
| Localized Impact | attribute | What it does to the world below, and what it is used for. |
| Known Cycles | attribute | Its returns and changes, with the period. |
| History | attribute | First record, notable passages, how understanding changed. |

## Type is the kind, and closed sets count by it

Type is not an attribute. It is written to the item's `kind` column — the first spec to do so — because
that is what [closure](containers.md#kinds) groups on. Phonon's planet has its moons closed at two:

```
MOON (2) - COMPLETE. Phonon has exactly 2 of type moon, listed here.
  Why: Two moons, and the tide tables depend on there being exactly two.
```

Kinds are compared exactly. A third moon typed as `Moon` would be a set of its own that nothing had
closed, and it would pass. So the form **lowercases whatever is typed into a kind field** before it is
saved. The catalog's suggestions were already lowercase, and every item Phonon holds already matches.

This only covers the form. A kind set from the CLI is still stored as typed.

The article view shows the kind as a badge beside the title, so Type is not repeated in the facts
beside the prose. The same goes for any spec that stores a field as `kind`.

## Alternative names are aliases

The same arrangement as a person's [nicknames](fields-people.md). Stored as `aliases`, a sailor's name
for a star, written in some other article, links to this one — and [stub-forge](stubs.md) never raises
a stub for a name the body already has.

## Localized Impact separates effect from blame

A moon that moves the tides and is said to cause madness has made two claims, and only one of them is
the moon's. The help text asks for both, and for which is which.

## Known Cycles wants a number

"Every ninety-one years" is a fact a calendar can be built on. "Periodically" is not.

## Fill rates

| Field | Rate | |
| --- | --- | --- |
| Alternative Name(s) | 50% | many bodies go by one name |
| Associated Legends | 50% | |
| History | 50% | |
| Localized Impact | 60% | a distant star does nothing to the world below |
| Known Cycles | 70% | a fixed star has none worth recording, and a model asked for one will invent it |

Description, Type and Distinctive Features carry no rate. See [fill-rates.md](fill-rates.md).
