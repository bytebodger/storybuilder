/**
 * Shaping an import plan for review.
 *
 * A tier can offer thousands of candidates, and a flat list of thousands is not
 * a review - it is a wall that gets accepted wholesale or abandoned. So the plan
 * arrives grouped, and the group is where the decision is made: keep every
 * country, drop every river. Rows exist underneath for the audit, not for the
 * choosing.
 */
import { matchTerm, type ImportCandidate, type ImportPlan, type Item } from '../../store/src/index.ts'

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
  counts: ImportPlan['counts']
  warnings: string[]
  total: number
}

export function groupPlan(plan: ImportPlan, existing: Item[]): GroupedPlan {
  const groups = new Map<string, PlanGroup>()
  const alreadyPresent: GroupedPlan['alreadyPresent'] = []

  for (const candidate of plan.candidates) {
    // Screened the same way a stub proposal is, so an import can be re-run, or
    // run after hand-authoring, without duplicating anything.
    const [match] = matchTerm(candidate.name, existing)
    if (match) {
      alreadyPresent.push({ name: candidate.name, matched: match.item.name })
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
    counts: plan.counts,
    warnings: plan.warnings,
    total: ordered.reduce((n, g) => n + g.candidates.length, 0),
  }
}
