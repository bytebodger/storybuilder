# The trash

Deleting an article does not destroy it. It goes out of the world and stays on disk, and coming back is
one write.

The code is [`trash`/`restore` in json-store.ts](../store/src/json-store.ts) and
[references.ts](../store/src/references.ts). The console offers it on every article; `sb trash`,
`sb restore` and `sb trash-list` are the same thing from the command line.

## One filter, in one place

A trashed item is skipped by `list()`, and **every read that should not see it comes through there**:
the navigation, the briefs, the [cross-referencer](cross-references.md), `validate`, the
[rolled skeleton](rolled-skeleton.md), and so every canon check and canon query. Restoring is the same
filter run again.

Two reads deliberately do not use it:

- **`get()`**, which still finds a trashed item — it is what the trash view and a rescue read through.
- **`mintId()`**, which mints against everything on disk. An id handed out twice because its first
  holder was in the trash would collide the moment that article came back.

## What you are told before you delete

The confirmation is the reference count, because "are you sure?" with no idea what depends on the
article is not a question anyone can answer. Two kinds, and they are different in kind:

| | What it is | What deleting does |
| --- | --- | --- |
| **Linked** | A recorded relationship — an edge both articles carry | **Cut**, on both sides, and kept so a restore can re-make them |
| **Mentioned** | The name appears in somebody's prose | **Nothing.** The words stay exactly as written |

Ricky Rocket is named in three articles. Trashing him removes the relationships, and does not touch a
syllable of those three articles. Their sentences still say *Ricky Rocket*; the name simply stops
linking to an article that is no longer in the world.

Mentions are found by running the [linkifier](cross-references.md) against the one article, so "the
Rockets" counts for exactly the reason it would have linked.

## A rescue is not lossy

The edges cut on the way in are kept on the item, so restoring re-makes them rather than asking the
author to remember what they were.

Best effort, and deliberately not a reason to fail the rescue: a set [closed](containers.md#kinds)
while the article was away refuses a new member, and the far end may itself have been removed. What
could not be re-made is reported rather than swallowed.

The far side's own **role** on an edge is not kept — only this article's half is — so a relationship
that was labelled from both ends comes back labelled from one.

## The trash still counts as written down

One question treats a trashed article as existing, and only one: **does this name already exist in this
universe?**

That is what [`stub-forge`](stubs.md) asks on save, and what `sb resolve` answers. A name in the trash
is one the author has already written down, so proposing a stub for it would offer to create the very
thing they just threw away. Write "Ricky Rocket" into a new article while he is in the trash and
nothing is proposed; `sb resolve "Ricky Rocket"` says he is there, and says he is in the trash.

Every other read wants the world alone, and gets it.

## Where it is

The console shows a **Trash** section in the navigation, below the containers, listing what is in it
with the container each came from. A trashed article opens as normal, marked as trashed, with
**Restore** where **Edit** would be.

Nothing purges the trash. Emptying it is not offered, because nothing in this tool destroys an
article — `sb remove` is the one operation that does, and it is deliberately a command-line act.
