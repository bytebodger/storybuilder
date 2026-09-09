# store

Canon lives here: one JSON file per container, named for the container
(`planet.json`, `country.json`, `religion.json`). Files appear as containers are
used; there is no fixed set of containers and no schema to declare first.

These files are readable and hand-editable on purpose, but the reciprocal edges
between items are maintained by the store, not by hand. After editing one
directly, run `sb validate` to check the edges still agree.

See [../../../docs/data-model.md](../../../docs/data-model.md).
