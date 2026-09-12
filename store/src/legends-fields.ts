/**
 * The legends container's field spec.
 *
 * Two fields carry the whole design. **Description** is the article's own
 * voice - what this legend is, who tells it, why it matters - and is the item's
 * summary, shown wherever the legend is mentioned elsewhere. **Summary** is the
 * story itself, retold: what happens in it, in order. Keeping them apart is
 * what stops an article about a legend turning into the legend.
 *
 * Both years are rolled low, because a legend with a date is the exception. Most
 * have no demonstrable year of composition and no year they claim to have
 * happened in, and a generator handed either field supplies one - which quietly
 * converts every myth in the world into a dated event.
 *
 * The Year of Recording is the item's `beginDate`: the moment a legend enters
 * the record is the moment it begins, as far as anything reading dates off the
 * store is concerned. The year it claims to be set in is an attribute, because
 * it is a claim the legend makes rather than a fact about the legend.
 */
import type { FieldSpec } from './field-spec.ts'

export const LEGEND_FIELDS: FieldSpec[] = [
  {
    key: 'name',
    label: 'Name',
    kind: 'text',
    required: true,
    default: null,
    storeAs: 'name',
    help: 'What the legend is called by the people who tell it.',
    examples: ['The Drowned Bell', 'The Nine Who Waited', 'The Salt Bride'],
  },
  {
    key: 'description',
    label: 'Description',
    kind: 'longtext',
    required: false,
    default: null,
    storeAs: 'summary',
    help:
      'The opening paragraph, in the article’s own voice: what this legend is, who tells it, and why ' +
      'it matters. Two to four sentences. Not the story itself - that goes in Summary. Every other ' +
      'article shows this when the legend is mentioned in passing, so it has to stand alone.',
  },
  {
    key: 'yearRecorded',
    label: 'Year of Recording',
    kind: 'text',
    required: false,
    default: null,
    fillRate: 0.3,
    storeAs: 'beginDate',
    help:
      'When it was first written down or first attested, in this universe’s calendar. Most legends ' +
      'have no such year and the field stays blank; say "first attested" rather than inventing a ' +
      'date for a story that was told long before anyone wrote it.',
    examples: ['412', 'first attested Year 604', 'no earlier copy than 1130'],
  },
  {
    key: 'yearSet',
    label: 'Year of Setting',
    kind: 'text',
    required: false,
    default: null,
    fillRate: 0.25,
    help:
      'When the legend claims to have happened. Most are vague on purpose - "before the ice", "in ' +
      'the time of the first harbour" - and belong blank or in those words rather than in a number.',
    examples: ['Year 88, by its own telling', 'before the first harbour', 'the winter of the two moons'],
  },
  {
    key: 'associatedDocuments',
    label: 'Associated Documents',
    kind: 'list',
    required: false,
    default: [],
    fillRate: 0.35,
    help:
      'The texts it comes down to us in, or that discuss it. Name each as its article is titled and ' +
      'the reference will link itself. Most legends were never written down by anyone.',
  },
  {
    key: 'associatedEthnicities',
    label: 'Associated Ethnicities',
    kind: 'list',
    required: false,
    default: [],
    fillRate: 0.6,
    help: 'The peoples who tell it, and the peoples it is told about, which are often not the same.',
  },
  {
    key: 'associatedLocations',
    label: 'Associated Locations',
    kind: 'list',
    required: false,
    default: [],
    fillRate: 0.6,
    help: 'The settled places it happens in, or that claim it.',
  },
  {
    key: 'associatedGeography',
    label: 'Associated Geography',
    kind: 'list',
    required: false,
    default: [],
    fillRate: 0.5,
    help:
      'The features it happens at or explains: the bay, the pass, the stone anyone can still go and ' +
      'stand beside.',
  },
  {
    key: 'associatedPeople',
    label: 'Associated People',
    kind: 'list',
    required: false,
    default: [],
    fillRate: 0.6,
    help:
      'Who appears in it, and anyone recorded as having told or collected it. A figure who exists ' +
      'only inside the legend still belongs here.',
  },
  {
    key: 'associatedInstitutions',
    label: 'Associated Institutions',
    kind: 'list',
    required: false,
    default: [],
    fillRate: 0.4,
    help: 'The orders, guilds and faiths that keep it, use it, or are embarrassed by it.',
  },
  {
    key: 'synopsis',
    label: 'Summary',
    kind: 'longtext',
    required: false,
    default: null,
    help:
      'The story itself, retold: what happens, in order, and how it ends. Tell it plainly rather ' +
      'than in the voice of the tale - this is a synopsis, not a performance. Where the ending ' +
      'differs between tellings, give the common one here and the rest in Variations.',
  },
  {
    key: 'historicalBasis',
    label: 'Historical Basis',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.6,
    help:
      'What, if anything, is known to lie under it: a recorded event, a real person, a flood anyone ' +
      'can date. Say plainly where there is none, and where scholars disagree, say who holds what.',
  },
  {
    key: 'spread',
    label: 'Spread / Apocrypha',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.5,
    help:
      'How far it has travelled and by what route - traders, soldiers, pilgrims - and the additions ' +
      'that have attached themselves to it along the way.',
  },
  {
    key: 'variations',
    label: 'Variations',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.6,
    help:
      'How the telling changes between peoples, places and generations - who is the villain, how it ' +
      'ends, what is left out. Which version a person tells is a fact about that person.',
  },
  {
    key: 'culturalImpact',
    label: 'Cultural Impact',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.6,
    help:
      'What it has done to how people live: customs, sayings, superstitions, names given to children, ' +
      'places nobody will go after dark. Say which peoples hold them.',
  },
  {
    key: 'literaryImpact',
    label: 'Literary Impact',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.4,
    help:
      'Works that retell or borrow it, and what each made of it. A world with little writing has ' +
      'little of this, and blank says so.',
  },
  {
    key: 'artisticImpact',
    label: 'Artistic Impact',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.4,
    help:
      'How it is depicted, and where: carvings, hangings, inn signs, songs, masks worn at a festival. ' +
      'What is always shown, and what is never shown.',
  },
]
