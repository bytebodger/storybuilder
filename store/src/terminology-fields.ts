/**
 * The terminology container's field spec.
 *
 * A word, and what it means here. Nine fields, and six of them are the company
 * the word keeps: who says it, where, in what language, to what god.
 *
 * There is no Description. **Meaning** is the item's summary, because for a
 * term those are the same thing - what a brief should show when the word turns
 * up in another article is what the word means, and a separate paragraph about
 * the word would say it twice.
 *
 * The associations are rolled low. Most terms belong to one corner of a world:
 * a word used by dockhands in one port has no theology, no institution and no
 * famous speaker, and a generator handed six association fields fills all six
 * and quietly makes every piece of slang a matter of state.
 */
import type { FieldSpec } from './field-spec.ts'

export const TERMINOLOGY_FIELDS: FieldSpec[] = [
  {
    key: 'name',
    label: 'Name',
    kind: 'text',
    required: true,
    default: null,
    storeAs: 'name',
    help:
      'The term itself, spelled as the people who use it would write it. Where it is only ever ' +
      'spoken, spell it as a listener would.',
    examples: ['muddwood', 'the Low Watch', 'casterway'],
  },
  {
    key: 'meaning',
    label: 'Meaning',
    kind: 'longtext',
    required: false,
    default: null,
    storeAs: 'summary',
    help:
      'What the word means, and what it implies about whoever uses it: polite or coarse, current or ' +
      'old-fashioned, neutral or an insult. Where the plain sense and the working sense differ, give ' +
      'both. This is what every other article shows when the term is mentioned, so it has to stand ' +
      'alone.',
  },
  {
    key: 'associatedLocations',
    label: 'Associated Locations',
    kind: 'list',
    required: false,
    default: [],
    fillRate: 0.5,
    help:
      'Where it is said, and where saying it would mark someone as an outsider. Name each place as ' +
      'its article is titled and the reference will link itself.',
  },
  {
    key: 'associatedInstitutions',
    label: 'Associated Institutions',
    kind: 'list',
    required: false,
    default: [],
    fillRate: 0.35,
    help: 'Orders, guilds and offices that use it as a term of art, or coined it.',
  },
  {
    key: 'associatedEthnicities',
    label: 'Associated Ethnicities',
    kind: 'list',
    required: false,
    default: [],
    fillRate: 0.5,
    help:
      'The peoples who use it, and the peoples it is used about - which are often not the same, and ' +
      'is usually where the offence lives.',
  },
  {
    key: 'associatedLanguages',
    label: 'Associated Languages',
    kind: 'list',
    required: false,
    default: [],
    fillRate: 0.5,
    help: 'The languages it belongs to or was borrowed from.',
  },
  {
    key: 'associatedPeople',
    label: 'Associated People',
    kind: 'list',
    required: false,
    default: [],
    fillRate: 0.3,
    help:
      'Anyone the word is named for, coined by, or inseparable from. Most words have nobody behind ' +
      'them.',
  },
  {
    key: 'associatedTheology',
    label: 'Associated Theology',
    kind: 'list',
    required: false,
    default: [],
    fillRate: 0.3,
    help: 'Faiths, deities and doctrines the term belongs to, or that made it unsayable.',
  },
]
