/**
 * The container catalog.
 *
 * Containers are declared rather than discovered, because the navigation has to
 * show a section before anything is in it - an empty "Fauna" the author can
 * click into is the prompt to write the first one. `JsonFileStore.containers()`
 * still reports only what exists on disk; this is the list of what may.
 *
 * Every container except `tales` holds reference articles: wiki entries about
 * the world, which can be vivid but have no plot, no characters developing, and
 * no rising action. `tales` is where in-universe fiction itself lives.
 */
export interface ContainerType {
  /** Directory and file name. Plural, kebab-case. */
  key: string
  /** Navigation label. */
  label: string
  /** Singular noun for one entry, used in prose and refusals. */
  singular: string
  description: string
  /** True for containers holding fiction rather than reference articles. */
  narrative?: boolean
  /** Common subtypes. Advisory - `kind` is free-form, and this list is not a menu. */
  kinds?: string[]
}

export const CONTAINER_TYPES: ContainerType[] = [
  {
    key: 'people',
    label: 'People',
    singular: 'person',
    description: 'Major characters at any point in the canonical timeline.',
  },
  {
    key: 'cosmology',
    label: 'Cosmology',
    singular: 'celestial body',
    description:
      'Celestial bodies and the sky as the world sees it: stars, planets, moons, constellations, ' +
      'comets. A recurring event in the sky belongs in Phenomena; this is for the bodies themselves.',
    kinds: ['star', 'planet', 'moon', 'constellation', 'comet', 'ring'],
  },
  {
    key: 'locations',
    label: 'Locations',
    singular: 'location',
    description:
      'Inhabited or bounded places: a city, a district within a city, a country, a region, a ' +
      'battlefield. Physical features belong in Geography instead.',
    kinds: ['planet', 'country', 'region', 'city', 'district', 'settlement', 'site'],
  },
  {
    key: 'geography',
    label: 'Geography',
    singular: 'geographic feature',
    description:
      'Physical features, broad or narrow: mountain ranges and single mountains, forests, valleys, ' +
      'bays, lakes, oceans, rivers, cave systems, cliffs, waterfalls, islands, archipelagos, ' +
      'peninsulas, plains, straits, jungles, glaciers.',
    kinds: ['continent', 'ocean', 'sea', 'river', 'lake', 'mountain-range', 'forest', 'island', 'desert'],
  },
  {
    key: 'roads',
    label: 'Roads',
    singular: 'road',
    description:
      'Key roads, passes and paths. Not necessarily large ones - a mountain pass that controls a ' +
      'region’s commerce earns an article on strategic grounds alone.',
  },
  {
    key: 'institutions',
    label: 'Institutions',
    singular: 'institution',
    description:
      'From formal hierarchies with physical infrastructure - governments, bureaucracies - to ' +
      'decentralised or ad hoc bodies: guilds, secret societies, fraternities.',
  },
  {
    key: 'ethnicities',
    label: 'Ethnicities',
    singular: 'ethnicity',
    description:
      'Broadly defined. Includes what we would call race, and also self-defined groups that are ' +
      'genetically indistinct from their neighbours but hold distinct traditions. Ethnic groups ' +
      'rarely sit cleanly inside one country, and do not always share a language.',
  },
  {
    key: 'languages',
    label: 'Languages',
    singular: 'language',
    description:
      'Major languages: who speaks them, where, their written and spoken characteristics, and ' +
      'their lineage.',
  },
  {
    key: 'theology',
    label: 'Theology',
    singular: 'theology entry',
    description: 'Religions and cults of any size, and also individual deities, doctrines and dogmas.',
    kinds: ['religion', 'cult', 'deity', 'doctrine'],
  },
  {
    key: 'traditions',
    label: 'Traditions',
    singular: 'tradition',
    description:
      'Regularly observed ceremonies, past or present: public festivals, coronation rites, ' +
      'religious observances, superstitious rituals.',
  },
  {
    key: 'history',
    label: 'History',
    singular: 'historical event',
    description:
      'Distinct events in the timeline. The Battle of Silverfield, the fall of an empire, a ' +
      'coronation, the destruction of a landmark.',
  },
  {
    key: 'legends',
    label: 'Legends',
    singular: 'legend',
    description:
      'In-universe myths and legends, past or current. They may rest on the real history of the ' +
      'universe or be entirely invented within it.',
  },
  {
    key: 'documents',
    label: 'Documents',
    singular: 'document',
    description:
      'In-universe documents - a charter, a treaty, a declaration. The article is chiefly about the ' +
      'document: when it was made, who wrote it, what it changed. Quoting from it is optional.',
  },
  {
    key: 'fauna',
    label: 'Fauna',
    singular: 'creature',
    description:
      'Creatures distinctive enough to warrant their own article. An ice dragon, not a squirrel.',
  },
  {
    key: 'flora',
    label: 'Flora',
    singular: 'plant',
    description:
      'Plants distinctive enough to warrant their own article. Witch’s Bane Nettle, not corn.',
  },
  {
    key: 'afflictions',
    label: 'Afflictions',
    singular: 'affliction',
    description:
      'Broadly defined: a disease, a mental disorder particular to this world, or a generational ' +
      'curse laid on a whole people.',
  },
  {
    key: 'phenomena',
    label: 'Phenomena',
    singular: 'phenomenon',
    description:
      'Natural or supernatural occurrences. A whirlpool that never dissipates; a festival where the ' +
      'sky sometimes answers.',
  },
  {
    key: 'terminology',
    label: 'Terminology',
    singular: 'term',
    description:
      'Terms particular to this universe - what the locals call the swamps they live beside.',
  },
  {
    key: 'tales',
    label: 'Tales',
    singular: 'tale',
    description:
      'Works of in-universe fiction: short stories, and eventually novels. The only container that ' +
      'holds narrative rather than reference.',
    narrative: true,
  },
]

export const containerType = (key: string) => CONTAINER_TYPES.find((c) => c.key === key)

/** Label for a container, falling back to the raw key for anything unregistered. */
export const containerLabel = (key: string) => containerType(key)?.label ?? key
