/**
 * The geography container's field spec.
 *
 * The physical features themselves - a range, a river, a bay, a waterfall -
 * where `locations` holds the inhabited and bounded places that sit among them.
 * The Geography field on a location describes the terrain it sits in; this
 * describes the terrain.
 *
 * Two parents, because a feature has two kinds of container and they are not
 * the same question. A waterfall sits inside a mountain range (geography) and
 * inside a country (location), and either may be the useful one to know.
 *
 * Most of the second half is rolled. Every feature has a shape; few have
 * pilgrims, fewer still have a flood that takes a village every spring. Handed
 * those fields, a generator gives them to everything, and a world of ordinary
 * hills becomes a world of portents.
 */
import type { FieldSpec } from './field-spec.ts'
import { demonymsField } from './common-fields.ts'

export const GEOGRAPHY_FIELDS: FieldSpec[] = [
  {
    key: 'name',
    label: 'Name',
    kind: 'text',
    required: true,
    default: null,
    storeAs: 'name',
    help: 'What the feature is called by the people who live near it or cross it.',
    examples: ['The Sunder', 'The Greyfell Range', 'The Weeping Stair'],
  },
  demonymsField({ fillRate: 0.35 }),
  {
    key: 'description',
    label: 'Description',
    kind: 'longtext',
    required: false,
    default: null,
    storeAs: 'summary',
    help:
      'The opening paragraph: what the feature is, where it lies, and why it matters to the people ' +
      'who live with it. Two to four sentences. Every other article shows this when the feature is ' +
      'mentioned in passing, so it has to stand alone.',
  },
  {
    key: 'parentGeography',
    label: 'Parent Geography',
    kind: 'text',
    required: false,
    default: null,
    help:
      'The larger feature this one sits inside: a waterfall in a mountain range, a bay in an ocean, ' +
      'a tributary in a river. Name it as its own article is titled and the reference will link ' +
      'itself.',
  },
  {
    key: 'parentLocation',
    label: 'Parent Location',
    kind: 'text',
    required: false,
    default: null,
    help:
      'The place this feature lies within: a country, a region, a continent. A feature that crosses ' +
      'several of them belongs under a broader one - a river through four countries sits under the ' +
      'continent, or the planet, rather than under any one country.',
  },
  {
    key: 'geography',
    label: 'Geography',
    kind: 'longtext',
    required: false,
    default: null,
    help:
      'The shape of the thing itself: how far it runs, how high or deep it goes, what it is made of, ' +
      'and what it borders. What has to be crossed to reach it counts too.',
  },
  {
    key: 'localizedPhenomena',
    label: 'Localized Phenomena',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.5,
    help:
      'What it does to what is around it: floods, rockfalls, a fog that closes a pass, a tide that ' +
      'strands a harbour. Say how often, and who bears it. Where people believe it does something ' +
      'it does not, give both and say which is which.',
  },
  {
    key: 'climate',
    label: 'Climate',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.5,
    help:
      'The weather within it, and what it does to the weather around it - a rain shadow, a wind ' +
      'funnelled down a valley, a sea that keeps a coast from freezing.',
  },
  {
    key: 'floraAndFauna',
    label: 'Flora & Fauna',
    kind: 'longtext',
    required: false,
    default: null,
    help:
      'What grows and lives here, and its standing: hunted, farmed, feared, protected. Name the ones ' +
      'with articles of their own as those articles are titled.',
  },
  {
    key: 'naturalResources',
    label: 'Natural Resources',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.6,
    help:
      'What the feature yields, who works it, and who claims it. A resource nobody can reach yet is ' +
      'worth saying too.',
  },
  {
    key: 'history',
    label: 'History',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.5,
    help:
      'What has happened here, in order, and how the feature came to be as it is. Events large ' +
      'enough to stand alone belong in their own History articles; name them as those are titled.',
  },
  {
    key: 'tourism',
    label: 'Tourism',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.3,
    help:
      'Who travels to see it, from how far, and what they do when they arrive - pilgrims, bathers, ' +
      'hunters, sightseers - and who makes a living from them. Many worlds have no such thing, and ' +
      'blank says so.',
  },
  {
    key: 'ethnicSignificance',
    label: 'Ethnic Significance',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.5,
    help:
      'What it means to the peoples who live with it: a homeland, a border, a burial ground, the ' +
      'place they say they came from. Say which peoples - a meaning is rarely shared, and two ' +
      'peoples claiming the same feature differently is the most story-bearing thing here.',
  },
  {
    key: 'religiousSignificance',
    label: 'Religious Significance',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.4,
    help:
      'Sacred standing: whose, why, what is done there, and what is forbidden there. Name the faiths ' +
      'and orders as their articles are titled.',
  },
]
