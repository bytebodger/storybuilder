---
name: canon-query
description: Answer what is established about a person, place, faction, or anything else in a universe's canon, with sources, and say plainly what is not established. Use when the user asks what is known about something, what the canon says, or wants a briefing on an entity before writing.
writes: false
args: [{"name":"subject","label":"Subject","placeholder":"Kell","required":true}]
---

# canon-query

Answer from the store. Never from memory, never from inference, never from what would make a good
story.

**Reads:** the universe manifest and the canon store.
**Writes:** nothing. If the answer requires establishing a fact, that is `canon-add`, and it is the
author's decision, not yours.

## How to answer

Assume `$U` is the universe id. Run everything from the repository root.

1. **Read the constraints first.**
   ```bash
   npm run sb --silent -- --universe $U intro
   ```

2. **Resolve the subject to an id.**
   ```bash
   npm run sb --silent -- --universe $U find "<subject>"
   ```
   - No match: say so, and stop. "There is no Kell in this universe" is a complete and correct
     answer. Do not offer a plausible Kell.
   - More than one match: list them with their containers and ask which. Do not pick.

3. **Read the neighbourhood.**
   ```bash
   npm run sb --silent -- --universe $U brief <id>
   ```
   The brief is the answer's backbone. It carries the summary, the related items grouped by type, and
   for each group whether the set is complete.

4. **Follow one hop where it matters.** If the subject's country or continent is relevant to what was
   asked, run `brief` on that too. Do not walk the whole graph — a brief of every neighbour of every
   neighbour is noise, and the author asked about one thing.

## What the answer must contain

- **What is established**, with the id of the item each fact came from. An assertion with no id
  behind it is a guess, and guesses are what this tool exists to prevent.
- **What is complete.** If a relation set is closed, say so in the answer: "Kell has one city, and
  that is all of them." This is usually the most useful sentence in the reply, because it is the one
  the author cannot get by reading a list.
- **What is not established.** An explicit list. If the author asked about Kell's ruler and no ruler
  is recorded, the answer is "no ruler is recorded" — not a ruler.
- **What has ended.** An item with an `endDate` really was one of them, and no longer is. Say both
  halves; a brief marks these `NO LONGER EXTANT`.

## What the answer must not contain

- A fact that is not in the store, however obvious. If Kell is coastal and has one port, it does not
  follow that the port is its capital unless the store says so.
- A filled gap. Silence in the store is silence in the answer.
- A suggestion dressed as a fact. If you want to propose something, mark it clearly as a proposal and
  say it is not canon.
