/**
 * The ethnicities container's field spec.
 *
 * A people, described from the inside: what they call their children, what
 * they eat, how they bury their dead, what they will not do. Almost every field
 * is something any people has an answer to, which is exactly why the rolled
 * ones matter - a model handed twenty-seven fields writes twenty-seven, and an
 * article that has a considered position on courtship ideals for every people
 * in the world reads as a form, not as an ethnography.
 *
 * The four name lists are lists and not prose, because they are used as values:
 * a reader scans them, and a generator writing a person of this people should
 * be able to take one. The same goes for languages, figures and institutions,
 * which are names of things that may have articles of their own.
 *
 * Grouped, because twenty-seven fields in a single column is a wall. The groups
 * are contiguous, so grouping does not reorder the spec.
 */
import type { FieldSpec } from './field-spec.ts'

export const ETHNICITY_FIELDS: FieldSpec[] = [
  {
    key: 'name',
    label: 'Name',
    kind: 'text',
    required: true,
    default: null,
    storeAs: 'name',
    group: 'Overview',
    help:
      'What the people are called - by themselves, ideally. Where outsiders use a different name, ' +
      'give that in the description.',
    examples: ['Kellish', 'the Dunfolk', 'Ashani'],
  },
  {
    key: 'relatedLocations',
    label: 'Related Locations',
    kind: 'list',
    required: false,
    default: [],
    group: 'Overview',
    help:
      'Where they live, where they came from, and where they are scattered to. Name each place as ' +
      'its article is titled and the reference will link itself.',
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
      'The opening paragraph: who they are, where they live, and what sets them apart from their ' +
      'neighbours. Two to four sentences. Every other article shows this when the people are ' +
      'mentioned in passing, so it has to stand alone.',
  },
  {
    key: 'masculineNames',
    label: 'Common Masculine Names',
    kind: 'list',
    required: false,
    default: [],
    group: 'Names',
    help:
      'Given names common among men and boys, sounding like one language. Record as many as you ' +
      'like: a short list is used sparingly, so two names flavour a people rather than naming half ' +
      'its men, and a long one is leaned on harder.',
  },
  {
    key: 'feminineNames',
    label: 'Common Feminine Names',
    kind: 'list',
    required: false,
    default: [],
    group: 'Names',
    help: 'Given names common among women and girls, in the same sound as the masculine names.',
  },
  {
    key: 'unisexNames',
    label: 'Common Unisex Names',
    kind: 'list',
    required: false,
    default: [],
    fillRate: 0.4,
    group: 'Names',
    help: 'Given names used for anyone. Many peoples have few or none, and blank says so.',
  },
  {
    key: 'familyNames',
    label: 'Common Family Names',
    kind: 'list',
    required: false,
    default: [],
    group: 'Names',
    help:
      'Family names, clan names, or whatever stands in their place. If family is marked some other ' +
      'way - a patronymic, a place, a trade - give examples of that, and say so in Culture & Heritage.',
  },
  {
    key: 'languages',
    label: 'Language(s)',
    kind: 'list',
    required: false,
    default: [],
    group: 'Culture',
    help:
      'The languages they speak, the first being the one they grow up in. Name each as its article ' +
      'is titled and the reference will link itself.',
  },
  {
    key: 'cultureAndHeritage',
    label: 'Culture & Heritage',
    kind: 'longtext',
    required: false,
    default: null,
    group: 'Culture',
    help:
      'What they believe they have inherited and are keeping: where they say they came from, what ' +
      'they are proud of, what they feel they have lost.',
  },
  {
    key: 'codesAndValues',
    label: 'Shared Codes & Values',
    kind: 'longtext',
    required: false,
    default: null,
    group: 'Culture',
    help:
      'What is admired and what is despised. Concrete over abstract: not "they value honour" but ' +
      'what someone has to do to lose it.',
  },
  {
    key: 'etiquette',
    label: 'Common Etiquette',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.6,
    group: 'Culture',
    help:
      'How to greet, host, eat, bargain and part company without giving offence - and the mistakes ' +
      'outsiders reliably make.',
  },
  {
    key: 'traditionalStyles',
    label: 'Traditional Styles',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.7,
    group: 'Culture',
    help:
      'Dress, hair, adornment and marking: what is worn every day, what is worn for occasions, and ' +
      'what a style says about who is wearing it.',
  },
  {
    key: 'artAndArchitecture',
    label: 'Art & Architecture',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.6,
    group: 'Culture',
    help:
      'What they make and build, and what makes it recognisably theirs: materials, forms, motifs, ' +
      'and what they refuse to depict.',
  },
  {
    key: 'foods',
    label: 'Foods & Cuisine',
    kind: 'longtext',
    required: false,
    default: null,
    group: 'Culture',
    help:
      'What they eat every day and what they eat to celebrate, what they will not eat, and what ' +
      'their neighbours think of it.',
  },
  {
    key: 'customsAndTraditions',
    label: 'Common Customs & Traditions',
    kind: 'longtext',
    required: false,
    default: null,
    group: 'Culture',
    help:
      'The observances of an ordinary year: festivals, days of rest, obligations to kin and ' +
      'neighbours. Name observances that have articles of their own as those articles are titled.',
  },
  {
    key: 'birthRites',
    label: 'Birth Rites',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.5,
    group: 'Rites of Passage',
    help: 'What is done when a child is born, and when - and by whom - a child is named.',
  },
  {
    key: 'comingOfAgeRites',
    label: 'Coming-of-Age Rites',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.5,
    group: 'Rites of Passage',
    help:
      'How a child becomes an adult in the eyes of the people, at what age, and what changes ' +
      'afterwards. Where it differs by sex or station, say how.',
  },
  {
    key: 'funeraryCustoms',
    label: 'Funerary & Memorial Customs',
    kind: 'longtext',
    required: false,
    default: null,
    group: 'Rites of Passage',
    help:
      'What is done with the dead, how they are mourned, and how - and for how long - they are ' +
      'remembered.',
  },
  {
    key: 'taboos',
    label: 'Common Taboos',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.6,
    group: 'Lore',
    help:
      'What is not done, said, eaten or touched, and what is believed to follow if it is. Say which ' +
      'are still kept and which only the old still mind.',
  },
  {
    key: 'mythsAndLegends',
    label: 'Shared Myths & Legends',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.6,
    group: 'Lore',
    help:
      'The stories every child of this people knows. Name legends that have articles of their own ' +
      'as those articles are titled, and say where neighbouring peoples tell the same story ' +
      'differently.',
  },
  {
    key: 'historicalFigures',
    label: 'Major Historical Figures',
    kind: 'list',
    required: false,
    default: [],
    fillRate: 0.4,
    group: 'Lore',
    help:
      'The people they remember, for good or ill. Name each as their article is titled and the ' +
      'reference will link itself. Prefer figures already in the canon to inventing new ones.',
  },
  {
    key: 'beautyIdeals',
    label: 'Beauty Ideals',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.5,
    group: 'Ideals',
    help: 'What is considered beautiful, in whom, and what is done to attain it.',
  },
  {
    key: 'genderIdeals',
    label: 'Gender Ideals',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.6,
    group: 'Ideals',
    help:
      'What is expected of men, of women, and of anyone who is neither, and how strictly. Where the ' +
      'ideal and ordinary life differ, say how.',
  },
  {
    key: 'courtshipIdeals',
    label: 'Courtship Ideals',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.5,
    group: 'Ideals',
    help: 'How a match is sought and made, who has a say in it, and what counts as going too far.',
  },
  {
    key: 'relationshipIdeals',
    label: 'Relationship Ideals',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.5,
    group: 'Ideals',
    help:
      'What a good marriage, partnership or household looks like, how many people it has in it, and ' +
      'how one ends.',
  },
  {
    key: 'associatedInstitutions',
    label: 'Associated Institutions',
    kind: 'list',
    required: false,
    default: [],
    fillRate: 0.5,
    group: 'Connections',
    help:
      'Orders, guilds, houses, faiths and offices the people are bound up with. Name each as its ' +
      'article is titled.',
  },
]
