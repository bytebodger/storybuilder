# History fields

The spec lives in [store/src/history-fields.ts](../store/src/history-fields.ts).

An event, not a period. That distinction is the entire design of this container, and it is enforced by
what the form asks for rather than by a rule.

## There is no End Date, on purpose

An event has a **Begin Date** and a **Duration in days**. Asking for an end date instead invites this:

> The Reign of King Arnold — 1 January 1139 to 19 October 1150

A thing that spans eleven years is not an event. It is a [timeline](timelines.md), and it wants events
filed underneath it. Asking *how many days it took* makes the same entry read as the mistake it is.

Nothing stops an author typing `4309`. The field is a nudge, not a fence — and a flood that ran nine
days is exactly what it is for. Most events last a day, because that is how events are remembered: the
signing of the Declaration of Independence did not take a day, and it is still the fourth of July.
Zero is for something over in minutes.

| Field | Stored as | Covers |
| --- | --- | --- |
| Name | item name | What it is called afterwards. |
| Pronunciation | attribute | [Common to every container](containers.md#fields-every-container-gets). |
| **Begin Date** | **`beginDate`** | Required. Free text, but a year has to be in it. |
| **Duration (in Days)** | attribute (number) | Required. Defaults to `0`. |
| **Timeline** | **`timeline`** | Required. Defaults to the Universal History. |
| Description | item summary | What happened, in two to four sentences. |
| Long-Term Consequences | attribute | What the world was like afterwards that it was not before. |
| Related Ethnicities | attribute (list) | |
| Related Locations | attribute (list) | |
| Related People | attribute (list) | |
| Related Institutions | attribute (list) | |

## The timeline is a column, and it is chosen

`storeAs: 'timeline'` writes to a column on the item, beside `beginDate` and `endDate` — not into
`attributes`. The reason is the same as for the dates: **a timeline's span has to be readable from its
events without knowing which container they came from or what that container calls its fields.**

It is also a new field *kind*. A `timeline` field renders as a picker over the universe's actual
timelines, indented to show the nesting, rather than a text box:

```
Universal History
  History of Waresia
    Reign of King Tarinian
      War of the Stewards
```

A timeline that does not exist is not a typo to be caught later — it is an event filed nowhere — so
the store refuses one outright:

```
No timeline with id "nope" in universe "watia". It has: Universal History [universal], …
```

That check lives in the store rather than the field spec, because it is a question about the world and
not about the shape of a form. The article view reads the id back as the timeline's name.

## Reading a year out of a date

A timeline spans a pair of numbers; a begin date is free text, because fictional calendars are not ISO
dates. Something has to bridge that, and `yearOf` does:

| | |
| --- | --- |
| `Year 412` | 412 |
| `January 1, 1139` | 1139 |
| `Third Age, 2941` | 2941 |
| `about -570` | −570 |
| `1139 to 1141` | 1139 |
| `midwinter` | *nothing* |

The rule is **the longest run of digits**, with a minus sign if one is against it, and the first of
them if two tie. `January 1, 1139` gives 1139 because four digits beat one; `1139 to 1141` gives 1139
because a begin date names when a thing *began*.

It is a heuristic, and it is stated rather than hidden. What it cannot read, it says it cannot read —
and `sb validate` reports every one:

```
WARNING: "The Night of Bells" has no year that can be read out of its begin date
("midwinter") - it will not count toward the span of any timeline
```

A heuristic that fails loudly is a heuristic. One that fails quietly is a bug waiting to be found by a
reader who trusts a timeline that is wrong. The event stays filed where it is and still counts in the
tally; it simply cannot be placed.

## What it looks like filed

```
$ sb timelines
Universal History  412 - 431  (5 events)
  History of Waresia  [b46a96b3]  412 - 431  (5 events)
    Reign of King Tarinian  [5ce21481]  425 - 431  (4 events)
      War of the Stewards  [71580945]  429 - 431  (2 events)
```

A parent's span and count cover everything beneath it. Nothing is filed in two places — the same event
is simply *within* both, which is what nesting history means.

## Removing a timeline moves its events

The question [timelines.md](timelines.md) left open, now that there are events to strand. They move up
to whatever inherited the removed timeline, alongside its child timelines:

```
$ sb remove-timeline "War of the Stewards"
Removed "War of the Stewards". Moved up to Reign of King Tarinian -
2 event(s): The Bridge at Nosterlis, The Burning of the Ash Seat.
```

Moving rather than refusing, because promoting stays true: an event filed under the war did happen
during the reign that contained it. Refusing would mean re-filing every event by hand to be rid of a
grouping that turned out to be a bad idea.

## The four Related fields are lists, not edges

`Related People` and its three siblings hold names, and the
[cross-referencer](cross-references.md) turns each into a link where an article exists. Names with no
article yet stay plain text, which is the prompt for [stub-forge](stubs.md) on save.

They are **not** [tags](data-model.md) — no reciprocal edge is written, so a person's article does not
yet list the events they were in. That would need name-to-id resolution in the save path, and a
decision about what to do with a name that has no article to point at. These four are the strongest
candidates in the tool for being promoted to real edges; it is a discrete piece of work rather than
part of this spec.

## Where events are read

`sb timelines` from the command line, and **Chronology** in the console — the lanes and the ordered
list of events, described in [timelines.md](timelines.md#the-chronological-view).
