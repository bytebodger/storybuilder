/**
 * The tales container's field spec.
 *
 * The sparsest spec in the tool, and deliberately. Every other container
 * describes the world; this one holds the fiction written inside it, and a form
 * that interrogated a short story about its themes would be in the way.
 *
 * Title rather than Name. Nobody asks what a story is called by asking its
 * name. The item's name column is still what it feeds, so everything that finds
 * and titles an article works exactly as it does everywhere else.
 *
 * Standalone is the first `boolean` field in the tool, and the three fields
 * after it are the first to be [conditional](field-spec.ts): where a piece sits
 * in a longer work is not a question worth asking until somebody says it is
 * part of one.
 */
import type { FieldSpec } from './field-spec.ts'

export const TALE_FIELDS: FieldSpec[] = [
  {
    key: 'name',
    label: 'Title',
    kind: 'text',
    required: true,
    default: null,
    storeAs: 'name',
    help: 'The title of the story, as it would stand at the head of it.',
    examples: ['The Drowned Bell', 'The Quay at Night', 'An Account of the Salt Years'],
  },
  {
    key: 'standalone',
    label: 'Standalone?',
    kind: 'boolean',
    required: true,
    default: true,
    help:
      'On for a story meant to be read by itself - a short story. Off for one piece of something ' +
      'longer, which opens the three fields that say where in that longer work this piece sits.',
  },
  {
    key: 'parentTale',
    label: 'Parent Tale Container',
    kind: 'text',
    required: false,
    default: null,
    showWhen: { field: 'standalone', equals: false },
    help:
      'The larger work this belongs to: a tale that stands for the whole, with every chapter filed ' +
      'under it. Name it as its own article is titled and the reference will link itself.',
    examples: ['The Chronicles of Finrock'],
  },
  {
    key: 'previousTale',
    label: 'Previous Tale (Chapter)',
    kind: 'text',
    required: false,
    default: null,
    showWhen: { field: 'standalone', equals: false },
    help: 'The piece that comes before this one in the larger work. Blank if this is the first.',
  },
  {
    key: 'nextTale',
    label: 'Next Tale (Chapter)',
    kind: 'text',
    required: false,
    default: null,
    showWhen: { field: 'standalone', equals: false },
    help:
      'The piece that comes after this one. Blank if this is the last, or if it has not been written ' +
      'yet.',
  },
  {
    key: 'story',
    label: 'Story',
    kind: 'longtext',
    required: false,
    default: null,
    help:
      'The story itself. Anything it mentions that has an article of its own links to it, so a tale ' +
      'is also a record of what it touched. A long draft is easier to live with in the universe’s ' +
      'narrative/ files, with the tale here as the entry that points at it.',
  },
]
