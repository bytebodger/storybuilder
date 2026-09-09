# Universes

One directory per universe, each self-contained and sealed off from the others. `_template/` is the
skeleton; `phonon/` is a worked example of the closure rules described in
[../docs/data-model.md](../docs/data-model.md).

Create one with the CLI rather than by hand — it writes a valid manifest and store directory:

```bash
cd store && npx tsx src/cli.ts new-universe my-universe --name "My Universe"
```

Universes are isolated from the tooling on purpose: a universe directory can be moved into its own
repository, or kept private in a submodule, without dragging the skills along.
