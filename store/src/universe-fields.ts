/**
 * The universe container's field spec - the single source of truth for the
 * form, the generator, and the validator.
 *
 * The UI renders from this list, the bridge validates responses against it, and
 * the `universe-forge` skill is told what each field means by quoting `help`.
 * Three consumers, one definition: a field added here appears in the form, is
 * generatable, and is accepted on save, with nothing else to update.
 */
import type { FieldSpec } from './field-spec.ts'

/** Kept as an alias: the universe form was the first spec, and predates the shared type. */
export type UniverseField = FieldSpec

export const UNIVERSE_FIELDS: FieldSpec[] = [
  {
    key: 'name',
    label: 'Name',
    kind: 'text',
    required: true,
    default: null,
    help:
      'A label encompassing the entirety of any story told within this universe. It may be an ' +
      'in-universe name (the Exoria galaxy, the planet Farion V) or a meta name for the body of ' +
      'fiction itself - nowhere in Star Wars is anything called "Star Wars".',
    examples: ['Exoria', 'Farion V', 'The Ashfall Cycle'],
  },
  {
    key: 'totalYears',
    label: 'Total years',
    kind: 'number',
    required: false,
    default: 1000,
    help:
      'How many years the entire canon spans. Year 0 is the beginning; this number is the most ' +
      'recent year. It is not a naturalistic age - a planet may be billions of years old while its ' +
      'canon covers 100. It does not constrain when stories are set: a 1000-year universe can be ' +
      'written about entirely in Year 250.',
    examples: ['1000', '100', '12000'],
  },
  {
    key: 'genres',
    label: 'Genre(s)',
    kind: 'list',
    required: false,
    default: [],
    help: 'Informs how narrative feels. High fantasy reads nothing like dark cyberpunk.',
    examples: ['high fantasy', 'dark cyberpunk', 'space opera', 'gothic horror'],
  },
  {
    key: 'tone',
    label: 'Tone',
    kind: 'text',
    required: false,
    default: null,
    help: 'The emotional register narrative should carry.',
    examples: ['apocalyptic', 'whimsical', 'dystopian', 'Kafkaesque', 'heroic', 'historical epic'],
  },
  {
    key: 'themes',
    label: 'Recurring theme(s)',
    kind: 'list',
    required: false,
    default: [],
    help: 'The preoccupations stories in this universe keep returning to.',
    examples: [
      'the tension between technological advance and the conservation of nature',
      'the folly of unbridled ambition',
      'a formerly great society fighting its slide toward irrelevance',
      'the struggle for dominance between multiple intelligent species',
      'the quest to recover lost knowledge',
    ],
  },
  {
    key: 'scale',
    label: 'Scale',
    kind: 'text',
    required: false,
    default: null,
    help: 'The scope the canon operates at.',
    examples: ['galactic', 'planetary', 'kingdom', 'society', 'island', 'continent'],
  },
  {
    key: 'naturalLaws',
    label: 'Natural laws',
    kind: 'longtext',
    required: false,
    default: null,
    help:
      'The unusual ground rules. Does magic exist? Is the world dominated by megafauna, or by ' +
      'advanced technology? Do deities intervene? Do any peoples have supernatural abilities?',
  },
  {
    key: 'origins',
    label: 'Origins',
    kind: 'longtext',
    required: false,
    default: null,
    help: 'Anything that should be known about how the universe itself came into being.',
  },
  {
    key: 'geography',
    label: 'Geography',
    kind: 'longtext',
    required: false,
    default: null,
    help:
      'Dominant features of the physical environment. Largely underwater, or in the clouds? ' +
      'Exceptionally mountainous? Vast underground caverns? Unusually wet, hot, or dry?',
  },
  {
    key: 'cultures',
    label: 'Culture(s)',
    kind: 'longtext',
    required: false,
    default: null,
    help:
      'One global place for the overriding features of the cultures that hold the most sway. Not ' +
      'the detail - that belongs to the cultures recorded in the store.',
  },
  {
    key: 'inspiration',
    label: 'Inspiration',
    kind: 'list',
    required: false,
    default: [],
    help: 'Real-world works whose influence should be felt: films, series, books, authors, franchises.',
    examples: ['Game of Thrones', 'Star Wars', 'Marvel', 'Philip K. Dick'],
  },
]

export const universeField = (key: string) => UNIVERSE_FIELDS.find((f) => f.key === key)
