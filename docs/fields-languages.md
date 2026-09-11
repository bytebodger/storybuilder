# Language fields

The spec lives in [store/src/languages-fields.ts](../store/src/languages-fields.ts).

| Field | Stored as | Covers |
| --- | --- | --- |
| Name | item name | Required. What its speakers call it. |
| Pronunciation | attribute | [Common to every container](containers.md#fields-every-container-gets). |
| Description | item summary | Who speaks it and what it sounds like. Shown wherever it is mentioned. |
| Parent Languages | attribute (list) | What it descends from, or was made out of. |
| Spoken By | attribute (list) | Peoples, faiths, orders, trades. |
| Geographic Distribution | attribute | Where it is spoken, understood, and driven out. |
| Writing System | attribute | The script, if there is one, and who is taught it. |
| Phonology | attribute | How it sounds. |
| Morphology | attribute | How words are built and changed. |
| Syntax | attribute | What has to agree with what. |
| Vocabulary | attribute | What it is rich in, and what it has no word for. |
| Sentence Structure | attribute | The order it comes out in. |
| Cultural Significance | attribute | What speaking it says about a person. |

Parent Languages and Spoken By are lists, so each entry links to its own article — an ethnicity, an
institution, an older tongue.

## Syntax and Sentence Structure are split the way a grammar splits them

They overlap by nature, so the help text draws the line: **syntax is what has to agree with what** —
cases, particles, the marking that decides who did what to whom — and **sentence structure is the
order it comes out in**, including where the question word goes and how negation is built. Sentence
Structure asks for a short sentence in the language, glossed word by word.

## The linguistics fields are rolled

Five fields here ask for linguistics, and that is exactly where a generator writes the most and says
the least. Asked about the morphology of a language nobody has described, a model returns a paragraph
of textbook that is true of a thousand languages and tells a reader nothing about this one.

So they are rolled, and the help text asks for **one concrete thing a speaker would notice** rather
than a survey: a sound an outsider cannot make, one rule with an example, eleven words for the state of
a tide and none for a mountain.

| Field | Rate | |
| --- | --- | --- |
| Morphology | 40% | |
| Syntax | 40% | |
| Sentence Structure | 40% | |
| Phonology | 50% | |
| Parent Languages | 50% | plenty of languages have no recorded ancestor |
| Writing System | 60% | an unwritten language is an ordinary thing to be |
| Vocabulary | 60% | the likeliest of the five, and the most useful |
| Cultural Significance | 60% | |

Description, Spoken By and Geographic Distribution carry no rate: who speaks a language and where is
what the article is for. See [fill-rates.md](fill-rates.md).

**Writing System at 60%** is the one worth pausing on. A model handed the field invents a script every
time, and a world where every tongue is written is a world with no oral tradition and no illiteracy to
be exploited.
