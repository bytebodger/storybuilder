/**
 * The people container's field spec.
 *
 * The longest spec in the tool, and deliberately so: a person is the thing a
 * story is made of, and the questions worth answering about one do not compress.
 * Nothing here is required beyond a given name and an overview - a person can be
 * a name and a sentence, and grow the rest as the canon needs it.
 *
 * Two things about it are unlike the other specs.
 *
 * The name arrives in parts. Given, middle, family and suffix each store
 * themselves and are joined, in that order, into the item's name - so an article
 * is titled "Aldric Corvane Vane III" and can still be edited a piece at a time.
 * The honorific is not part of that: "Queen" is how a person is addressed, not
 * what they are called, and folding it into the name would leave every reference
 * to Aldrica Vane failing to find the article about Queen Aldrica Vane.
 *
 * The fields are grouped, because fifty-odd of them in one column is a wall. The
 * groups are runs of the spec in order; nothing is reordered to suit them.
 */
import type { FieldSpec } from './field-spec.ts'

export const PEOPLE_FIELDS: FieldSpec[] = [
  {
    key: 'honorific',
    label: 'Honorific/Title',
    kind: 'text',
    group: 'Name',
    required: false,
    default: null,
    help:
      'How the person is addressed, not what they are called. Kept out of the article title on ' +
      'purpose, so a mention of the bare name still finds them.',
    examples: ['Queen', 'Brother', 'Magister', 'Goodwife'],
  },
  {
    key: 'givenName',
    label: 'Given Name',
    kind: 'text',
    group: 'Name',
    required: true,
    default: null,
    storeAs: 'name',
    help:
      'The name they were given. The one part that is required: everything else about a person can ' +
      'arrive later, but something has to be on the door.',
    examples: ['Aldric', 'Thessaly', 'Corr'],
  },
  {
    key: 'middleName',
    label: 'Middle Name',
    kind: 'text',
    group: 'Name',
    required: false,
    default: null,
    storeAs: 'name',
    help:
      'Whatever sits between the given and family names in this culture — a second given name, a ' +
      'patronymic, a house name. Leave blank where the culture has no such thing.',
  },
  {
    key: 'familyName',
    label: 'Family Name',
    kind: 'text',
    group: 'Name',
    required: false,
    default: null,
    storeAs: 'name',
    help:
      'The inherited name, if this person’s people use one. Plenty do not, and a blank here says ' +
      'so rather than leaving a gap to be filled in.',
    examples: ['Vane', 'of Dol', 'Ashkeeper'],
  },
  {
    key: 'suffix',
    label: 'Suffix',
    kind: 'text',
    group: 'Name',
    required: false,
    default: null,
    storeAs: 'name',
    help: 'What follows the name and is read as part of it: a regnal number, an order, an epithet.',
    examples: ['III', 'the Younger', 'Kellsblood'],
  },
  {
    key: 'nicknames',
    label: 'Nicknames/Aliases',
    kind: 'list',
    group: 'Name',
    required: false,
    default: [],
    storeAs: 'aliases',
    help:
      'Every other name they answer to: what friends call them, what enemies call them, what they ' +
      'travelled under. These are stored as the item’s aliases, so a mention of any of them links ' +
      'to this article and a stub is never raised for a name this person already has.',
    examples: ['the Kingslayer', 'Red Aldric', 'Corr of the Reach'],
  },
  {
    key: 'overview',
    label: 'Overview',
    kind: 'longtext',
    group: 'In brief',
    required: true,
    default: null,
    storeAs: 'summary',
    help:
      'Who this person is and why they matter, in two to four sentences. This is what every other ' +
      'article shows when they are mentioned in passing, so it has to stand on its own.',
  },
  {
    key: 'species',
    label: 'Species',
    kind: 'text',
    group: 'In brief',
    required: false,
    default: null,
    help:
      'What kind of creature they are. Leave blank in a universe with only one, where saying it ' +
      'would imply there are others.',
  },
  {
    key: 'ethnicity',
    label: 'Ethnicity',
    kind: 'text',
    group: 'In brief',
    required: false,
    default: null,
    help:
      'The people they belong to, as that people would name themselves. Name it as its article is ' +
      'titled and the reference will link itself.',
  },
  {
    key: 'titles',
    label: 'Titles',
    kind: 'list',
    group: 'In brief',
    required: false,
    default: [],
    help:
      'Offices, ranks and holdings, held or lost. Distinct from the honorific, which is one form of ' +
      'address; this is the full account, and dates belong in it where they are known.',
    examples: ['Warden of the Reach (412–431)', 'third of her line to sit the Ash Seat'],
  },
  {
    key: 'birthYear',
    label: 'Birth Year',
    kind: 'text',
    group: 'Life and death',
    required: false,
    default: null,
    storeAs: 'beginDate',
    help:
      'The year they were born, in this universe’s years. Stored as the item’s begin date, which is ' +
      'what lets anything asking who was alive in a given year answer without reading the article.',
    examples: ['412', 'Year 1104', 'about 380'],
  },
  {
    key: 'birthDay',
    label: 'Birth Day',
    kind: 'text',
    group: 'Life and death',
    required: false,
    default: null,
    help: 'The day within that year, in whatever calendar this world keeps.',
    examples: ['4th of Hallowing', 'midwinter'],
  },
  {
    key: 'deathYear',
    label: 'Death Year',
    kind: 'text',
    group: 'Life and death',
    required: false,
    default: null,
    storeAs: 'endDate',
    help:
      'The year they died. Stored as the item’s end date, so leaving it blank is a claim: this ' +
      'person is still alive. Filling it in is what stops them walking into a later scene.',
    examples: ['478', 'Year 1160'],
  },
  {
    key: 'deathDay',
    label: 'Death Day',
    kind: 'text',
    group: 'Life and death',
    required: false,
    default: null,
    help: 'The day within that year, and the hour if it is the kind of death that is remembered.',
  },
  {
    key: 'placeOfBirth',
    label: 'Place of Birth',
    kind: 'text',
    group: 'Life and death',
    required: false,
    default: null,
    help: 'Where they were born. Name it as its article is titled and the reference will link itself.',
  },
  {
    key: 'placeOfDeath',
    label: 'Place of Death',
    kind: 'text',
    group: 'Life and death',
    required: false,
    default: null,
    help: 'Where they died, and where they lie if that is somewhere else.',
  },
  {
    key: 'parents',
    label: 'Parents',
    kind: 'list',
    group: 'Family',
    required: false,
    default: [],
    help:
      'Who raised them and who bore them, which are not always the same people. Say which is which ' +
      'where it matters. Each name links separately.',
  },
  {
    key: 'siblings',
    label: 'Siblings',
    kind: 'list',
    group: 'Family',
    required: false,
    default: [],
    help: 'Brothers, sisters, half and step. Birth order belongs here where a culture cares about it.',
  },
  {
    key: 'partners',
    label: 'Partners',
    kind: 'list',
    group: 'Family',
    required: false,
    default: [],
    help:
      'Spouses and partners, current and former, in whatever arrangement this culture recognises. ' +
      'How each ended is worth a clause.',
  },
  {
    key: 'children',
    label: 'Children',
    kind: 'list',
    group: 'Family',
    required: false,
    default: [],
    help: 'Their children, born and adopted, living and dead.',
  },
  {
    key: 'sex',
    label: 'Sex',
    kind: 'text',
    group: 'Body',
    required: false,
    default: null,
    help: 'Biological sex, in whatever terms this species and this world use for it.',
  },
  {
    key: 'gender',
    label: 'Gender',
    kind: 'text',
    group: 'Body',
    required: false,
    default: null,
    help:
      'How they live and are read, which a world may or may not treat as the same question as sex. ' +
      'Where the culture has categories of its own, use those.',
  },
  {
    key: 'eyes',
    label: 'Eye Type/Color',
    kind: 'text',
    group: 'Body',
    required: false,
    default: null,
    help: 'Colour, shape, and anything about them that is not ordinary for their kind.',
    examples: ['pale grey, always a little red at the rim', 'black, no visible sclera'],
  },
  {
    key: 'hair',
    label: 'Hair Type/Color',
    kind: 'text',
    group: 'Body',
    required: false,
    default: null,
    help: 'Colour, texture and how they wear it — which is often the part that says most.',
  },
  {
    key: 'skin',
    label: 'Skin Type/Color',
    kind: 'text',
    group: 'Body',
    required: false,
    default: null,
    help: 'Colour and texture, and whatever their work or their weather has done to it.',
  },
  {
    key: 'height',
    label: 'Height',
    kind: 'text',
    group: 'Body',
    required: false,
    default: null,
    help: 'How tall, in this world’s units. A comparison serves where the world has no ruler.',
    examples: ['five foot eleven', 'a head taller than most Kellish'],
  },
  {
    key: 'weight',
    label: 'Weight',
    kind: 'text',
    group: 'Body',
    required: false,
    default: null,
    help: 'How heavy, or how they are built if the number is not the useful part.',
  },
  {
    key: 'knownLanguages',
    label: 'Known Languages',
    kind: 'list',
    group: 'Standing',
    required: false,
    default: [],
    help:
      'What they speak, read and write, and how well. Which of those three a language falls under ' +
      'is often the whole point.',
    examples: ['Kellish (native)', 'Old Dolic (reads, does not speak)'],
  },
  {
    key: 'archetype',
    label: 'Archetype',
    kind: 'text',
    group: 'Standing',
    required: false,
    default: null,
    help:
      'A known character who is a useful analog for this one — from any story, in or out of this ' +
      'universe. It is shorthand, not a claim: naming Luke Skywalker says where to start reading ' +
      'this person, not that they are modelled on him in every particular. Say what the analogy ' +
      'is for where it is not obvious.',
    examples: ['Luke Skywalker', 'Thomas Cromwell', 'Cassandra, but believed'],
  },
  {
    key: 'associations',
    label: 'Associations',
    kind: 'list',
    group: 'Standing',
    required: false,
    default: [],
    help:
      'Every body they belong to and every standing they hold: a house, a guild, an order, a ' +
      'conspiracy, a crown. One person can be prince of a region, member of a secret society and ' +
      'founder of a guild at once — list all three. Name each as its article is titled.',
  },
  {
    key: 'religiousBeliefs',
    label: 'Religious Beliefs',
    kind: 'longtext',
    group: 'Standing',
    required: false,
    default: null,
    help:
      'What they believe and how they practise it, including the distance between the two. ' +
      'Indifference and apostasy are answers; so is believing something their people do not.',
  },
  {
    key: 'physicalDescription',
    label: 'Physical Description',
    kind: 'longtext',
    group: 'Appearance',
    required: false,
    default: null,
    help:
      'The whole impression, in prose: what someone notices walking into the room. The separate ' +
      'measurements above are for looking a thing up; this is for seeing them.',
  },
  {
    key: 'bodyFeatures',
    label: 'Body Features',
    kind: 'longtext',
    group: 'Appearance',
    required: false,
    default: null,
    help: 'Build, bearing, gait, hands — and what a life of doing whatever they do has made of them.',
  },
  {
    key: 'facialFeatures',
    label: 'Facial Features',
    kind: 'longtext',
    group: 'Appearance',
    required: false,
    default: null,
    help: 'The face in particular: its structure, its habitual expression, what it gives away.',
  },
  {
    key: 'identifyingCharacteristics',
    label: 'Identifying Characteristics',
    kind: 'longtext',
    group: 'Appearance',
    required: false,
    default: null,
    help:
      'What would be on a description of them: scars, marks, brands, a missing finger, a voice. The ' +
      'things by which a stranger could pick them out or a hunter could name them.',
  },
  {
    key: 'specialAbilities',
    label: 'Special Abilities',
    kind: 'longtext',
    group: 'Appearance',
    required: false,
    default: null,
    help:
      'What they can do that others cannot, and — more usefully — what it costs and where it fails. ' +
      'An ability with no limit stated is one that will be reached for to solve anything.',
  },
  {
    key: 'apparel',
    label: 'Apparel & Accessories',
    kind: 'longtext',
    group: 'Appearance',
    required: false,
    default: null,
    help:
      'What they wear and carry, and what it signals to people who can read it. Include the thing ' +
      'they are never without.',
  },
  {
    key: 'personalHistory',
    label: 'Personal History',
    kind: 'longtext',
    group: 'Life and experience',
    required: false,
    default: null,
    help:
      'What happened to them, in order. The spine of the article. Events large enough to matter to ' +
      'more than this one person belong in their own History articles, named here.',
  },
  {
    key: 'sexuality',
    label: 'Sexuality',
    kind: 'text',
    group: 'Life and experience',
    required: false,
    default: null,
    help:
      'Who they are drawn to, in whatever terms this world uses — which may not be the terms ours ' +
      'uses, and may not be a category this culture names at all.',
  },
  {
    key: 'education',
    label: 'Education',
    kind: 'longtext',
    group: 'Life and experience',
    required: false,
    default: null,
    help:
      'How they were taught and by whom: school, apprenticeship, temple, the road. What they were ' +
      'never taught is usually the more interesting half.',
  },
  {
    key: 'employment',
    label: 'Employment',
    kind: 'longtext',
    group: 'Life and experience',
    required: false,
    default: null,
    help:
      'What they have done for a living, in order, including the work they would rather not be ' +
      'reminded of. Draw on the universe’s professions list where one fits.',
  },
  {
    key: 'accomplishments',
    label: 'Accomplishments & Achievements',
    kind: 'longtext',
    group: 'Life and experience',
    required: false,
    default: null,
    help: 'What they have done that is known, and what they are given credit for whether or not they did it.',
  },
  {
    key: 'failures',
    label: 'Failures & Embarrassments',
    kind: 'longtext',
    group: 'Life and experience',
    required: false,
    default: null,
    help:
      'What went wrong, what they are blamed for, and what they would pay to have forgotten. A ' +
      'person with no entry here is not a person yet.',
  },
  {
    key: 'trauma',
    label: 'Trauma',
    kind: 'longtext',
    group: 'Life and experience',
    required: false,
    default: null,
    help:
      'What was done to them or what they survived, and how it still shows — in what they avoid, ' +
      'what they cannot let go, what they are wrong about.',
  },
  {
    key: 'intellectualCharacteristics',
    label: 'Intellectual Characteristics',
    kind: 'longtext',
    group: 'Character',
    required: false,
    default: null,
    help:
      'How they think: quick or slow, systematic or intuitive, curious or incurious. What they are ' +
      'clever about and what they are reliably stupid about.',
  },
  {
    key: 'moralityAndPhilosophy',
    label: 'Morality & Philosophy',
    kind: 'longtext',
    group: 'Character',
    required: false,
    default: null,
    help:
      'What they hold to be right, and where they have found they will not hold to it. The gap is ' +
      'the character.',
  },
  {
    key: 'taboos',
    label: 'Taboos',
    kind: 'longtext',
    group: 'Character',
    required: false,
    default: null,
    help:
      'What they will not do, will not touch, will not speak of. Their own, where these differ from ' +
      'their culture’s — and note where they do differ.',
  },
  {
    key: 'motivations',
    label: 'Motivations',
    kind: 'longtext',
    group: 'Character',
    required: false,
    default: null,
    help:
      'What they want, in order, and what they would give up to get it. Include the want they would ' +
      'not admit to, which is generally the one that moves them.',
  },
  {
    key: 'virtues',
    label: 'Virtues',
    kind: 'longtext',
    group: 'Character',
    required: false,
    default: null,
    help: 'What is genuinely good in them, including the virtues that cost them.',
  },
  {
    key: 'vicesAndFlaws',
    label: 'Vices & Flaws',
    kind: 'longtext',
    group: 'Character',
    required: false,
    default: null,
    help:
      'Appetites, weaknesses, blind spots. Distinguish the ones they know about from the ones ' +
      'everyone else can see.',
  },
  {
    key: 'ticsAndMannerisms',
    label: 'Tics & Mannerisms',
    kind: 'longtext',
    group: 'Character',
    required: false,
    default: null,
    help:
      'How they hold themselves, what their hands do, the phrase they overuse. The small repeatable ' +
      'things that let a reader recognise them in a scene before they are named.',
  },
  {
    key: 'hygiene',
    label: 'Hygiene',
    kind: 'text',
    group: 'Character',
    required: false,
    default: null,
    help:
      'How they keep themselves, measured against what their station and their world expect — which ' +
      'is what makes it say anything.',
  },
  {
    key: 'legacy',
    label: 'Legacy',
    kind: 'longtext',
    group: 'Ties and legacy',
    required: false,
    default: null,
    help:
      'What outlasts them: what is named after them, what is still argued about, what they are ' +
      'remembered for as against what they actually did.',
  },
  {
    key: 'interpersonalRelationships',
    label: 'Interpersonal Relationships',
    kind: 'longtext',
    group: 'Ties and legacy',
    required: false,
    default: null,
    help:
      'Who they are to other people and those people to them: allies, rivals, debts, the friend ' +
      'they wronged. Name each as their article is titled.',
  },
  {
    key: 'familyTies',
    label: 'Family Ties',
    kind: 'longtext',
    group: 'Ties and legacy',
    required: false,
    default: null,
    help:
      'What the family actually is to them, as against the list of names above: who they speak to, ' +
      'what is owed, what is not forgiven.',
  },
  {
    key: 'petsAndHobbies',
    label: 'Pets & Hobbies',
    kind: 'longtext',
    group: 'Ties and legacy',
    required: false,
    default: null,
    help: 'What they keep and what they do when no one needs anything from them.',
  },
  {
    key: 'financialHistory',
    label: 'Financial History',
    kind: 'longtext',
    group: 'Ties and legacy',
    required: false,
    default: null,
    help:
      'What they have, what they had, who they owe and who owes them. Where the money came from is ' +
      'usually the story.',
  },
]
