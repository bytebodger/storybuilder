/**
 * The fauna container's field spec.
 *
 * An article is not a story, so these fields ask for reference prose: what the
 * creature is, how it lives, and what it means to the people around it. The last
 * third of the list is deliberately cultural rather than biological - what a
 * creature is used for, feared for, and remembered for is usually what makes it
 * worth an article at all.
 *
 * Help text says what to cover and roughly how long. Worked examples live in
 * docs/fields-fauna.md rather than here: they belong to one universe, and a spec
 * shared by every universe should not carry another world's proper nouns into a
 * generator prompt.
 */
import type { FieldSpec } from './field-spec.ts'

export const FAUNA_FIELDS: FieldSpec[] = [
  {
    key: 'name',
    label: 'Name',
    kind: 'text',
    required: true,
    default: null,
    storeAs: 'name',
    help: 'What the creature is called. The in-world common name, not a taxonomic one.',
    examples: ['Bottonfly', 'Ice Dragon', 'Sunder Whale'],
  },
  {
    key: 'description',
    label: 'Description',
    kind: 'longtext',
    required: true,
    default: null,
    storeAs: 'summary',
    help:
      'The opening paragraph: what it is, where it lives, and why it matters to the people alongside ' +
      'it. Two to four sentences. Every other article shows this when the creature is mentioned in ' +
      'passing, so it has to stand alone.',
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
    key: 'parentSpecies',
    label: 'Parent Species',
    kind: 'text',
    required: false,
    default: null,
    help:
      'What it descended from or is a variety of. If that ancestor has its own article, name it the ' +
      'same way, and the reference will link itself.',
  },
  {
    key: 'conservationStatus',
    label: 'Conservation Status',
    kind: 'text',
    required: false,
    default: null,
    help:
      'How its numbers stand, in terms this world would use. "Abundant", "hunted to scarcity", ' +
      '"protected by decree" - not an IUCN category unless this world has an IUCN.',
  },
  {
    key: 'lifespan',
    label: 'Lifespan',
    kind: 'text',
    required: false,
    default: null,
    help: 'Typical lifespan, with the range if it varies by stage, sex or captivity.',
    examples: ['five years', 'up to 200 years in the deep'],
  },
  {
    key: 'averageHeight',
    label: 'Average Height',
    kind: 'text',
    required: false,
    default: null,
    help: 'Include the unit. Free text, so a world with its own measures can use them.',
    examples: ['15 centimeters', 'two hands at the shoulder'],
  },
  {
    key: 'averageWeight',
    label: 'Average Weight',
    kind: 'text',
    required: false,
    default: null,
    help: 'Include the unit.',
    examples: ['900 grams', 'a little under a stone'],
  },
  {
    key: 'averageLength',
    label: 'Average Length',
    kind: 'text',
    required: false,
    default: null,
    help: 'Include the unit, and say what is being measured when it is not obvious.',
    examples: ['30 centimeters', '4 meters, snout to tail'],
  },
  {
    key: 'anatomy',
    label: 'Anatomy',
    kind: 'longtext',
    required: false,
    default: null,
    help:
      'Body plan, size, colouration, and what distinguishes it on sight. Concrete detail beats ' +
      'adjectives: how many limbs, how it moves, what it sounds like.',
  },
  {
    key: 'biologicalTraits',
    label: 'Biological Traits',
    kind: 'longtext',
    required: false,
    default: null,
    help:
      'Traits that shape how the creature is experienced or regarded - including exaggerations. Where ' +
      'folklore contradicts the record, give both, and say which is which.',
  },
  {
    key: 'geneticsAndReproduction',
    label: 'Genetics and Reproduction',
    kind: 'longtext',
    required: false,
    default: null,
    help: 'Mating, gestation or clutches, parental investment, and what preys on the young.',
  },
  {
    key: 'growthAndStages',
    label: 'Growth Rate & Stages',
    kind: 'longtext',
    required: false,
    default: null,
    help:
      'The life cycle from birth to adulthood: distinct stages, how long each lasts, what changes ' +
      'between them, and lifespan.',
  },
  {
    key: 'ecologyAndHabits',
    label: 'Ecology & Habits',
    kind: 'longtext',
    required: false,
    default: null,
    help:
      'Where it thrives and where it is absent, and why. Naming the places it is *not* found is often ' +
      'what makes a range feel real.',
  },
  {
    key: 'diet',
    label: 'Dietary Needs & Habits',
    kind: 'longtext',
    required: false,
    default: null,
    help: 'What it eats at each life stage, how it feeds, and what depends on it feeding that way.',
  },
  {
    key: 'biologicalCycle',
    label: 'Biological Cycle',
    kind: 'longtext',
    required: false,
    default: null,
    help: 'Seasonal or daily rhythms: migration, hibernation, moulting, when it is active.',
  },
  {
    key: 'behavior',
    label: 'Behavior',
    kind: 'longtext',
    required: false,
    default: null,
    help: 'Temperament, territory, aggression, curiosity - how it acts when encountered.',
  },
  {
    key: 'socialStructure',
    label: 'Social Structure',
    kind: 'longtext',
    required: false,
    default: null,
    help: 'Solitary, paired, swarming, hierarchical. How individuals relate to one another.',
  },
  {
    key: 'domestication',
    label: 'Domestication',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.3,
    help:
      'Whether it has been tamed, farmed or bred, how successfully, and why not, if not. Economic ' +
      'reasons are as good as biological ones.',
  },
  {
    key: 'uses',
    label: 'Uses, Products, & Exploitation',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.5,
    help:
      'What people take from it: food, materials, dyes, medicines, poisons. Include who controls the ' +
      'trade, and how attitudes to its use differ between peoples - that disagreement is usually the ' +
      'most story-bearing thing in the article.',
  },
  {
    key: 'distribution',
    label: 'Geographic Origin and Distribution',
    kind: 'longtext',
    required: false,
    default: null,
    help:
      'Where it originated, how far it has spread, and whether it was carried there or arrived alone.',
  },
  {
    key: 'intelligence',
    label: 'Average Intelligence',
    kind: 'longtext',
    required: false,
    default: null,
    help: 'Problem-solving, memory, trainability, and whether anyone disputes the assessment.',
  },
  {
    key: 'perception',
    label: 'Perception and Sensory Capabilities',
    kind: 'longtext',
    required: false,
    default: null,
    help: 'What it can sense, how acutely, and which senses it lacks.',
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
    key: 'culturalAssociations',
    label: 'Cultural Associations',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.5,
    help:
      'What the creature signifies to the peoples who know it, and to whom. Associations are rarely ' +
      'universal - say which groups hold them.',
  },
  {
    key: 'beautyIdeals',
    label: 'Beauty Ideals',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.15,
    help: 'What counts as a fine specimen, and to whom - breeders, hunters, collectors.',
  },
  {
    key: 'genderIdeals',
    label: 'Gender Ideals',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.15,
    help: 'Differences between sexes, and any meaning cultures attach to them.',
  },
  {
    key: 'historicalImpact',
    label: 'Historical Impact',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.35,
    help: 'Events the creature shaped: famines, plagues, trade routes, wars, migrations.',
  },
  {
    key: 'myths',
    label: 'Associated Myths and Legends',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.45,
    help:
      'Stories told about it. Note where a myth is known to be false, and where nobody can say - the ' +
      'difference is itself canon.',
  },
]
