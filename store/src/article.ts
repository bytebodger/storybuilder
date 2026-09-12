/**
 * Translating between a container's form and an item in the store.
 *
 * Most fields are free-form prose and live in `attributes`. A few map onto
 * columns the store already understands - `name`, `summary`, `kind` - declared
 * per field as `storeAs`. That mapping is what lets a brief show a creature's
 * name and opening paragraph without knowing anything about the fauna spec, and
 * lets a container add fields without teaching the store about them.
 */
import { fieldsFor, isEmptyValue, type FieldSpec, type Item, type NewItem } from './index.ts'
import { StoreError } from './types.ts'

export type ArticleValues = Record<string, unknown>

function coerce(field: FieldSpec, value: unknown): unknown {
  if (isEmptyValue(value)) return null
  switch (field.kind) {
    case 'list':
      return Array.isArray(value)
        ? value.map((v) => String(v).trim()).filter(Boolean)
        : String(value).split(',').map((v) => v.trim()).filter(Boolean)
    case 'number': {
      const n = typeof value === 'number' ? value : Number(String(value).replace(/[^0-9.-]/g, ''))
      return Number.isFinite(n) ? n : null
    }
    case 'boolean': {
      // A form sends a boolean; a hand-edited file and a generator send words.
      if (typeof value === 'boolean') return value
      const word = String(value).trim().toLowerCase()
      if (/^(y|yes|true|on|1)$/.test(word)) return true
      if (/^(n|no|false|off|0)$/.test(word)) return false
      return null
    }
    default:
      return Array.isArray(value) ? value.join(', ') : String(value).trim() || null
  }
}

/**
 * Build an item from form values, dropping anything the container's spec does
 * not declare. A form cannot smuggle a field into the store by inventing a key.
 */
export function draftToItem(container: string, values: ArticleValues): NewItem {
  const spec = fieldsFor(container)
  if (!spec) throw new StoreError(`No field spec for container "${container}"`)

  const item: NewItem = { container, name: '' }
  const attributes: Record<string, unknown> = {}
  const nameParts: string[] = []

  for (const field of spec) {
    const value = coerce(field, values[field.key])
    if (field.required && value === null) {
      throw new StoreError(`${field.label} is required`)
    }
    if (value === null) continue

    if (field.storeAs === 'name') {
      nameParts.push(String(value))
      // A name in parts is also kept in parts, or the form could not offer them
      // back to be edited separately. One string for everything that has to
      // find or title the article; the pieces alongside it for whoever wrote
      // them. See `composedName`.
      if (composedName(spec)) attributes[field.key] = value
    } else if (field.storeAs === 'summary') item.summary = String(value)
    // Lowercased because closure counts by exact kind: a Moon typed into a form
    // would otherwise be a set of its own, and slip past a planet whose moons
    // are closed at two.
    else if (field.storeAs === 'kind') item.kind = String(value).toLowerCase()
    else if (field.storeAs === 'beginDate') item.beginDate = String(value)
    else if (field.storeAs === 'endDate') item.endDate = String(value)
    else if (field.storeAs === 'aliases') item.aliases = asList(value)
    else if (field.storeAs === 'demonyms') item.demonyms = asList(value)
    else if (field.storeAs === 'timeline') item.timeline = String(value)
    else attributes[field.key] = value
  }

  item.name = nameParts.join(' ')
  if (Object.keys(attributes).length) item.attributes = attributes
  return item
}

/**
 * True when this container builds its item name out of several fields.
 *
 * Most containers have one Name field and the item's name is what was typed in
 * it. A person's arrives as given, middle, family, suffix - four answers to
 * four questions, one name at the end of them.
 */
const composedName = (spec: FieldSpec[]) => spec.filter((f) => f.storeAs === 'name').length > 1

const asList = (value: unknown): string[] =>
  Array.isArray(value) ? value.map(String) : [String(value)]

/** The inverse: fill a form from a stored item. */
export function itemToDraft(container: string, item: Item): ArticleValues {
  const spec = fieldsFor(container) ?? []
  const values: ArticleValues = {}

  for (const field of spec) {
    // A composed name is read back from the parts it was written from; the
    // joined string on the item is the output of that, not the source of it.
    if (field.storeAs === 'name') {
      values[field.key] = composedName(spec) ? (item.attributes?.[field.key] ?? null) : item.name
    } else if (field.storeAs === 'aliases') values[field.key] = item.aliases ?? []
    else if (field.storeAs === 'demonyms') values[field.key] = item.demonyms ?? []
    else if (field.storeAs === 'timeline') values[field.key] = item.timeline ?? null
    else if (field.storeAs === 'summary') values[field.key] = item.summary ?? null
    else if (field.storeAs === 'kind') values[field.key] = item.kind ?? null
    else if (field.storeAs === 'beginDate') values[field.key] = item.beginDate ?? null
    else if (field.storeAs === 'endDate') values[field.key] = item.endDate ?? null
    else values[field.key] = item.attributes?.[field.key] ?? null
  }
  return values
}

/**
 * The patch form of `draftToItem`, for updating an item that already exists.
 *
 * `existing` matters more than it looks. An item can carry attributes its
 * container's spec knows nothing about - a map frame, an imported population,
 * a coastline - and a form that only knows the spec would otherwise erase every
 * one of them on save. Anything the spec does not declare is carried through
 * untouched.
 */
export function draftToPatch(container: string, values: ArticleValues, existing?: Item) {
  const draft = draftToItem(container, values)
  const declared = new Set((fieldsFor(container) ?? []).map((f) => f.key))

  const kept = Object.fromEntries(
    Object.entries(existing?.attributes ?? {}).filter(([key]) => !declared.has(key)),
  )
  const attributes = { ...kept, ...(draft.attributes ?? {}) }

  return {
    name: draft.name,
    summary: draft.summary,
    kind: draft.kind,
    beginDate: draft.beginDate,
    endDate: draft.endDate,
    aliases: draft.aliases,
    demonyms: draft.demonyms,
    timeline: draft.timeline,
    attributes: Object.keys(attributes).length ? attributes : undefined,
  }
}

/**
 * The values a blank form starts with.
 *
 * Only for a new article: applying defaults to an edit would resurrect a value
 * the author had deliberately cleared.
 */
export function defaultValues(container: string): ArticleValues {
  const values: ArticleValues = {}
  for (const field of fieldsFor(container) ?? []) {
    if (field.default !== null && field.default !== undefined) values[field.key] = field.default
  }
  return values
}
