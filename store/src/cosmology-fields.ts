/**
 * The cosmology container's field spec.
 *
 * The bodies, not what happens in the sky. A comet is cosmology; the night it
 * set the harbour alight is history, and a festival where the sky sometimes
 * answers is phenomena. Known Cycles is the one place the two touch - a return
 * is a property of the body, whatever people later made of it.
 *
 * Two fields map onto columns rather than attributes, and both matter beyond
 * the form. Type is the item's `kind`, which is what a closed set counts: a
 * world with exactly two moons is checked against everything whose type is
 * moon. Alternative Names are its `aliases`, so a sailor's name for a star in
 * some other article still links here instead of raising a stub.
 *
 * Localized Impact separates what a body does from what it is blamed for. A
 * moon that moves the tides and is said to cause madness has made two claims,
 * and only one of them is the moon's.
 */
import type { FieldSpec } from './field-spec.ts'
import { demonymsField } from './common-fields.ts'

export const COSMOLOGY_FIELDS: FieldSpec[] = [
  {
    key: 'name',
    label: 'Name',
    kind: 'text',
    required: true,
    default: null,
    storeAs: 'name',
    help:
      'What it is most widely called by the people who look up at it. The other names it goes by ' +
      'belong in Alternative Names.',
    examples: ['The Pale Sister', 'Hask', 'The Wanderer'],
  },
  demonymsField({ fillRate: 0.3 }),
  {
    key: 'description',
    label: 'Description',
    kind: 'longtext',
    required: false,
    default: null,
    storeAs: 'summary',
    help:
      'The opening paragraph: what it is, how it appears from the ground, and why it matters to the ' +
      'people below. Two to four sentences. Every other article shows this when the body is ' +
      'mentioned in passing, so it has to stand alone.',
  },
  {
    key: 'alternativeNames',
    label: 'Alternative Name(s)',
    kind: 'list',
    required: false,
    default: [],
    fillRate: 0.5,
    storeAs: 'aliases',
    help:
      'Every other name it goes by: older names, other peoples’ names, what sailors or farmers call ' +
      'it. These are stored as the item’s aliases, so a mention of any of them links to this article ' +
      'and a stub is never raised for a name it already has.',
  },
  {
    key: 'type',
    label: 'Type',
    kind: 'text',
    required: false,
    default: null,
    storeAs: 'kind',
    help:
      'What sort of body it is, in one word: star, planet, moon, comet, asteroid, constellation. A ' +
      'sun is a star. This is the item’s kind, and closed sets are counted by it - a world known to ' +
      'have exactly two moons is checked against everything whose type is moon - so use the same ' +
      'word for the same thing every time.',
    examples: ['moon', 'comet', 'asteroid', 'star', 'constellation'],
  },
  {
    key: 'distinctiveFeatures',
    label: 'Distinctive Features',
    kind: 'longtext',
    required: false,
    default: null,
    help:
      'What sets it apart to someone looking up: colour, brightness, size, shape, how it moves. For ' +
      'a constellation, the figure people see and the stars that make it. What the eye sees, unless ' +
      'this world has instruments that see more.',
  },
  {
    key: 'associatedLegends',
    label: 'Associated Legends',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.5,
    help:
      'Stories told about it, and by whom. Where a legend has an article of its own, name it as that ' +
      'article is titled and the reference will link itself. Say which are believed and which are ' +
      'told to children.',
  },
  {
    key: 'localizedImpact',
    label: 'Localized Impact',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.6,
    help:
      'What it does to the world below - tides, seasons, light by night - and what people use it ' +
      'for: navigation, calendars, the timing of harvests. Where it is blamed for something it does ' +
      'not do, give both and say which is which.',
  },
  {
    key: 'knownCycles',
    label: 'Known Cycles',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.7,
    help:
      'Its regular returns and changes, with the period: phases, a comet’s return, the season a ' +
      'constellation rises. Give the number. "Every ninety-one years" is a fact a calendar can be ' +
      'built on; "periodically" is not.',
  },
  {
    key: 'history',
    label: 'History',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.5,
    help:
      'When it was first recorded or named, passages or sightings people still speak of, and how ' +
      'understanding of it has changed. Name recorded events as their articles are titled.',
  },
]
