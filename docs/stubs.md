# Stubs

Worldbuilding cascades. An article about the Dawn Reavers mentions Parth, where they are based; Parth
would mention the families that run its docks; those would mention the guild that licenses them.
Writing every supporting article first means never finishing the first one.

A **stub** is the way out: a name and a container, nothing else, recorded so a later session can find
it. The author writes it when they choose.

## The third state

A stub is not an absent thing and not a described thing. It is its own answer, and skills are told to
treat it as one:

```
Antin Forin, III - people - id 9328b7c0
STUB. This exists and is named, and nothing else about it is established. You may refer to it;
you may not state anything about it. If the story needs a fact here, say so and ask.
```

That distinction is the whole value. Without it, a name mentioned in one article and nowhere else is
indistinguishable from a name nobody ever wrote — so the next skill to encounter it either invents a
biography or refuses to mention a person the author clearly established. A stub says exactly how far
the commitment goes.

Stubs are marked wherever they appear in another item's neighbourhood, so an article that leans on
one can see what it is leaning on:

```
PEOPLE (1) - OPEN. ...
  - Antin Forin, III [9328b7c0] (stub)
```

## The workflow

1. **Saving an article triggers a scan.** Only fields the author actually filled are read — a blank
   field was left blank on purpose.
2. **[`stub-forge`](../.claude/skills/stub-forge/SKILL.md) proposes candidates**: unexplained proper
   nouns, and the common nouns that are plainly of this world. `thorinfly` and `muddwood` matter as
   much as `Antin Forin`, because they are the vocabulary a world is built from.
3. **The store screens them.** Anything the universe already has is dropped before the author sees it.
4. **The author reviews all of them on one screen**, accepting or rejecting each, editing the title,
   and choosing the container.
5. **Accepted stubs are created.** A name, a container, a link back to the article that referenced
   them. No summary, no attributes, no generated text.

Nothing is accepted by default. A stub the author did not choose is a name in their world they did
not put there, and a screen that creates things by default trains them to click past it.

Round one of two. The [canon check](save-flow.md) runs immediately after, and reads what the author
decided here: accepted stubs resolve and are never reported, declined ones do not and are.

## "Does this already exist?" is a code question

This is the part that cannot live in a prompt.

A model reading one article can see that `thorinfly` is unexplained. Asking it to *also* know that an
article called **Thorinflies** exists is asking it to hold the whole corpus in mind — the exact thing
this tool exists because nobody can do. So the model proposes and the store decides, matching on a
normalised form that ignores case, leading articles, possessives, aliases, and plurality:

| Written | Normalises to | Matches |
| --- | --- | --- |
| `thorinfly` | `thorinfly` | **Thorinflies** |
| `The Thorinflies'` | `thorinfly` | **Thorinflies** |
| `the Casterfolk` | `casterfolk` | **Casterway** (via its alias) |
| `Dawn Reavers` | `dawn reaver` | **Dawn Reaver** |
| `Isles of the Dawn` | `isles of the dawn` | — only the head noun is singularised |

The check runs twice: once when screening the proposal, and again at creation, because the author may
have edited a title into something that already exists, or scanned the same article twice.

Singularisation is an English heuristic — right on `flies`, `wolves`, `marshes` and `boxes`, wrong on
`axes` and `geese`. A miss costs a duplicate stub the author can delete, which is the cheap direction
to fail in.

`sb resolve "<term>"` answers the same question from the command line, and the skill is told to use it.
The same normaliser drives [cross-references](cross-references.md), so a term that would not be
proposed as a stub is exactly the term that becomes a link.

## What a stub is not

Stubs are never given generated content. Drafting an article for each one would produce references of
its own, and the cascade would not stop — the feature exists precisely to interrupt that recursion,
not to automate it.

A stub also has no required fields filled in. `fauna` requires a description; a fauna stub has none,
so opening it in the article form shows the description as still required. Completing a stub is the
same act as writing any article, which is the point: the stub is a reminder, not a draft.

`universe` can never hold a stub — it is the manifest, not a container of articles. Every one of the
catalog's containers can.
