# bridge

A small local service that lets the [web console](../web) invoke skills. It is the only component
that touches the working tree — the frontend is static and can't run anything itself — so it binds to
`127.0.0.1` and must never be exposed on a network.

```bash
npm install
npm run dev     # http://127.0.0.1:8787
```

| Endpoint | Purpose |
| --- | --- |
| `GET /api/worlds` | Directories under `worlds/`, excluding `_template`. |
| `GET /api/skills` | The skill catalog, read from `.claude/skills`. |
| `GET /api/universe/fields` | The universe form's field spec, from the store. |
| `GET,POST /api/universe` | Read, create, or update a universe manifest. |
| `POST /api/universe/forge` | Generate values for named fields only. |
| `POST /api/run` | Invoke a skill against a world. |

`/api/run` shells out to the `claude` CLI and asks it to use the named skill, rather than
reimplementing anything: a skill behaves the same whether it was reached from this UI or typed into
Claude Code directly.

Two things this service is responsible for, and neither can be delegated to a prompt:

- **Locks.** `POST /api/universe/forge` discards any field the model returns that was not requested,
  and reports what it dropped. A prompt asking that locked fields be left alone is a suggestion; one
  stray key would silently overwrite protected work. Tested in [test/forge.test.ts](test/forge.test.ts).
- **The permitted surface.** A non-interactive run has nobody to answer a permission prompt, so
  `ALLOWED_TOOLS` in [src/server.ts](src/server.ts) grants exactly `Bash(npm run sb:*)` plus reads —
  declared in code, reviewable in one place.

Prototype limitations:

- Output is buffered until the run finishes; there is no streaming.
- Proposed canon diffs aren't extracted from the run yet, so `RunResult.diff` is never populated.
