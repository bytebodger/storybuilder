/**
 * The roads container's field spec.
 *
 * Roads, passes and paths - including small ones, when a pass controls a
 * region's commerce. `geography` holds the ground; this holds the way through
 * it.
 *
 * Navigability is the field that makes a road worth an article, and it is never
 * rolled away. A road that is simply a line between two places is a line on a
 * map; a road with a washed-out season, a toll nobody can afford and a stretch
 * the watch will not ride is a road a story can happen on. Its help text asks
 * for what goes wrong on it.
 *
 * Established On is the item's `beginDate` and is rolled low, because most
 * paths were never established at all - they were walked until they were a
 * road, and a generator handed the field invents a founding year for a goat
 * track.
 */
import type { FieldSpec } from './field-spec.ts'

export const ROAD_FIELDS: FieldSpec[] = [
  {
    key: 'name',
    label: 'Name',
    kind: 'text',
    required: true,
    default: null,
    storeAs: 'name',
    help: 'What the road is called by the people who use it, which is often not its official name.',
    examples: ['The Salt Road', 'The Widow’s Pass', 'the Low Way'],
  },
  {
    key: 'description',
    label: 'Description',
    kind: 'longtext',
    required: false,
    default: null,
    storeAs: 'summary',
    help:
      'The opening paragraph: where it runs, what it is like to travel, and why it matters. Two to ' +
      'four sentences. Every other article shows this when the road is mentioned in passing, so it ' +
      'has to stand alone.',
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
      'When it was built or formally opened, in this universe’s calendar. Most ways were never ' +
      'established at all - they were walked until they were a road - and blank says so, as does ' +
      'saying the year it was first paved or first patrolled.',
    examples: ['412', 'Year 604, by decree', 'paved in 880; older than the record', 'never built; walked'],
  },
  {
    key: 'locations',
    label: 'Location(s)',
    kind: 'list',
    required: false,
    default: [],
    help:
      'What it runs between and through, in order where that makes sense: the places at each end, ' +
      'and what it passes on the way. Name each as its article is titled and the reference will link ' +
      'itself.',
  },
  {
    key: 'purpose',
    label: 'Purpose / Function',
    kind: 'longtext',
    required: false,
    default: null,
    help:
      'What it is for beyond joining two places - the trade it opened, the garrison it supplies, the ' +
      'treaty it was built to prove. Where the reason it was made and the reason it is used now ' +
      'differ, give both.',
  },
  {
    key: 'commercialImpact',
    label: 'Commercial Impact',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.6,
    help:
      'What moves along it, in what quantity, and who got rich or was ruined by it. A road that ' +
      'killed a river trade is as interesting as one that made a town.',
  },
  {
    key: 'culturalImpact',
    label: 'Cultural Impact',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.5,
    help:
      'What travels it besides goods: languages, faiths, songs, disease, news. Who meets whom ' +
      'because of it, and what came of that.',
  },
  {
    key: 'politicalImpact',
    label: 'Political Impact',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.5,
    help:
      'Who controls it, who wants to, and what holding it is worth. Tolls, garrisons, border ' +
      'disputes, and the armies it has carried.',
  },
  {
    key: 'navigability',
    label: 'Navigability',
    kind: 'longtext',
    required: false,
    default: null,
    help:
      'What goes wrong on it: the stretch that floods, the pass that closes in winter, the tolls, ' +
      'the highwaymen, the miles the watch will not ride. How long it takes, in what season, and ' +
      'what a traveller needs to survive it.',
  },
  {
    key: 'history',
    label: 'History',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.5,
    help:
      'What has happened on it and to it, in order: who built it, who closed it, what was carried ' +
      'down it that mattered. Name recorded events as their articles are titled.',
  },
  {
    key: 'traffic',
    label: 'Traffic',
    kind: 'longtext',
    required: false,
    default: null,
    help:
      'Who is on it and how many: caravans, pilgrims, herds, soldiers, nobody at all. Say how it ' +
      'changes with the season and the hour, and who you would not expect to meet on it.',
  },
]
