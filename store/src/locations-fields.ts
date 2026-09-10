/**
 * The locations container's field spec.
 *
 * `locations` is deliberately broad - a planet, a country, a city, a district, a
 * battlefield - so the fields are the ones every bounded place has an answer
 * to, and `kind` carries the distinction between them. Physical features
 * themselves belong in `geography`; the Geography field here describes the
 * terrain a place sits in, and names the features it sits among.
 */
import type { FieldSpec } from './field-spec.ts'

export const LOCATION_FIELDS: FieldSpec[] = [
  {
    key: 'name',
    label: 'Name',
    kind: 'text',
    required: true,
    default: null,
    storeAs: 'name',
    help: 'What the place is called by the people who live there or nearby.',
    examples: ['Kell', 'Dol', 'The Kellish Reach'],
  },
  {
    key: 'parentLocation',
    label: 'Parent Location',
    kind: 'text',
    required: false,
    default: null,
    help:
      'The larger place this one sits inside: a city in a country, a country on a continent. Name ' +
      'it as its own article is titled and the reference will link itself.',
  },
  {
    key: 'description',
    label: 'Description',
    kind: 'longtext',
    required: false,
    default: null,
    storeAs: 'summary',
    help:
      'The opening paragraph: what the place is and why it matters. Two to four sentences. This is ' +
      'what every other article shows when the place is mentioned in passing.',
  },
  {
    key: 'existedSince',
    label: 'Existed Since',
    kind: 'text',
    required: false,
    default: '0',
    storeAs: 'beginDate',
    help:
      'When the place came to be, in this universe’s years. Year 0 is the start of recorded ' +
      'canon, so leaving it at 0 says the place has always been there.',
    examples: ['0', '198', 'Year 412'],
  },
  {
    key: 'existedUntil',
    label: 'Existed Until',
    kind: 'text',
    required: false,
    default: null,
    storeAs: 'endDate',
    help:
      'When it ceased to be - fell, drowned, was abandoned. Blank means no end is recorded, which ' +
      'covers a place that still stands and a place whose fate nobody wrote down. Where it is known ' +
      'to be gone but the year is not, say that here rather than leaving it empty: an empty field ' +
      'is what lets a drowned city turn up intact in a later scene.',
    examples: ['812', 'Year 1104', 'unknown', 'some time in the long winter'],
  },
  {
    key: 'population',
    label: 'Population',
    kind: 'text',
    required: false,
    default: null,
    help:
      'How many live there, and when that was counted if the number moved. Free text, so a world ' +
      'that does not count can say so.',
    examples: ['about 40,000', 'perhaps 300 in winter', 'nobody has ever counted'],
  },
  {
    key: 'founders',
    label: 'Founders',
    kind: 'list',
    required: false,
    default: [],
    help:
      'Who established it - people, families, orders. Each name links to its own article where one ' +
      'exists, so name them as those articles are titled.',
  },
  {
    key: 'geography',
    label: 'Geography',
    kind: 'longtext',
    required: false,
    default: null,
    help:
      'The terrain the place sits in and the features it sits among: what borders it, what it looks ' +
      'out on, what has to be crossed to reach it. Name the rivers and ranges that have articles.',
  },
  {
    key: 'climate',
    label: 'Climate',
    kind: 'longtext',
    required: false,
    default: null,
    help: 'Seasons, weather, and what living with it costs - what it makes easy and what it forbids.',
  },
  {
    key: 'naturalResources',
    label: 'Natural Resources',
    kind: 'longtext',
    required: false,
    default: null,
    help:
      'What the land yields, who works it, and what the place must import because it has none. What ' +
      'is missing shapes a place as much as what is there.',
  },
  {
    key: 'nativeWildlife',
    label: 'Native Wildlife',
    kind: 'longtext',
    required: false,
    default: null,
    help:
      'The creatures and plants found here, and their standing: hunted, farmed, feared, protected. ' +
      'Name the ones with articles.',
  },
  {
    key: 'demographics',
    label: 'Demographics',
    kind: 'longtext',
    required: false,
    default: null,
    help:
      'Who lives here: peoples, languages, faiths, and how they sit with one another. Where groups ' +
      'have articles, name them.',
  },
  {
    key: 'history',
    label: 'History',
    kind: 'longtext',
    required: false,
    default: null,
    help:
      'What has happened here, in order. Founding, sieges, plagues, booms, the day it changed hands. ' +
      'Individual events large enough to stand alone belong in their own History articles.',
  },
]
