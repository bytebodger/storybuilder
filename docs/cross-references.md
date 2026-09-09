# Cross-references

Reading an article, mentions of other articles are links. "Eastlandia" in the Bottonfly's description
leads to Eastlandia; "the thorinfly" leads to **Thorinflies**.

Linking happens in [store/src/linkify.ts](../store/src/linkify.ts), on the same normaliser
[`stub-forge`](stubs.md) uses. That is deliberate: both features ask one question — *does this term
name something this universe has?* — and answering it twice, in two places, would mean two answers
that drift.

## What gets linked

| In the text | Links to | Why |
| --- | --- | --- |
| `Eastlandia` | Eastlandia | Exact. |
| `the thorinfly` | **Thorinflies** | Plurality and the leading article are normalised away. |
| `Antin Forin` | **Antin Forin, III** | Matched through the alias kept when the stub was retitled. |
| `the Quiet Hand` | **The Quiet Hand** | The link covers `Quiet Hand`; the article stays outside it. |
| `The Dawn Reavers` | **Dawn Reavers** | Longest match wins, so a link is never half a name. |

And what does not:

- **The article itself.** The Bottonfly's own article does not link the word "bottonfly".
- **Later mentions.** Only the first in each field, as a wiki would. Every occurrence of a common
  term would drown the prose.
- **Fragments of longer words.** "doldrums" is not a link to Dol.
- **Ordinary English**, however an article happens to be titled. A short stop list covers words that
  would otherwise produce a link in nearly every sentence.
- **Anything the universe does not have.** "Boundless Plain" stays plain text until it exists — which
  is exactly the prompt to record it.

## Stubs are linked, and shown as stubs

A stub is a destination. Following a name to a page that says *nothing is established yet* is more
useful than not being able to follow it, because it tells the reader the name is real and the article
is owed.

Stub links are drawn with a dashed underline, and their tooltip says so. A reader can see, in the
prose itself, how much of what an article leans on has actually been written.

## Accuracy

This is a heuristic, and it is meant to be a good one rather than a perfect one.

Matching is case-insensitive and singularises the head noun, which is what makes "the thorinfly" work
and what will occasionally link a word that happened to match. The failure modes are mild in both
directions: a wrong link is visible and one click from being seen as wrong, and a missed link leaves
the text exactly as the author wrote it.

Two known limits, both inherited from the normaliser: singularisation is an English heuristic (right
on `flies`, `wolves`, `boxes`; wrong on `axes`, `geese`), and a term is matched by spelling, so an
article referred to by a description rather than a name — "the great southern ocean" for The Sunder —
is not found. Recording that phrasing as an alias is the fix, and it makes the reference work
everywhere at once.

## Segments, not markup

`linkify` returns a list of runs — plain text, or text with a target — rather than an HTML string.
Nothing downstream has to parse or sanitise a string built from an author's own prose, and the
renderer decides what a link looks like. The text always rebuilds exactly, whitespace and punctuation
included; there is a test that asserts it.
