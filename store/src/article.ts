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

  for (const field of spec) {
    const value = coerce(field, values[field.key])
    if (field.required && value === null) {
      throw new StoreError(`${field.label} is required`)
    }
    if (value === null) continue

    if (field.storeAs === 'name') item.name = String(value)
    else if (field.storeAs === 'summary') item.summary = String(value)
    else if (field.storeAs === 'kind') item.kind = String(value)
    else if (field.storeAs === 'beginDate') item.beginDate = String(value)
    else if (field.storeAs === 'endDate') item.endDate = String(value)
    else attributes[field.key] = value
  }

  if (Object.keys(attributes).length) item.attributes = attributes
  return item
}

/** The inverse: fill a form from a stored item. */
export function itemToDraft(container: string, item: Item): ArticleValues {
  const spec = fieldsFor(container) ?? []
  const values: ArticleValues = {}

  for (const field of spec) {
    if (field.storeAs === 'name') values[field.key] = item.name
    else if (field.storeAs === 'summary') values[field.key] = item.summary ?? null
    else if (field.storeAs === 'kind') values[field.key] = item.kind ?? null
    else if (field.storeAs === 'beginDate') values[field.key] = item.beginDate ?? null
    else if (field.storeAs === 'endDate') values[field.key] = item.endDate ?? null
    else values[field.key] = item.attributes?.[field.key] ?? null
  }
  return values
}

/** The patch form of `draftToItem`, for updating an item that already exists. */
export function draftToPatch(container: string, values: ArticleValues) {
  const draft = draftToItem(container, values)
  return {
    name: draft.name,
    summary: draft.summary,
    kind: draft.kind,
    beginDate: draft.beginDate,
    endDate: draft.endDate,
    attributes: draft.attributes,
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
