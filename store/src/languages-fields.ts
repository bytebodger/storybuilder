/**
 * The languages container's field spec.
 *
 * Five of these fields ask for linguistics - phonology, morphology, syntax,
 * vocabulary, sentence structure - and that is exactly where a generator will
 * write the most and say the least. Asked about the morphology of a language
 * nobody has described, a model produces a paragraph of textbook that is true
 * of a thousand languages and tells a reader nothing about this one. So all
 * five are rolled, and their help text asks for one concrete thing a speaker
 * would notice rather than a survey.
 *
 * Syntax and Sentence Structure overlap by nature, so the spec splits them the
 * way a grammar would: syntax is what has to agree with what, and sentence
 * structure is the order it comes out in.
 *
 * Writing System is rolled too, because an unwritten language is an ordinary
 * thing to be and a model handed the field invents a script every time.
 */
import type { FieldSpec } from './field-spec.ts'

export const LANGUAGE_FIELDS: FieldSpec[] = [
  {
    key: 'name',
    label: 'Name',
    kind: 'text',
    required: true,
    default: null,
    storeAs: 'name',
    help:
      'What the language is called. Where its speakers and their neighbours call it different ' +
      'things, use the speakers’ name here and give the other in the description.',
    examples: ['Kellish', 'Low Dunnish', 'the Old Tongue'],
  },
  {
    key: 'description',
    label: 'Description',
    kind: 'longtext',
    required: false,
    default: null,
    storeAs: 'summary',
    help:
      'The opening paragraph: who speaks it, where, and what it sounds like to someone who does ' +
      'not. Two to four sentences. Every other article shows this when the language is mentioned in ' +
      'passing, so it has to stand alone.',
  },
  {
    key: 'parentLanguages',
    label: 'Parent Languages',
    kind: 'list',
    required: false,
    default: [],
    fillRate: 0.5,
    help:
      'What it descends from, or the languages it was made out of where it is a trade tongue or a ' +
      'creole. Name each as its article is titled and the reference will link itself. Plenty of ' +
      'languages have no recorded ancestor, and blank says so.',
  },
  {
    key: 'spokenBy',
    label: 'Spoken By',
    kind: 'list',
    required: false,
    default: [],
    help:
      'Who speaks it: peoples, faiths, orders, trades. Name each as its article is titled. Where a ' +
      'group speaks it only in certain company - at court, in rites, over a counter - say so in ' +
      'Cultural Significance.',
  },
  {
    key: 'distribution',
    label: 'Geographic Distribution',
    kind: 'longtext',
    required: false,
    default: null,
    help:
      'Where it is spoken, where it is only understood, and where it has been driven out. Say which ' +
      'way the border is moving, if it is.',
  },
  {
    key: 'writingSystem',
    label: 'Writing System',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.6,
    help:
      'What it is written with, if anything: the script, what it is cut or inked on, who is taught ' +
      'to read it, and whether the written form has drifted from the spoken one. An unwritten ' +
      'language is an ordinary thing to be.',
  },
  {
    key: 'phonology',
    label: 'Phonology',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.5,
    help:
      'How it sounds. Give what an outsider would notice first - a sound their own tongue lacks, a ' +
      'stress that falls oddly, a consonant that defeats them - rather than a survey of the whole ' +
      'inventory.',
  },
  {
    key: 'morphology',
    label: 'Morphology',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.4,
    help:
      'How words are built and changed: endings, prefixes, compounds, what marks number, tense or ' +
      'respect. One rule stated concretely, with an example, beats a paragraph of terminology.',
  },
  {
    key: 'syntax',
    label: 'Syntax',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.4,
    help:
      'What has to agree with what, and what a sentence may not leave out. Cases, particles, ' +
      'articles, the marking that decides who did what to whom. Word order belongs in Sentence ' +
      'Structure.',
  },
  {
    key: 'vocabulary',
    label: 'Vocabulary',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.6,
    help:
      'What the language is rich in and what it has no word for - which says more about its speakers ' +
      'than any rule does. Include a handful of actual words with their meanings, and anything it ' +
      'borrowed and from whom.',
  },
  {
    key: 'sentenceStructure',
    label: 'Sentence Structure',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.4,
    help:
      'The order it comes out in: where the verb sits, where the question word goes, how negation ' +
      'and subordination are built. Give a short sentence in the language, glossed word by word.',
  },
  {
    key: 'culturalSignificance',
    label: 'Cultural Significance',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.6,
    help:
      'What speaking it - or failing to - says about a person. Where it is required, forbidden or ' +
      'laughed at, who keeps it alive, and what is said in it that cannot be said elsewhere: oaths, ' +
      'rites, songs, law.',
  },
]
