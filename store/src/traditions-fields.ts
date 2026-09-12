/**
 * The traditions container's field spec.
 *
 * Recurring observances: festivals, coronation rites, religious observances,
 * superstitious rituals. The last container in the catalog to get a spec.
 *
 * Frequency and Execution are the pair that make the article, and neither is
 * ever rolled away. A tradition is a thing people *do*, on an occasion that
 * comes round - "at every launching" and "the bell is rung once for each man
 * lost" are what a scene can be built on, where "an important ritual observed
 * by many" is not.
 *
 * Established On and Ended On are the item's `beginDate` and `endDate`, and
 * both are rolled low for reasons the other date fields have already taught:
 * most customs were never established, they accreted, and a blank end is the
 * claim that a rite is still kept. A generator that fills both every time
 * invents a founding decree for a superstition and then abolishes it.
 */
import type { FieldSpec } from './field-spec.ts'

export const TRADITION_FIELDS: FieldSpec[] = [
  {
    key: 'name',
    label: 'Name',
    kind: 'text',
    required: true,
    default: null,
    storeAs: 'name',
    help: 'What the observance is called by the people who keep it.',
    examples: ['The Low Watch', 'the Salt Blessing', 'First Ice'],
  },
  {
    key: 'description',
    label: 'Description',
    kind: 'longtext',
    required: false,
    default: null,
    storeAs: 'summary',
    help:
      'The opening paragraph: what is done, by whom, and what it is for. Two to four sentences. ' +
      'Every other article shows this when the tradition is mentioned in passing, so it has to stand ' +
      'alone.',
  },
  {
    key: 'establishedOn',
    label: 'Established On',
    kind: 'text',
    required: false,
    default: null,
    fillRate: 0.4,
    storeAs: 'beginDate',
    help:
      'When it began, in this universe’s calendar. Most customs were never established - they were ' +
      'done until they were a tradition - and blank says so, as does naming the year it was first ' +
      'written down or first required.',
    examples: ['412', 'Year 604, by decree', 'first recorded in 880; older in practice'],
  },
  {
    key: 'endedOn',
    label: 'Ended On',
    kind: 'text',
    required: false,
    default: null,
    fillRate: 0.2,
    storeAs: 'endDate',
    help:
      'When it was last kept, if it has stopped. Blank covers a living tradition and one whose ' +
      'ending nobody recorded. Where it is known to have died out but the year is not, say that ' +
      'here rather than leaving it empty.',
    examples: ['812', 'Year 1104', 'unknown', 'not kept since the long winter'],
  },
  {
    key: 'frequency',
    label: 'Frequency',
    kind: 'text',
    required: false,
    default: null,
    help:
      'How often it comes round, as precisely as this world can say: at midwinter, at every ' +
      'launching, once in a reign, whenever a child is born to the house. An occasion someone could ' +
      'plan around is worth more than "regularly".',
    examples: ['every midwinter', 'at each launching', 'once in a reign', 'the first frost'],
  },
  {
    key: 'associatedLocations',
    label: 'Associated Locations',
    kind: 'list',
    required: false,
    default: [],
    fillRate: 0.6,
    help:
      'Where it is kept, and where it must be kept if it is to count. Name each as its article is ' +
      'titled and the reference will link itself.',
  },
  {
    key: 'associatedInstitutions',
    label: 'Associated Institutions',
    kind: 'list',
    required: false,
    default: [],
    fillRate: 0.4,
    help: 'Orders, guilds and offices that run it, pay for it, or claim the right to.',
  },
  {
    key: 'associatedEthnicities',
    label: 'Associated Ethnicities',
    kind: 'list',
    required: false,
    default: [],
    fillRate: 0.6,
    help:
      'The peoples who keep it, and any it excludes. Where a neighbouring people keeps a version of ' +
      'it differently, that belongs in the prose.',
  },
  {
    key: 'associatedPeople',
    label: 'Associated People',
    kind: 'list',
    required: false,
    default: [],
    fillRate: 0.3,
    help:
      'Anyone the observance is for, named after, or inseparable from. Most customs have nobody ' +
      'behind them.',
  },
  {
    key: 'associatedTheology',
    label: 'Associated Theology',
    kind: 'list',
    required: false,
    default: [],
    fillRate: 0.4,
    help:
      'Faiths and deities it belongs to, or that have tried to claim or forbid it. A custom older ' +
      'than the faith that adopted it is worth saying so.',
  },
  {
    key: 'history',
    label: 'History',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.5,
    help:
      'How it has changed: what was added, what was quietly dropped, the years it was banned or ' +
      'ignored, the time it went badly wrong. Name recorded events as their articles are titled.',
  },
  {
    key: 'execution',
    label: 'Execution',
    kind: 'longtext',
    required: false,
    default: null,
    help:
      'What actually happens, in order, from the preparation to the end of it. What is said, what is ' +
      'burned, eaten, broken or given away, and how long it takes. Say what counts as doing it ' +
      'wrong - a rite with no way to fail is decoration.',
  },
  {
    key: 'components',
    label: 'Components and Tools',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.5,
    help:
      'What is needed for it: the vessel, the bell, the dye, the animal, the words written out. Who ' +
      'keeps these things between times, and what is done when one is lost.',
  },
  {
    key: 'participants',
    label: 'Participants & Key Roles',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.7,
    help:
      'Who takes part and who may not, and the parts that have to be filled: who speaks, who ' +
      'carries, who is forbidden to watch. Where a role has become an honour or a burden, say which.',
  },
]
