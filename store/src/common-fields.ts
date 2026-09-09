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
   * The key this field follows. Position is part of the definition: a
   * pronunciation belongs beside the name, not appended after the history.
   * If the anchor is absent from a spec, the field goes to the end.
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

    const at = composed.findIndex((f) => f.key === after)
    if (at === -1) composed.push(field)
    else composed.splice(at + 1, 0, field)
  }
  return composed
}
