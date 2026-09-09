# The universe form

A universe is the top of the hierarchy, and its manifest is the only thing every skill reads before
doing anything else. This document covers the fields, and the generation model behind the form.

A universe is a *canonical* universe, not necessarily a cosmological one. Its name may point at
something inside the fiction (the Exoria galaxy, the planet Farion V) or at the body of fiction itself
— nothing inside Star Wars is called Star Wars.

## Fields

Defined once, in [store/src/universe-fields.ts](../store/src/universe-fields.ts). The form renders
from that spec, the generator is briefed from it, and the bridge validates against it — so a field
added there appears in the UI, becomes generatable, and is accepted on save, with nothing else to
change.

| Field | Required | Default | For |
| --- | --- | --- | --- |
| Name | yes | — | The label covering every story told within the universe. |
| Total years | no | `1000` | Canon spans Year 0 to Year *N*. |
| Genre(s) | no | — | High fantasy reads nothing like dark cyberpunk. |
| Tone | no | — | Emotional register: apocalyptic, whimsical, Kafkaesque. |
| Recurring theme(s) | no | — | What stories here keep returning to. |
| Scale | no | — | Galactic, planetary, kingdom, society, continent. |
| Natural laws | no | — | The unusual ground rules. Magic? Deities? Megafauna? |
| Origins | no | — | How the universe came to be. |
| Geography | no | — | Dominant features of the physical environment. |
| Culture(s) | no | — | Global features of the cultures with the most sway — not the detail. |
| Inspiration | no | — | Real-world works whose influence should be felt. |

**Total years** is not a naturalistic age. A planet may be billions of years old while its canon
covers a hundred; enter what the canon spans. It does not constrain when stories are set — a
1000-year universe can be written about entirely in Year 250. Briefs state the span, so a skill knows
that a date outside it is outside the canon.

> Richer dating — named ages and eras, so a date reads "Year 432 of the First Age" — is a later
> feature. `totalYears` is deliberately the simplest thing that can carry a chronology until then.

## Generation

Empty fields can be filled by AI; filled fields never are. The whole design follows from one rule:
**the author's text is never overwritten without them asking.**

- **Fill empty fields** — the form-level button generates every field that is unlocked *and* empty.
- **Regenerate one field** — clears it first, then generates a replacement. Regeneration is a
  deliberate act, so it is allowed to discard a value the form-level button would have preserved.
- **Lock** — excluded from every generation and every clear, form-level or otherwise.
- **Clear** — empties a field, making it a candidate for the next fill.

Whatever is already on the form is sent as context, so generated values cohere with it: a `high
fantasy` universe does not come back with a recurring theme about nuclear arsenals. Generating several
fields at once produces one imagined world rather than a scatter of independently plausible answers.

Saving never generates. A field left blank is saved blank — silence is a legitimate answer, and briefs
omit empty fields rather than inviting a skill to fill the gap.

### Locks are enforced in code, not in the prompt

The skill is told to return only the requested fields. It is also *made* to: the bridge discards any
key that was not in the request before anything reaches the form, and reports what it dropped. A
prompt asking nicely that locked fields be left alone is a suggestion; one stray key in one response
would silently overwrite work somebody deliberately protected. The rule is tested in
[bridge/test/forge.test.ts](../bridge/test/forge.test.ts).

Responses are also coerced to each field's declared shape — a list field given
`"space opera, gothic horror"` becomes an array — and an empty generated value is treated as no
answer rather than as an instruction to blank the field.

## The skill

One skill, [`universe-forge`](../.claude/skills/universe-forge/SKILL.md), handles all three
generation paths, because filling an empty form, regenerating one field, and regenerating everything
unlocked are the same operation with a different target list. Splitting them would be three copies of
the same coherence logic, drifting apart.

It is named for what it does rather than `universe-edit`, because saving the form involves no model
at all — a skill named "edit" would accrete the save path, and then the form could not save without
invoking one.
