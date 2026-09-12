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
 *
 * `boolean` is the other: a yes or no, entered as a checkbox. It exists because
 * a question with two answers should not be a text box that accepts "sort of".
 * `false` is a value like any other - it is never read as an empty field.
 */
export type FieldKind = 'text' | 'longtext' | 'list' | 'number' | 'timeline' | 'boolean'

export interface FieldSpec {
  key: string
  label: string
  kind: FieldKind
  required: boolean
  default: string | number | string[] | boolean | null
  /**
   * Show this field only while another field holds a particular value.
   *
   * For a question that only arises because of an earlier answer: where a tale
   * sits in a longer work is meaningless until somebody says it is part of one.
   * A hidden field is not generated, is not counted as missing when it is
   * required, and keeps whatever value it already had - hiding is not clearing,
   * because a checkbox toggled twice should not cost the author their typing.
   */
  showWhen?: { field: string; equals: string | number | boolean }
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
   * Code produces this field, not a model.
   *
   * A name needs a source and a mutation, both of which are arithmetic. Asking
   * a model for one costs twenty seconds and returns one of a handful of
   * answers - regenerating a given name cycled Halvard, Elkirk, Halvard. A
   * field that declares a generator is filled here instead, instantly, and is
   * never put in a generation request.
   */
  generator?: 'given-name' | 'family-name'
  /**
   * The share of articles in which this field is filled at all, 0 to 1.
   *
   * Absent means always, which is what every spec did before this existed.
   *
   * It covers two things that come to the same operation. Some fields most
   * people do not *have* - an honorific, a suffix, a special ability. Others
   * everyone has and few articles bother to *record* - what they keep as pets,
   * what they will not talk about. Either way the question is how often the
   * field should come back non-empty, and the answer is not "always".
   *
   * It has to be rolled rather than asked. A model handed an optional field
   * fills it, every time: ask fifty people for an honorific and you get fifty
   * Captains. The only way to get a person with no title is for the field never
   * to enter the request.
   *
   * Applies to filling a whole form. An explicit Regenerate on one field is a
   * direct request and is always honoured - if you click Regenerate on
   * Honorific you want an honorific. Ignored on a required field, which by
   * definition is always filled.
   */
  fillRate?: number
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
