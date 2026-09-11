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
import { PEOPLE_FIELDS } from './people-fields.ts'
import { HISTORY_FIELDS } from './history-fields.ts'
import { AFFLICTION_FIELDS } from './afflictions-fields.ts'
import { COSMOLOGY_FIELDS } from './cosmology-fields.ts'
import { DOCUMENT_FIELDS } from './documents-fields.ts'
import { ETHNICITY_FIELDS } from './ethnicities-fields.ts'
import { FLORA_FIELDS } from './flora-fields.ts'
import { GEOGRAPHY_FIELDS } from './geography-fields.ts'
import { INSTITUTION_FIELDS } from './institutions-fields.ts'
import { LANGUAGE_FIELDS } from './languages-fields.ts'

/** Every container with a spec, each composed with the common fields. */
export const FIELD_SPECS: Record<string, FieldSpec[]> = {
  universe: composeSpec(UNIVERSE_FIELDS),
  fauna: composeSpec(FAUNA_FIELDS),
  locations: composeSpec(LOCATION_FIELDS),
  people: composeSpec(PEOPLE_FIELDS),
  history: composeSpec(HISTORY_FIELDS),
  afflictions: composeSpec(AFFLICTION_FIELDS),
  cosmology: composeSpec(COSMOLOGY_FIELDS),
  documents: composeSpec(DOCUMENT_FIELDS),
  ethnicities: composeSpec(ETHNICITY_FIELDS),
  flora: composeSpec(FLORA_FIELDS),
  geography: composeSpec(GEOGRAPHY_FIELDS),
  institutions: composeSpec(INSTITUTION_FIELDS),
  languages: composeSpec(LANGUAGE_FIELDS),
}

/** The spec for a container, or null when it has none yet. */
export const fieldsFor = (container: string): FieldSpec[] | null => FIELD_SPECS[container] ?? null

export const fieldIn = (container: string, key: string): FieldSpec | undefined =>
  fieldsFor(container)?.find((f) => f.key === key)

/** Containers with an article form. `universe` is the manifest, not an article. */
export const containersWithFields = () => Object.keys(FIELD_SPECS).filter((k) => k !== 'universe')
