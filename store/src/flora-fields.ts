/**
 * The flora container's field spec.
 *
 * Fauna's sibling, and deliberately shaped like it: the short reference facts
 * first, as text, looked up rather than read; then the prose. A plant that
 * warrants an article - Witch's Bane Nettle, not corn - usually warrants it for
 * what people do with it, so Uses carries more weight here than it does for a
 * creature.
 *
 * Height and width, not fauna's weight and length. A plant is described by how
 * tall it stands and how far it spreads; almost nobody weighs one.
 */
import type { FieldSpec } from './field-spec.ts'

export const FLORA_FIELDS: FieldSpec[] = [
  {
    key: 'name',
    label: 'Name',
    kind: 'text',
    required: true,
    default: null,
    storeAs: 'name',
    help: 'What the plant is called. The in-world common name, not a taxonomic one.',
    examples: ['Witch’s Bane Nettle', 'Saltreed', 'Widow’s Lantern'],
  },
  {
    key: 'conservationStatus',
    label: 'Conservation Status',
    kind: 'text',
    required: false,
    default: null,
    help:
      'How it stands, in terms this world would use. "Everywhere underfoot", "picked to scarcity", ' +
      '"grown only in temple gardens".',
  },
  {
    key: 'scientificName',
    label: 'Scientific Name',
    kind: 'text',
    required: false,
    default: null,
    help:
      'The formal name, if this world has anyone who assigns them. A world with no naturalists has ' +
      'no scientific names, and leaving this blank says so.',
  },
  {
    key: 'lifespan',
    label: 'Lifespan',
    kind: 'text',
    required: false,
    default: null,
    help: 'How long a plant lives: a single season, a few years, centuries.',
    examples: ['one summer', 'eight to ten years', 'older than the town beside it'],
  },
  {
    key: 'averageHeight',
    label: 'Average Height',
    kind: 'text',
    required: false,
    default: null,
    help: 'Include the unit. Free text, so a world with its own measures can use them.',
    examples: ['knee-high', '2 meters', 'forty feet at maturity'],
  },
  {
    key: 'averageWidth',
    label: 'Average Width',
    kind: 'text',
    required: false,
    default: null,
    help:
      'How far it spreads: the breadth of a shrub or clump, the reach of a tree’s canopy. Include ' +
      'the unit.',
    examples: ['about as wide as it is tall', '3 meters across', 'a canopy of forty feet'],
  },
  {
    key: 'colorings',
    label: 'Colorings',
    kind: 'text',
    required: false,
    default: null,
    help:
      'Its colours on sight - leaf, stem, flower, fruit - briefly. How they change through the year ' +
      'belongs in Growth Rates & Stages.',
    examples: ['grey-green leaves, white flowers', 'black stems, red berries in autumn'],
  },
  {
    key: 'distribution',
    label: 'Geographic Origin and Distribution',
    kind: 'longtext',
    required: false,
    default: null,
    help:
      'Where it originated, how far it has spread, and whether it was carried there or arrived on its ' +
      'own. Where it will not grow is as useful as where it does.',
  },
  {
    key: 'description',
    label: 'Description',
    kind: 'longtext',
    required: false,
    default: null,
    storeAs: 'summary',
    help:
      'The opening paragraph: what the plant is, where it grows, and why it matters to the people ' +
      'around it. Two to four sentences. Every other article shows this when the plant is mentioned ' +
      'in passing, so it has to stand alone.',
  },
  {
    key: 'anatomy',
    label: 'Anatomy',
    kind: 'longtext',
    required: false,
    default: null,
    help:
      'Its form and what distinguishes it on sight: root, stem, leaf, flower, fruit, thorn, sap. ' +
      'Concrete detail beats adjectives - what it smells like, how it feels to the hand.',
  },
  {
    key: 'reproduction',
    label: 'Reproduction',
    kind: 'longtext',
    required: false,
    default: null,
    help:
      'How it spreads itself: seed, spore, runner, cutting. What carries the seed, when it flowers, ' +
      'and what has to happen for it to set.',
  },
  {
    key: 'growthAndStages',
    label: 'Growth Rates & Stages',
    kind: 'longtext',
    required: false,
    default: null,
    help:
      'The life cycle from seed to maturity: how fast it grows, the stages it passes through, and ' +
      'how it changes across a year.',
  },
  {
    key: 'habitats',
    label: 'Habitats',
    kind: 'longtext',
    required: false,
    default: null,
    help:
      'The ground it needs - soil, water, light, altitude, climate - and what else grows around it. ' +
      'What kills it is part of the answer.',
  },
  {
    key: 'domestication',
    label: 'Domestication',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.4,
    help:
      'Whether it has been cultivated, bred or tamed into a crop, how successfully, and why not, if ' +
      'not. Economic reasons are as good as botanical ones.',
  },
  {
    key: 'uses',
    label: 'Uses, Products & Exploitation',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.6,
    help:
      'What people take from it: food, fibre, timber, dye, medicine, poison. Include who controls the ' +
      'trade, and how attitudes to its use differ between peoples - that disagreement is usually the ' +
      'most story-bearing thing in the article.',
  },
  {
    key: 'symbiosis',
    label: 'Symbiotic and Parasitic Organisms',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.3,
    help: 'What lives on it, in it, or alongside it, and what that relationship costs each party.',
  },
  {
    key: 'history',
    label: 'History',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.4,
    help:
      'Events it shaped - famines, cures, trade routes, wars over where it grows - and how people ' +
      'first came to know it. Name recorded events as their articles are titled.',
  },
]
