/**
 * The institutions container's field spec.
 *
 * Formal hierarchies with infrastructure and decentralised bodies alike: a
 * government, a guild, an order, a secret society. Thirty-two fields, grouped,
 * because a single column of them is a wall.
 *
 * The six Activities fields are the ones that need the roll most. Almost no
 * institution does all six - a guild trades and teaches its apprentices and has
 * no diplomacy and no army - but a model handed six activity fields writes six,
 * and every institution in the world comes back a small state. Each is rolled
 * low enough that most institutions do one or two.
 *
 * Founding Year and Dissolution Year map onto the store's own columns, so a
 * brief can say how old a body is and whether it still stands without knowing
 * this spec. Dissolution is rolled at the same rate as Disbandment: a blank
 * there is the claim that the institution is still going, and a generator
 * filling it every time quietly buries four orders in five.
 */
import type { FieldSpec } from './field-spec.ts'

export const INSTITUTION_FIELDS: FieldSpec[] = [
  {
    key: 'name',
    label: 'Name',
    kind: 'text',
    required: true,
    default: null,
    storeAs: 'name',
    group: 'Overview',
    help: 'What the institution is called, as the people who deal with it would say it.',
    examples: ['The Guild of Weighers', 'The Ash Seat', 'The Order of the Quiet Hand'],
  },
  {
    key: 'description',
    label: 'Description',
    kind: 'longtext',
    required: false,
    default: null,
    storeAs: 'summary',
    group: 'Overview',
    help:
      'The opening paragraph: what it is, who it is made of, and what it does. Two to four ' +
      'sentences. Every other article shows this when the institution is mentioned in passing, so ' +
      'it has to stand alone.',
  },
  {
    key: 'foundingYear',
    label: 'Founding Year',
    kind: 'text',
    required: false,
    default: null,
    storeAs: 'beginDate',
    group: 'Overview',
    help:
      'When it was founded, in this universe’s calendar. Free text, but a year has to be somewhere ' +
      'in it. Where it grew rather than being founded, say so and give the year it is first heard of.',
    examples: ['412', 'Year 198', 'no charter survives; first named in 604'],
  },
  {
    key: 'dissolutionYear',
    label: 'Dissolution Year',
    kind: 'text',
    required: false,
    default: null,
    fillRate: 0.2,
    storeAs: 'endDate',
    group: 'Overview',
    help:
      'When it ended, if it has. Blank covers both an institution that still stands and one whose ' +
      'end nobody recorded. Where it is known to be gone but the year is not, say that here rather ' +
      'than leaving it empty - an empty field is what lets a dissolved order turn up intact later.',
    examples: ['812', 'Year 1104', 'unknown', 'suppressed some time in the long winter'],
  },
  {
    key: 'aliases',
    label: 'Aliases',
    kind: 'list',
    required: false,
    default: [],
    fillRate: 0.5,
    storeAs: 'aliases',
    group: 'Overview',
    help:
      'Every other name it goes by: an older name, a shortening, what its enemies call it. These are ' +
      'stored as the item’s aliases, so a mention of any of them links to this article and a stub is ' +
      'never raised for a name it already has.',
  },
  {
    key: 'members',
    label: 'Estimated Population/Members',
    kind: 'text',
    required: false,
    default: null,
    fillRate: 0.6,
    group: 'Overview',
    help:
      'How many belong to it, and when that was counted if the number moved. Free text, so a body ' +
      'that keeps no roll can say so.',
    examples: ['about 400 sworn', 'a few dozen, and nobody agrees which', 'nine, by its own rule'],
  },
  {
    key: 'predecessors',
    label: 'Predecessor Institutions',
    kind: 'list',
    required: false,
    default: [],
    fillRate: 0.25,
    group: 'Lineage',
    help:
      'What it grew out of, replaced, or was refounded from. Name each as its article is titled and ' +
      'the reference will link itself.',
  },
  {
    key: 'successors',
    label: 'Successor Institutions',
    kind: 'list',
    required: false,
    default: [],
    fillRate: 0.2,
    group: 'Lineage',
    help: 'What took its place, or split off from it and outlived it.',
  },
  {
    key: 'parentInstitution',
    label: 'Parent Institution',
    kind: 'text',
    required: false,
    default: null,
    fillRate: 0.3,
    group: 'Lineage',
    help:
      'The body this one answers to or sits inside: a chapter under an order, a bureau under a ' +
      'ministry. Most institutions answer to nobody, and blank says so.',
  },
  {
    key: 'founders',
    label: 'Founders',
    kind: 'list',
    required: false,
    default: [],
    fillRate: 0.45,
    group: 'Lineage',
    help:
      'Who established it - people, families, other institutions. Name each as its own article is ' +
      'titled. Many old bodies have no founder anyone can name.',
  },
  {
    key: 'structure',
    label: 'Structure',
    kind: 'longtext',
    required: false,
    default: null,
    group: 'Inside',
    help:
      'How it is arranged: ranks, offices, chapters, who reports to whom, and how someone rises. ' +
      'Where the chart and the real power differ, say how.',
  },
  {
    key: 'culture',
    label: 'Culture',
    kind: 'longtext',
    required: false,
    default: null,
    group: 'Inside',
    help:
      'What it is like to be inside it: how members speak to one another, what is worn, what is ' +
      'celebrated, what gets someone quietly frozen out.',
  },
  {
    key: 'publicAgenda',
    label: 'Public Agenda',
    kind: 'longtext',
    required: false,
    default: null,
    group: 'Inside',
    help:
      'What it says it is for, in its own words - and, where they differ, what it is actually for. ' +
      'The gap between the two is usually the article.',
  },
  {
    key: 'assets',
    label: 'Assets',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.5,
    group: 'Inside',
    help:
      'What it owns and what it lives on: halls, ships, land, relics, endowments, dues, debts. Where ' +
      'the money comes from tells a reader more than what it is worth.',
  },
  {
    key: 'history',
    label: 'History',
    kind: 'longtext',
    required: false,
    default: null,
    group: 'History',
    help:
      'What has happened to it, in order: schisms, scandals, wars, reforms, the year it changed ' +
      'hands. Events large enough to stand alone belong in their own History articles.',
  },
  {
    key: 'disbandment',
    label: 'Disbandment',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.2,
    group: 'History',
    help:
      'How it ended, if it did: who ended it, what became of its members and its property, and ' +
      'whether anything of it survives. Only for an institution that is actually gone.',
  },
  {
    key: 'controlledLocations',
    label: 'Owned/Controlled Locations',
    kind: 'list',
    required: false,
    default: [],
    fillRate: 0.5,
    group: 'Reach',
    help:
      'Places it holds outright or rules in practice: a hall, a quarter, a fortress, a whole ' +
      'province. Name each as its article is titled.',
  },
  {
    key: 'associatedLocations',
    label: 'Associated Locations',
    kind: 'list',
    required: false,
    default: [],
    fillRate: 0.6,
    group: 'Reach',
    help: 'Places it works in, meets in, or is bound up with without owning.',
  },
  {
    key: 'associatedEthnicities',
    label: 'Associated Ethnicities',
    kind: 'list',
    required: false,
    default: [],
    fillRate: 0.5,
    group: 'Reach',
    help:
      'The peoples it draws from, serves, excludes or is identified with. Where an association is ' +
      'resented or disputed, that belongs in the prose above.',
  },
  {
    key: 'militaryActivities',
    label: 'Military Activities',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.3,
    group: 'Activities',
    help:
      'What it does with force: soldiers, guards, ships, levies, who it has fought. Most ' +
      'institutions have no army and no wish for one.',
  },
  {
    key: 'technologicalActivities',
    label: 'Technological Activities',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.25,
    group: 'Activities',
    help:
      'What it builds, invents, maintains or keeps to itself: works, machines, techniques, secrets ' +
      'of a craft.',
  },
  {
    key: 'religiousActivities',
    label: 'Religious Activities',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.3,
    group: 'Activities',
    help: 'Rites it keeps, faiths it serves or funds, and what it demands of members in that line.',
  },
  {
    key: 'diplomaticActivities',
    label: 'Diplomatic Activities',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.35,
    group: 'Activities',
    help:
      'Who it treats with, on whose behalf, and what it has signed. Rivalries and standing quarrels ' +
      'count as diplomacy.',
  },
  {
    key: 'commercialActivities',
    label: 'Commercial Activities',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.45,
    group: 'Activities',
    help: 'What it buys, sells, ships, lends or monopolises, and who depends on it doing so.',
  },
  {
    key: 'educationalActivities',
    label: 'Educational Activities',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.35,
    group: 'Activities',
    help:
      'What it teaches and to whom: apprentices, novices, scholars, its own children only. Include ' +
      'what it refuses to teach outsiders.',
  },
  {
    key: 'laws',
    label: 'Laws & Covenants',
    kind: 'longtext',
    required: false,
    default: null,
    group: 'Rule',
    help:
      'The rules it binds its members to, the oaths they swear, and what it can do to someone who ' +
      'breaks them. Where a rule is widely ignored, say so.',
  },
  {
    key: 'governance',
    label: 'Governance',
    kind: 'longtext',
    required: false,
    default: null,
    group: 'Rule',
    help:
      'How it governs itself: how leaders are chosen and unseated, how decisions are made, and how ' +
      'disputes between members are settled. Say what happens when the process fails.',
  },
  {
    key: 'legends',
    label: 'Legends & Mythology',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.4,
    group: 'Belief',
    help:
      'The stories it tells about itself, and the ones told about it by everyone else. Where a ' +
      'legend has its own article, name it as that article is titled.',
  },
  {
    key: 'origins',
    label: 'Origins',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.6,
    group: 'Belief',
    help:
      'The account of how it began - which is not the same as the founding year. Where the story it ' +
      'tells and the record disagree, give both and say which is which.',
  },
  {
    key: 'ethics',
    label: 'Ethics',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.5,
    group: 'Belief',
    help:
      'What it holds to be right and wrong, and what it will not do even when it would profit. Where ' +
      'it has broken its own code, say when.',
  },
  {
    key: 'sects',
    label: 'Sects',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.3,
    group: 'Belief',
    help:
      'Factions, chapters and splinters within it: what divides them, how openly, and whether any ' +
      'has broken away. Most institutions have none worth recording.',
  },
]
