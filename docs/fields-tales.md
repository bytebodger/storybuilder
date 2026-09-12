# Tale fields

The spec lives in [store/src/tales-fields.ts](../store/src/tales-fields.ts).

The sparsest spec in the tool, and deliberately. Every other container describes the world; this one
holds the fiction written inside it, and a form that interrogated a short story about its themes would
be in the way. It is the only [narrative container](containers.md#articles-are-not-stories).

| Field | Stored as | Covers |
| --- | --- | --- |
| **Title** | item name | Required. |
| Pronunciation | attribute | [Common to every container](containers.md#fields-every-container-gets). |
| **Standalone?** | attribute (boolean) | Required, on by default. |
| Parent Tale Container | attribute | Shown only when Standalone is off. |
| Previous Tale (Chapter) | attribute | Likewise. |
| Next Tale (Chapter) | attribute | Likewise. |
| Story | attribute | The story itself. |

Nothing here is rolled: seven fields, and six of them already answer themselves.

## Title, not Name

Nobody asks what a story is called by asking its name. The field is labelled **Title** and keyed
`name`, so it still feeds the item's name column and everything that finds, links or titles an article
works exactly as it does for every other container. The label is the only thing that changed — which is
all `label` has ever been for.

## Two mechanisms this spec introduced

**A `boolean` field kind.** Standalone is a checkbox, because a question with two answers should not be
a text box that accepts "sort of". The important part is that **`false` is a value**: a required
boolean answered *no* is filled, not blank. The store, the bridge and the form all had to agree on
that, and a hand-edited file saying `"no"` or `"false"` is read the same way.

**Conditional fields**, through `showWhen` on the field spec:

```ts
showWhen: { field: 'standalone', equals: false }
```

Where a piece sits in a longer work is not a question worth asking until somebody says it is part of
one. A hidden field is hidden from everything — it is not rendered, not generated, and not counted as
missing when it is required — but it **keeps its value**, because a checkbox toggled twice should not
cost the author their typing.

Any container can use both from now on; tales is simply the first with a use for them.

## What this does not do yet

Your spec asks for Previous and Next to appear only when the parent work already has another chapter
filed under it. They appear whenever Standalone is off, because visibility is evaluated against the
form's own values and the form does not know what else the store holds. Making it sibling-aware means
the form fetching the tales under the named parent — worth doing when there are real chapters to try it
against.

They are also plain names, not pickers: Parent, Previous and Next are text, matching Parent Location
and Parent Institution, and each links itself where an article of that title exists. No reciprocal edge
is written, so a parent tale does not yet list its chapters.

## Where the prose actually lives

A long draft is easier to live with in the universe's `narrative/` files, with the tale here as the
entry that points at it. Whatever is in Story is [cross-referenced](cross-references.md) like any other
prose, so a story is also a record of what it touched.
