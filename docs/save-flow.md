# The save flow

Saving an article — new or edited, it makes no difference — starts a two-round review. Both rounds
read the same text and reach opposite conclusions about the same words, which is why they run in
sequence rather than together.

```
save → stub review → create accepted stubs → canon check → the article
         (skipped if nothing)                  (skipped if nothing)
```

## Why the order carries the meaning

An unrecognised name is a **stub candidate** to one skill and an **unrecorded reference** to the
other. Run together, they would double-report every term, and the author would have to reconcile two
lists saying the same thing in different words.

Run in sequence, they agree, because the first round changes what the second one sees:

- A stub the author **accepted** is canon by the time the check runs. The reference resolves and is
  never reported.
- A stub the author **declined** is not. Declining is saying the thing is not real — so prose leaning
  on it is a genuine finding, and hearing about it once is the point.

The author's decision in round one *is* the answer round two needs. Nothing has to be inferred.

## Round one: loose ends

[`stub-forge`](../.claude/skills/stub-forge/SKILL.md) proposes placeholders for terms the article
leans on but never explains. The store screens them against everything the universe already has, and
the survivors are shown on one screen — accept or reject each, edit the title, choose the container.
See [stubs.md](stubs.md).

If nothing survives screening, the screen never appears.

### Retitled stubs keep the name the prose used

A candidate raised as `Antin Forin` and saved as `Antin Forin, III` is stored with the original as an
**alias**. Without that, round two would look for "Antin Forin", fail to find it, and report the
reference the author had just dealt with. Editing a title is expected — it should not cost a false
alarm.

## Round two: canon check

[`canon-check`](../.claude/skills/canon-check/SKILL.md) reads the same fields and reports where they
disagree with the store: contradictions, closed-set violations, natural-law breaches, references to
things that have ended, dates outside the canon's span, and whatever references remain unrecorded.

Findings are ordered by seriousness — contradicting something deliberately settled outranks a loose
name — and nothing is changed. A contradiction between a good paragraph and an early canon note is
often best fixed by changing the note, and only the author knows which way round it goes. The screen
offers exactly two ways on: edit the article, or keep it as written.

If there are no findings, the screen never appears.

### A stub is not a contradiction

The article that spawns a stub says things about it — "the third potentate of the Archane Order" is
what created the Archane Order stub in the first place. That is normal authoring, not a conflict, and
the check is told so explicitly. A stub is reported only when the article contradicts something
actually recorded about it.

Without that instruction, every accepted stub generates a finding in the very article that produced
it, and the second screen punishes the author for using the first one.

## What code decides, and what the model decides

Same split as everywhere else in the tool. The model reads prose; the store adjudicates existence.

| Judgement | Made by |
| --- | --- |
| Is this term unexplained? | the model |
| Does this term already exist in the universe? | the store, on a normalised form |
| Does this passage contradict canon? | the model |
| Is this "unrecorded reference" actually unrecorded? | the store, re-checked after the stub round |
| Which findings matter most? | fixed ordering in code |

Only `unknown-reference` findings are mechanically checkable, and those are re-screened against the
store after round one — which is the mechanism that makes accepted stubs disappear from round two.
Everything else is a judgement about prose, where code has nothing to add.

Note that the model's proposals vary between runs; the screening applied to them does not.
