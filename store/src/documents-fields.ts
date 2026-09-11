/**
 * The documents container's field spec.
 *
 * An article about a document, not the document. A charter's article says when
 * it was made, who wrote it and what it changed; quoting from it is optional,
 * and Key Passages is the one field that does.
 *
 * Original Date is the item's `beginDate`. What that date marks is deliberately
 * loose - written, published, or only found - because for a great many old
 * documents the moment one surfaced is the only moment anybody knows. The value
 * should say which. A document is not filed under a timeline, so an unreadable
 * year here warns about nothing and places nothing in the chronology.
 *
 * Several fields are things most documents do not have. A letter has no legal
 * force, a ledger has no public reception, and a great deal of old writing has
 * no author anyone can name. Those carry fill rates, so the world is not made
 * entirely of treaties signed by famous people.
 */
import type { FieldSpec } from './field-spec.ts'

export const DOCUMENT_FIELDS: FieldSpec[] = [
  {
    key: 'name',
    label: 'Name',
    kind: 'text',
    required: true,
    default: null,
    storeAs: 'name',
    help:
      'What the document is called by the people who refer to it, which is often not the title it ' +
      'was given.',
    examples: ['The Salt Charter', 'The Letter from the Quay', 'The Ledger of Weights'],
  },
  {
    key: 'description',
    label: 'Description',
    kind: 'longtext',
    required: false,
    default: null,
    storeAs: 'summary',
    help:
      'The opening paragraph: what the document is, who made it, and why it matters. Two to four ' +
      'sentences. Every other article shows this when the document is mentioned in passing, so it ' +
      'has to stand alone.',
  },
  {
    key: 'authors',
    label: 'Author(s)',
    kind: 'list',
    required: false,
    default: [],
    fillRate: 0.75,
    help:
      'Who wrote it, compiled it, or put their name to it - which are not always the same people. ' +
      'Name each as their article is titled and the reference will link itself. Blank means nobody ' +
      'knows, which is true of a great deal of old writing.',
  },
  {
    key: 'originalDate',
    label: 'Original Date',
    kind: 'text',
    required: false,
    default: null,
    storeAs: 'beginDate',
    help:
      'When the document enters the record: when it was written, published, or only found - and say ' +
      'which, because they can be centuries apart. In this universe’s calendar, with a year in it.',
    examples: ['Written 412', 'Published in the spring of 430', 'Found 1130'],
  },
  {
    key: 'location',
    label: 'Location',
    kind: 'text',
    required: false,
    default: null,
    help:
      'Where it was written, published, posted, or found - and say which. Name the place as its ' +
      'article is titled and the reference will link itself.',
    examples: ['Written at the customs house', 'Nailed to the chapel door', 'Found in a sealed jar'],
  },
  {
    key: 'relatedDocuments',
    label: 'Related Documents',
    kind: 'list',
    required: false,
    default: [],
    fillRate: 0.4,
    help: 'Documents it answers, amends, copies or replaces, and those written in reply to it.',
  },
  {
    key: 'purpose',
    label: 'Purpose',
    kind: 'longtext',
    required: false,
    default: null,
    help:
      'What it was for, as its authors meant it - to bind, to record, to persuade, to warn - and, ' +
      'where different, what it ended up being used for.',
  },
  {
    key: 'keyPassages',
    label: 'Key Passages',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.5,
    help:
      'Short excerpts in the document’s own voice, each with a word on why it matters. A few lines, ' +
      'not the text: the article is about the document, not a copy of it.',
  },
  {
    key: 'culturalImpact',
    label: 'Cultural Impact',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.5,
    help:
      'What it changed in how people speak, worship, celebrate or think of themselves, and among ' +
      'whom. Attitudes are rarely shared - say which groups hold them.',
  },
  {
    key: 'legalImpact',
    label: 'Legal Impact',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.35,
    help:
      'What it bound, granted, forbade or overturned, and who enforced it. Most documents never had ' +
      'the force of law - a letter, a ledger, a poem - and those have nothing here.',
  },
  {
    key: 'background',
    label: 'Background',
    kind: 'longtext',
    required: false,
    default: null,
    help:
      'The circumstances it was written in: what had happened, who needed it, and what it was ' +
      'answering.',
  },
  {
    key: 'history',
    label: 'History',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.6,
    help:
      'What happened to the document itself: copies, translations, amendments, losses, forgeries, ' +
      'and where it is now, if anyone knows. Name recorded events as their articles are titled.',
  },
  {
    key: 'publicReception',
    label: 'Public Reception',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.5,
    help:
      'How it was received when it became known, and by whom. A document kept private has no ' +
      'reception until someone found it, and that is worth saying.',
  },
  {
    key: 'legacy',
    label: 'Legacy',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.5,
    help: 'What it is remembered for, and by whom, long after it stopped mattering in its own day.',
  },
  {
    key: 'term',
    label: 'Term',
    kind: 'text',
    required: false,
    default: null,
    fillRate: 0.4,
    help:
      'How long what it said held, or how long its effect lasted. Blank for a document that never ' +
      'held anything in force.',
    examples: ['ninety-nine years', 'until the fall of the Ash Seat', 'never repealed'],
  },
]
