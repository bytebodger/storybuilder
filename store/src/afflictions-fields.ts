/**
 * The afflictions container's field spec.
 *
 * The container is broad on purpose - a disease, a disorder particular to this
 * world, a curse laid on a whole people - and one spec has to serve all three.
 * So the fields are the questions every affliction has an answer to, and the
 * help text says what each one means for the kinds it barely fits: a curse has
 * no vectors, but it may well be inherited, and that is what Transmission is for.
 *
 * Every field but the name is prose. Even Prognosis: "fatal" with no course,
 * no timescale and no survivors is a worse answer than a sentence.
 *
 * Several fields separate what the world believes from what is so. A world
 * without germ theory still has a cause for its fevers, and a treatment that
 * does nothing is still the treatment everyone uses. Both are canon, and saying
 * which is which is what makes the article worth reading.
 */
import type { FieldSpec } from './field-spec.ts'

export const AFFLICTION_FIELDS: FieldSpec[] = [
  {
    key: 'name',
    label: 'Name',
    kind: 'text',
    required: true,
    default: null,
    storeAs: 'name',
    help:
      'What it is called by the people who suffer it. A common name, not a physician’s one, unless ' +
      'this world’s physicians are who named it.',
    examples: ['Marsh Fever', 'The Hollowing', 'Saltlung'],
  },
  {
    key: 'description',
    label: 'Description',
    kind: 'longtext',
    required: false,
    default: null,
    storeAs: 'summary',
    help:
      'The opening paragraph: what the affliction is, whom it strikes, and why it is feared or ' +
      'dismissed. Two to four sentences. Every other article shows this when the affliction is ' +
      'mentioned in passing, so it has to stand alone.',
  },
  {
    key: 'transmission',
    label: 'Transmission/Vectors',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.55,
    help:
      'How it passes from one sufferer to the next: touch, breath, water, a bite, a parent. A curse ' +
      'that is inherited belongs here too. Something that arises on its own does not spread, and ' +
      'saying how it spreads would make it a different affliction.',
  },
  {
    key: 'cause',
    label: 'Cause',
    kind: 'longtext',
    required: false,
    default: null,
    help:
      'What brings it on. Where what people believe differs from what is true, give both and say ' +
      'which is which - a world without germ theory still has a cause for its fevers.',
  },
  {
    key: 'symptoms',
    label: 'Symptoms',
    kind: 'longtext',
    required: false,
    default: null,
    help:
      'What it does, in the order it does it: the first sign, the course, and what it looks like at ' +
      'its worst. Concrete detail beats adjectives - what an onlooker would actually notice.',
  },
  {
    key: 'treatment',
    label: 'Treatment',
    kind: 'longtext',
    required: false,
    default: null,
    help:
      'What is done for it, by whom, and whether it works. A remedy that does nothing is still the ' +
      'remedy everyone uses; say so. "Nothing is known to help" is an answer.',
  },
  {
    key: 'prognosis',
    label: 'Prognosis',
    kind: 'longtext',
    required: false,
    default: null,
    help:
      'How it tends to end, and how long that takes. Who survives, what they are left with, and ' +
      'whether it can come back.',
  },
  {
    key: 'affectedGroups',
    label: 'Affected Groups',
    kind: 'longtext',
    required: false,
    default: null,
    help:
      'Whom it strikes and whom it spares - by age, trade, people, place or station - and why, if ' +
      'anyone knows. Name peoples and orders as their articles are titled and the references will ' +
      'link themselves.',
  },
  {
    key: 'hostsAndCarriers',
    label: 'Hosts and Carriers',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.35,
    help:
      'Creatures, plants or people that harbour it without suffering it, and pass it on. Most ' +
      'afflictions have none worth naming.',
  },
  {
    key: 'prevention',
    label: 'Prevention',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.5,
    help:
      'What people do to avoid it - the sensible, the superstitious and the enforced - and which of ' +
      'those actually help.',
  },
  {
    key: 'epidemiology',
    label: 'Epidemiology',
    kind: 'longtext',
    required: false,
    default: null,
    help:
      'Where it occurs and how widely: always present at a low level, returning in seasons, or ' +
      'breaking out rarely and badly. Where it is never found is as useful as where it is.',
  },
  {
    key: 'history',
    label: 'History',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.6,
    help:
      'When it was first recorded, its worst outbreaks, and how understanding of it has changed. ' +
      'Name recorded events as their articles are titled.',
  },
  {
    key: 'culturalImpact',
    label: 'Cultural Impact',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.5,
    help:
      'What it has done to the people who live with it: stigma, customs, laws, sayings, what sufferers ' +
      'are called. Attitudes are rarely shared - say which groups hold them.',
  },
]
