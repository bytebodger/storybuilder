/**
 * Fields every container gets, without each spec repeating them.
 *
 * Some things are true of anything with a name, the universe itself included:
 * the name may need saying aloud. Copying such a field into twenty specs means
 * twenty chances for its wording, its kind, or its help text to drift - and a
 * field that means slightly different things in different containers is exactly
 * the drift this tool exists to prevent.
 *
 * A container may still declare the field itself, and its version wins. Common
 * by default, overridable where a container genuinely needs its own.
 */
import type { FieldSpec } from './field-spec.ts'

export interface CommonField {
  field: FieldSpec
  /**
   * What this field follows. Position is part of the definition: a pronunciation
   * belongs beside the name, not appended after the history.
   *
   * Matched against a field's `storeAs` first and its `key` second, and the
   * *last* match wins - so `'name'` means "after the name" whatever the name
   * field is called, and lands after the final part of a name that arrives in
   * pieces. If nothing matches, the field goes to the end.
   */
  after: string
}

export const COMMON_FIELDS: CommonField[] = [
  {
    after: 'name',
    field: {
      key: 'pronunciation',
      label: 'Pronunciation',
      kind: 'text',
      required: false,
      default: null,
      help:
        'A plain respelling, not a phonetic alphabet - the point is that a reader can say it aloud. ' +
        'Stressed syllable in capitals. Leave blank when the name says itself.',
      examples: ['BOTT-uhn-fligh', 'thor-IN-flee', 'KELL-ish', 'ex-OR-ee-uh'],
    },
  },
]

/**
 * A container's spec with the common fields folded in.
 *
 * Applied once, where specs are registered, so every consumer - the form, the
 * generator, the validator, the article view - sees the same list. There is no
 * way to read a spec that has not been composed.
 */
export function composeSpec(fields: FieldSpec[]): FieldSpec[] {
  const composed = [...fields]

  for (const { field, after } of COMMON_FIELDS) {
    if (composed.some((f) => f.key === field.key)) continue

    let at = -1
    for (let i = 0; i < composed.length; i++) {
      if (composed[i].storeAs === after || composed[i].key === after) at = i
    }
    if (at === -1) {
      composed.push(field)
      continue
    }
    // The field joins the section of whatever it was placed beside, so a spec
    // that groups its form does not end up with one stray ungrouped row.
    composed.splice(at + 1, 0, { ...field, group: composed[at].group })
  }
  return composed
}
