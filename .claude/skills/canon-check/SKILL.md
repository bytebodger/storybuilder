---
name: canon-check
title: Is it canonical?
description: Check a draft, scene, outline, or passage against a universe's canon and report contradictions, references to things that do not exist, violations of closed sets, and dates outside the canon's span. Use when the user asks to fact-check, verify, or continuity-check content against the world.
writes: false
args: [{"name":"content","label":"Content or file path","multiline":true,"required":true}]
---

# canon-check

Read a piece of content and report where it disagrees with the store.

**Reads:** the manifest, and the canon behind every entity the content names.
**Writes:** nothing — not even to fix what it finds. Report; let the author choose.

## Method

1. **Read the constraints.** `npm run sb --silent -- --universe $U intro` gives the natural laws and the year span. A date outside Year 0
   to Year *N* is outside the canon, and that is a finding.

2. **Extract every proper noun and every world claim.** People, places, factions, religions, items,
   dates — and also the unnamed claims: "the third continent", "her brother", "the war that ended
   the dynasty". An unnamed claim is checkable and is where contradictions usually hide.

3. **Resolve each one.** `npm run sb --silent -- --universe $U find "<name>"`, then `brief <id>` on what comes back. For a name that
   resolves to nothing, that absence is itself the finding.

4. **Compare, one claim at a time.** For each claim, the question is narrow: does the store say
   otherwise, does the store say nothing, or does the store agree?

## What counts as a finding

| Kind | Example |
| --- | --- |
| **Contradiction** | The draft says Dol is inland; the store says it is Kell's only deepwater port. |
| **Closed-set violation** | The draft names a third continent of Phonon, whose continent set is closed at two. This is the most serious kind: it contradicts something the author deliberately settled. |
| **Unknown reference** | The draft names a city that is in no container. Not necessarily an error — it may be new — but it is unrecorded, and unrecorded facts get contradicted later. In the save flow the author has just been offered a stub for it and declined, so report it once and without insistence. |
| **Out of span** | A date beyond the canon's total years, or before Year 0. |
| **Extancy** | A scene set after something's `endDate` treats it as still there. A sunken continent is still a continent; it is not still above water. |
| **Natural law** | The draft uses magic in a universe whose laws say there is none. |

## Two callers, two output shapes

Asked a question in conversation, answer in prose (below). Asked for JSON — the article-save flow
does — reply with a single JSON object and nothing else:

```json
{
  "findings": [
    {
      "kind": "closed-set",
      "field": "ecologyAndHabits",
      "term": "Northlandia",
      "passage": "ranges across all three continents",
      "says": "Phonon has a closed set of continent: Eastlandia, Westlandia [889c3b36]",
      "id": "889c3b36",
      "resolve": "Name only the two established continents, or reopen the set deliberately."
    }
  ]
}
```

`kind` is one of `closed-set`, `contradiction`, `natural-law`, `extancy`, `out-of-span`,
`unknown-reference`. `term` is the name at issue, when there is one — the caller re-checks it against
the store, so give the name as written. `passage` is a short quote, not a paraphrase.

An empty `findings` array is a real answer and the common one. Return it rather than manufacturing a
concern.

## Reporting

Group by severity, most serious first, and for each finding give:

- the passage, quoted briefly
- what the store says, and the id it says it in
- what would resolve it — usually two options: change the draft, or change the canon

Do not fix anything. Do not write to the store. A contradiction between a good scene and an early
canon note is often best resolved by changing the note, and that is a judgement only the author can
make.

If nothing is wrong, say so plainly, and list what you checked — a clean report that does not say
what it covered is indistinguishable from a report that checked nothing.

## What is not a finding

- Anything the store is simply silent about, unless the content asserts it as established. Invention
  in a draft is normal; the point of flagging an unknown reference is to get it recorded, not to
  forbid it.
- Style, pacing, or prose quality. This skill checks facts.
