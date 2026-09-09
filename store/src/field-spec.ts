/**
 * Field specs, shared by every container that has one.
 *
 * `universe` had the first, hand-rolled. `fauna` is the second, and seventeen
 * more are coming - so the shape lives here once and the per-container lists are
 * data. The form renders from a spec, the generator is briefed from it, and the
 * bridge validates writes against it; adding a field to a list is all three.
 */
export type FieldKind = 'text' | 'longtext' | 'list' | 'number'

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
   * Where the value is stored on an item. Most fields are free-form and live in
   * `attributes`; a few map onto columns the store already understands, so a
   * brief can show a name and a summary without knowing any container's spec.
   *
   * `beginDate` and `endDate` matter most here. Every container will have its
   * own words for when a thing started and stopped - "Existed Since", "Reign
   * Began", "Founded" - and if each stored its own attribute, the brief could
   * not tell a reader that a fallen city is no longer standing. One column,
   * many labels.
   */
  storeAs?: 'name' | 'summary' | 'kind' | 'beginDate' | 'endDate'
}

/** True when a field holds nothing a generator should preserve. */
export function isEmptyValue(v: unknown): boolean {
  if (v === null || v === undefined) return true
  if (typeof v === 'string') return v.trim() === ''
  if (Array.isArray(v)) return v.length === 0
  return false
}
