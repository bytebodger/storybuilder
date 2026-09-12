/**
 * The items container's field spec.
 *
 * One object, not a kind of object. A doodlebop everybody owns is a word and
 * belongs in `terminology`; the one doodlebop, or the nine Seeing Stones nobody
 * can make more of, belong here. That distinction is what the spec is shaped
 * around: an item has a history because there is only one of it to have one.
 *
 * So History and Significance are never rolled away. Who held it, what it did
 * to them and why anyone cares is the entire reason a single object earns an
 * article - a sword with dimensions and no story is a line in an inventory.
 *
 * Created On and Destroyed On are the item's `beginDate` and `endDate`. A blank
 * Destroyed On is the claim that the thing still exists somewhere, which is why
 * it is rolled as low as a city's Existed Until: a generator that fills it
 * every time destroys four relics in five, and an empty field is what lets a
 * lost crown turn up in a later scene.
 */
import type { FieldSpec } from './field-spec.ts'

export const ITEM_FIELDS: FieldSpec[] = [
  {
    key: 'name',
    label: 'Name',
    kind: 'text',
    required: true,
    default: null,
    storeAs: 'name',
    help:
      'What the object is called. Where it has a formal name and a common one, use the name people ' +
      'would say and give the other in the description.',
    examples: ['The Ash Seat', 'the Weighers’ Beam', 'Verrin’s Eye'],
  },
  {
    key: 'description',
    label: 'Description',
    kind: 'longtext',
    required: false,
    default: null,
    storeAs: 'summary',
    help:
      'The opening paragraph: what it is, what it looks like, and why anyone would cross a room for ' +
      'it. Two to four sentences. Every other article shows this when the object is mentioned in ' +
      'passing, so it has to stand alone.',
  },
  {
    key: 'createdOn',
    label: 'Created On',
    kind: 'text',
    required: false,
    default: null,
    fillRate: 0.5,
    storeAs: 'beginDate',
    help:
      'When it was made, in this universe’s calendar. Half the objects worth an article are older ' +
      'than the records that mention them, and blank says so - as does naming the year it is first ' +
      'heard of rather than inventing a date of manufacture.',
    examples: ['412', 'Year 604', 'older than the harbour; first written of in 880'],
  },
  {
    key: 'destroyedOn',
    label: 'Destroyed On',
    kind: 'text',
    required: false,
    default: null,
    fillRate: 0.2,
    storeAs: 'endDate',
    help:
      'When it was destroyed, if it was. Blank covers an object that still exists and one whose fate ' +
      'nobody recorded. Where it is known to be gone but the year is not, say that here rather than ' +
      'leaving it empty - and "lost" is not "destroyed", so a thing merely missing belongs in ' +
      'History.',
    examples: ['812', 'Year 1104', 'broken up some time in the long winter'],
  },
  {
    key: 'associatedLocations',
    label: 'Associated Locations',
    kind: 'list',
    required: false,
    default: [],
    fillRate: 0.6,
    help:
      'Where it was made, where it is kept, and where it is if that is known. Name each as its ' +
      'article is titled and the reference will link itself.',
  },
  {
    key: 'associatedInstitutions',
    label: 'Associated Institutions',
    kind: 'list',
    required: false,
    default: [],
    fillRate: 0.4,
    help: 'Orders, guilds and offices that made it, hold it, or claim the right to.',
  },
  {
    key: 'associatedEthnicities',
    label: 'Associated Ethnicities',
    kind: 'list',
    required: false,
    default: [],
    fillRate: 0.4,
    help: 'The peoples who made it, revere it, or want it back.',
  },
  {
    key: 'associatedPeople',
    label: 'Associated People',
    kind: 'list',
    required: false,
    default: [],
    fillRate: 0.6,
    help:
      'Who made it, carried it, was killed for it. An object with only one of these is usually an ' +
      'object with only one story.',
  },
  {
    key: 'associatedTheology',
    label: 'Associated Theology',
    kind: 'list',
    required: false,
    default: [],
    fillRate: 0.3,
    help: 'Faiths and deities it belongs to, is used in, or is condemned by.',
  },
  {
    key: 'dimensions',
    label: 'Dimensions',
    kind: 'text',
    required: false,
    default: null,
    help:
      'How big it is, in terms this world would use. Say what is being measured where it is not ' +
      'obvious.',
    examples: ['a hand across', '1.2 metres, hilt to point', 'two ells of cloth'],
  },
  {
    key: 'weight',
    label: 'Weight',
    kind: 'text',
    required: false,
    default: null,
    fillRate: 0.6,
    help:
      'What it weighs, with the unit - and what that means for whoever has to carry it. Blank where ' +
      'nobody has ever had cause to weigh it.',
    examples: ['about 3 kilograms', 'more than a man can lift', 'nothing, to the hand'],
  },
  {
    key: 'history',
    label: 'History',
    kind: 'longtext',
    required: false,
    default: null,
    help:
      'What has happened to it, in order: who held it, how it changed hands, when it was lost and ' +
      'found. This is what an object has that a kind of object does not. Name recorded events as ' +
      'their articles are titled.',
  },
  {
    key: 'mechanics',
    label: 'Mechanics & Inner Workings',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.5,
    help:
      'How it works, if it does anything: the mechanism, the trick, what has to be done to it and in ' +
      'what order. Where people believe it does something it does not, give both and say which is ' +
      'which. Plenty of objects simply are what they are.',
  },
  {
    key: 'manufacture',
    label: 'Manufacturing Process',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.5,
    help:
      'How it was made, what of, and by whom - and whether anyone could do it again. A method that ' +
      'died with its maker is a fact worth recording, and is often why there is only one.',
  },
  {
    key: 'significance',
    label: 'Significance',
    kind: 'longtext',
    required: false,
    default: null,
    help:
      'What it means, to whom, and what they would do to have it. Where two peoples read the same ' +
      'object differently - a trophy to one and a grave good to another - that disagreement is the ' +
      'most story-bearing thing in the article.',
  },
]
