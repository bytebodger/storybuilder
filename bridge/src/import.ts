/**
 * Shaping an import plan for review.
 *
 * A tier can offer thousands of candidates, and a flat list of thousands is not
 * a review - it is a wall that gets accepted wholesale or abandoned. So the plan
 * arrives grouped, and the group is where the decision is made: keep every
 * country, drop every river. Rows exist underneath for the audit, not for the
 * choosing.
 */
import { assess, countBy, type ImportCandidate, type ImportPlan, type Item } from '../../store/src/index.ts'

export interface PlanRequest {
  universe: string
  svgPath: string
  jsonPath: string
  tier: 0 | 1 | 2 | 3
  minPopulation?: number
  withProvinces?: boolean
  withMarkers?: boolean
}

export interface PlanGroup {
  /** Stable key: what the group is, in the terms the world will use. */
  key: string
  container: string
  kind?: string
  /** Where these came from in the export, for the label. */
  sourceType: string
  candidates: ImportCandidate[]
}

export interface GroupedPlan {
  groups: PlanGroup[]
  /** Candidates the universe already has. Reported, never offered. */
  alreadyPresent: { name: string; matched: string }[]
  /** How the plan sits against what the universe already holds. */
  delta: {
    new: number
    update: number
    unchanged: number
    edited: number
    authored: number
    /** Articles a previous import made that this export no longer mentions. */
    missing: string[]
  }
  counts: ImportPlan['counts']
  warnings: string[]
  total: number
}

export function groupPlan(plan: ImportPlan, existing: Item[]): GroupedPlan {
  const groups = new Map<string, PlanGroup>()
  const alreadyPresent: GroupedPlan['alreadyPresent'] = []

  /*
   * A re-import is a comparison, not a rebuild.
   *
   * Only what the universe does not already have, or no longer agrees with, is
   * offered. An article written since it was imported is left out of the review
   * entirely: the author has taken it over, and a checkbox suggesting otherwise
   * would be an invitation to lose their work.
   */
  const delta = assess(plan.candidates, existing)
  const verdicts = new Map(delta.assessments.map((a) => [a.candidate, a.verdict]))

  for (const candidate of plan.candidates) {
    const verdict = verdicts.get(candidate)
    if (verdict && verdict !== 'new' && verdict !== 'update') {
      const held = delta.assessments.find((a) => a.candidate === candidate)?.existing
      alreadyPresent.push({ name: candidate.name, matched: held?.name ?? candidate.name })
      continue
    }

    const key = `${candidate.container}/${candidate.kind ?? '-'}`
    const group = groups.get(key) ?? {
      key,
      container: candidate.container,
      kind: candidate.kind,
      sourceType: candidate.sourceType,
      candidates: [],
    }
    group.candidates.push(candidate)
    groups.set(key, group)
  }

  // By container first, so everything that will land in one section of the nav
  // sits together, and biggest-first inside it, so the costly decision in each
  // section is the one on top.
  const ordered = [...groups.values()].sort(
    (a, b) =>
      a.container.localeCompare(b.container) ||
      b.candidates.length - a.candidates.length ||
      a.key.localeCompare(b.key),
  )
  for (const g of ordered) g.candidates.sort((a, b) => a.name.localeCompare(b.name))

  return {
    groups: ordered,
    alreadyPresent,
    delta: { ...countBy(delta), missing: delta.missing.map((m) => m.name) },
    counts: plan.counts,
    warnings: plan.warnings,
    total: ordered.reduce((n, g) => n + g.candidates.length, 0),
  }
}
