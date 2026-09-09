# store

The canon store: the data model, its file-backed implementation, and the `sb` CLI that skills use to
read and write it.

```bash
npm install
npm test
```

The CLI runs from the repository root, where a single script gives it one stable form:

```bash
npm run sb -- help
```

| File | What it is |
| --- | --- |
| [src/types.ts](src/types.ts) | The data model. Items, tags, closure. |
| [src/store.ts](src/store.ts) | The `Store` interface — the seam an external database would slot into. |
| [src/json-store.ts](src/json-store.ts) | The current backend: JSON files inside a universe directory. |
| [src/brief.ts](src/brief.ts) | Renders an item's neighbourhood as the text a skill puts in front of the model. |
| [src/validate.ts](src/validate.ts) | Checks the invariants a hand-edit can break. |
| [src/cli.ts](src/cli.ts) | `sb` — the command surface skills are written against. |

The design and its rationale are in [../docs/data-model.md](../docs/data-model.md). The short
version: closure is what stops invention, containers are what keep myth out of fact, and dates are
what keep the past from walking around in the present.

## Using it from a skill

Skills are prose, so they reach the store through the CLI:

```bash
npm run sb --silent -- --universe phonon find "Kell"   # resolve a name to an id
npm run sb --silent -- --universe phonon brief <id>    # everything related, in one pass
npm run sb --silent -- --universe phonon add locations "Vess" --kind city --link <country-id>
npm run sb --silent -- --universe phonon containers
npm run sb --silent -- --universe phonon validate
```

`--silent` suppresses npm's own banner. It is required for `show`, whose output is JSON that the
banner would otherwise corrupt, and is worth using everywhere for readable output. It still matches
the permission prefix below.

One form everywhere matters more than brevity here: skills invoke the CLI from a non-interactive run
that has nobody to approve a permission prompt, so the bridge grants exactly `Bash(npm run sb:*)` and
nothing else. A skill that reached the store by some other path would simply be denied.

`brief` is the important one. It states, for every relation set, whether the set is complete — so
"you may invent here" and "you may not" are both explicit, and neither has to be inferred from what
happens to be present.
