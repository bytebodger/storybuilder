/**
 * Which containers have a field spec, and what it is.
 *
 * A container with no entry here is not broken - it simply has no article form
 * yet, and its items are the plain name, summary and tags every container
 * supports. Specs get added one container at a time.
 */
import type { FieldSpec } from './field-spec.ts'
import { composeSpec } from './common-fields.ts'
import { UNIVERSE_FIELDS } from './universe-fields.ts'
import { FAUNA_FIELDS } from './fauna-fields.ts'
import { LOCATION_FIELDS } from './locations-fields.ts'

/**
 * Article containers, each composed with the common fields.
 *
 * The universe manifest is deliberately not here. It describes the world rather
 * than a thing inside it, and the fields common to articles are not common to
 * it - the same reason a stub can never be a universe.
 */
export const FIELD_SPECS: Record<string, FieldSpec[]> = {
  universe: UNIVERSE_FIELDS,
  fauna: composeSpec(FAUNA_FIELDS),
  locations: composeSpec(LOCATION_FIELDS),
}

/** The spec for a container, or null when it has none yet. */
export const fieldsFor = (container: string): FieldSpec[] | null => FIELD_SPECS[container] ?? null

export const fieldIn = (container: string, key: string): FieldSpec | undefined =>
  fieldsFor(container)?.find((f) => f.key === key)

/** Containers with an article form. `universe` is the manifest, not an article. */
export const containersWithFields = () => Object.keys(FIELD_SPECS).filter((k) => k !== 'universe')
