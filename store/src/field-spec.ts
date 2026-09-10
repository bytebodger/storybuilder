/**
 * Field specs, shared by every container that has one.
 *
 * `universe` had the first, hand-rolled. `fauna` is the second, and seventeen
 * more are coming - so the shape lives here once and the per-container lists are
 * data. The form renders from a spec, the generator is briefed from it, and the
 * bridge validates writes against it; adding a field to a list is all three.
 */
/**
 * How a field is entered and read.
 *
 * `timeline` is the one that is not a shape of text: its value is the id of one
 * of this universe's timelines, chosen from them, because a timeline that does
 * not exist is not a typo to be caught later but an event filed nowhere.
 */
export type FieldKind = 'text' | 'longtext' | 'list' | 'number' | 'timeline'

export interface FieldSpec {
  key: string
  label: string
  kind: FieldKind
  required: boolean
  default: string | number | string[] | null
  /** What the field is for. Shown under the input, and given to the generator verbatim. */
  help: string
  /** Short examples. Calibration for the generator; never presented as the only options. */
  examples?: string[]
  /**
   * The section of the form this field belongs to.
   *
   * Cosmetic, and only worth setting on a long spec. A person has fifty-odd
   * fields and a single column of them is a wall; grouped, it is a handful of
   * named sections a writer can skip past. Fields keep spec order within a
   * group, and groups appear in the order their first field does.
   */
  group?: string
  /**
   * Where the value is stored on an item. Most fields are free-form and live in
   * `attributes`; a few map onto columns the store already understands, so a
   * brief can show a name and a summary without knowing any container's spec.
   *
   * `beginDate` and `endDate` matter most here. Every container will have its
   * own words for when a thing started and stopped - "Existed Since", "Reign
   * Began", "Founded" - and if each stored its own attribute, the brief could
   * not tell a reader that a fallen city is no longer standing. One column,
   * many labels.
   *
   * `name` may be declared on more than one field, and then the item's name is
   * those fields joined in spec order. A person is the reason: a name that
   * arrives in parts has to be stored in parts to be edited in parts, and has
   * to be one string to be the title of an article and to be found by anything
   * looking for it.
   */
  storeAs?: 'name' | 'summary' | 'kind' | 'beginDate' | 'endDate' | 'aliases' | 'timeline'
}

/** True when a field holds nothing a generator should preserve. */
export function isEmptyValue(v: unknown): boolean {
  if (v === null || v === undefined) return true
  if (typeof v === 'string') return v.trim() === ''
  if (Array.isArray(v)) return v.length === 0
  return false
}
