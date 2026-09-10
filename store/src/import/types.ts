/**
 * Importing a generated world.
 *
 * An adapter turns some external file into candidates; nothing here writes to
 * the store. Candidates go through the same screening a stub proposal does, so
 * an import can be run twice, or run after hand-authoring, without duplicating
 * anything.
 */

/**
 * How much of a generated world to bring in.
 *
 * A map generator will happily produce thousands of named things, and importing
 * all of them buries the handful that carry a story. Tiers exist so the author
 * chooses the grain, and can come back for more later - a second import dedups
 * against the first.
 */
export type Tier = 0 | 1 | 2 | 3

export const TIERS: Record<Tier, { label: string; description: string }> = {
  0: {
    label: 'Hand-added labels',
    description:
      'Names the author placed on the map themselves. Always imported, at every tier: a generator ' +
      'made everything else, and nothing but this file will ever recover these.',
  },
  1: {
    label: 'The spine',
    description: 'Countries, their capitals, peoples, faiths, named roads, and recorded events.',
  },
  2: {
    label: 'Navigable',
    description: 'Adds ports and settlements above a population threshold.',
  },
  3: {
    label: 'Everything',
    description: 'Adds every remaining settlement, river and lake.',
  },
}

export interface ImportCandidate {
  name: string
  container: string
  kind?: string
  tier: Tier
  /**
   * Names of the articles this one could sit inside, most specific first.
   *
   * A chain rather than one name, because which parent exists depends on the
   * tier: a capital sits in a province, but at tier 1 no provinces are imported
   * and its country is the right parent. Whichever is present wins.
   */
  parentNames?: string[]
  /**
   * Links to peers rather than parents - one country bordering another.
   *
   * Separate from `parentNames` because these are not containment and have no
   * preference order: every one of them is written, and each carries a role so
   * the relationship reads the same from both ends.
   */
  relations?: { name: string; role?: string; reverseRole?: string }[]
  summary?: string
  attributes?: Record<string, unknown>
  /** Which file it came from, and what it was there. Shown in review. */
  source: 'svg' | 'json'
  sourceType: string
}

export interface ImportPlan {
  /** In dependency order: parents before the things that name them. */
  candidates: ImportCandidate[]
  /** Per source type, how many were found and how many the tier admits. */
  counts: { sourceType: string; container: string; found: number; included: number }[]
  warnings: string[]
}
