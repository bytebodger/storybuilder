import { readdir, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { JsonFileStore } from './json-store.ts'
import { StoreError, type UniverseDraft } from './types.ts'

/** `universes/` at the repository root. Override with SB_UNIVERSES_ROOT. */
export function universesRoot(): string {
  const override = process.env.SB_UNIVERSES_ROOT
  if (override) return resolve(override)
  return resolve(dirname(fileURLToPath(import.meta.url)), '../..', 'universes')
}

/** Universe directories, excluding the template and anything hidden. */
export async function listUniverses(root = universesRoot()): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true })
  const names: string[] = []
  for (const e of entries) {
    if (!e.isDirectory() || e.name.startsWith('_') || e.name.startsWith('.')) continue
    try {
      await stat(join(root, e.name, 'universe.json'))
      names.push(e.name)
    } catch {
      // A directory without a manifest is not a universe.
    }
  }
  return names.sort()
}

/**
 * The only way to obtain a Store. Every caller names a universe up front and
 * gets a handle that cannot reach any other one.
 */
export async function openUniverse(id: string, root = universesRoot()): Promise<JsonFileStore> {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) throw new StoreError(`Invalid universe id "${id}"`)
  const known = await listUniverses(root)
  if (!known.includes(id)) throw new StoreError(`No universe "${id}". Known: ${known.join(', ') || '(none)'}`)
  return new JsonFileStore(join(root, id))
}

/**
 * Create a universe from a draft. Fields the author left blank stay blank -
 * generation is a separate, explicit act, never a side effect of saving.
 */
export async function createUniverse(
  id: string,
  draft: UniverseDraft,
  root = universesRoot(),
): Promise<JsonFileStore> {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) throw new StoreError(`Invalid universe id "${id}"`)
  if ((await listUniverses(root)).includes(id)) throw new StoreError(`Universe "${id}" already exists`)
  if (!draft.name?.trim()) throw new StoreError('A universe needs a name')
  return JsonFileStore.create(join(root, id), { ...draft, id, name: draft.name })
}

/** Slugify a name into a directory-safe id: "The Ashfall Cycle" -> "the-ashfall-cycle". */
export function toUniverseId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}
