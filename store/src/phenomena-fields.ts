/**
 * The phenomena container's field spec.
 *
 * What happens, where `cosmology` holds the bodies it may happen to and
 * `geography` the ground it happens on. A comet is cosmology; the night its
 * passage turned the harbour green is a phenomenon.
 *
 * Frequency is the field that does the most work and is never rolled away. A
 * phenomenon without one is a rumour: "every seventeenth summer" is a fact a
 * character can plan around, dread, or be caught out by, and "occasionally" is
 * not. Source is its pair, and asks for the split this container turns on -
 * what people say causes it, and what actually does, which are rarely the same
 * and are both canon.
 */
import type { FieldSpec } from './field-spec.ts'

export const PHENOMENA_FIELDS: FieldSpec[] = [
  {
    key: 'name',
    label: 'Name',
    kind: 'text',
    required: true,
    default: null,
    storeAs: 'name',
    help: 'What it is called by the people who witness it, which is rarely a technical name.',
    examples: ['The Green Tide', 'The Seventeen-Year Quiet', 'The Answering Sky'],
  },
  {
    key: 'description',
    label: 'Description',
    kind: 'longtext',
    required: false,
    default: null,
    storeAs: 'summary',
    help:
      'The opening paragraph: what happens, where, and what people make of it. Two to four ' +
      'sentences. Every other article shows this when the phenomenon is mentioned in passing, so it ' +
      'has to stand alone.',
  },
  {
    key: 'firstObserved',
    label: 'First Observed',
    kind: 'text',
    required: false,
    default: null,
    fillRate: 0.5,
    storeAs: 'beginDate',
    help:
      'When it was first recorded, in this universe’s calendar. Plenty of phenomena have always been ' +
      'there as far as anyone knows, and blank says so - as does saying that the first record is ' +
      'simply the oldest one that survives.',
    examples: ['412', 'Year 88', 'first written of in 604; older in the telling'],
  },
  {
    key: 'frequency',
    label: 'Frequency',
    kind: 'text',
    required: false,
    default: null,
    help:
      'How often it happens, as precisely as this world can say: once and never again, every ' +
      'seventeenth summer, each full moon, twice in living memory. A number someone could plan ' +
      'around is worth more than "occasionally".',
    examples: ['once, in 604', 'every seventeenth summer', 'at every low spring tide', 'four times recorded'],
  },
  {
    key: 'source',
    label: 'Source',
    kind: 'longtext',
    required: false,
    default: null,
    help:
      'What causes it - and, separately, what people believe causes it. Nature, a work of hands, ' +
      'something older nobody understands. Where the truth is not established, say that plainly ' +
      'rather than settling it: an unexplained thing that stays unexplained is canon too.',
  },
  {
    key: 'manifestation',
    label: 'Manifestation / Visualization',
    kind: 'longtext',
    required: false,
    default: null,
    help:
      'What a witness actually sees, hears, smells and feels, from the first sign to the last. How ' +
      'long it lasts, and what is left behind afterwards.',
  },
  {
    key: 'associatedLocations',
    label: 'Associated Location(s)',
    kind: 'list',
    required: false,
    default: [],
    help:
      'Where it happens, and anywhere it has been seen from. Name each as its article is titled and ' +
      'the reference will link itself.',
  },
  {
    key: 'associatedLegends',
    label: 'Associated Legend(s)',
    kind: 'list',
    required: false,
    default: [],
    fillRate: 0.5,
    help: 'The stories told to explain it, or that grew up around it, where they have articles.',
  },
  {
    key: 'history',
    label: 'History',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.5,
    help:
      'The occurrences worth remembering, in order: when it was worst, when it failed to come, what ' +
      'was happening the year it did. Name recorded events as their articles are titled.',
  },
  {
    key: 'societalImpact',
    label: 'Societal Impact',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.6,
    help:
      'What people do about it: when they sail, when they marry, what they stop doing that week, who ' +
      'profits from predicting it. A phenomenon nobody has arranged their life around is a smaller ' +
      'thing than one they have.',
  },
]
