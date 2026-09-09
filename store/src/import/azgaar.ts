/**
 * Turning an Azgaar Fantasy Map Generator export into import candidates.
 *
 * Two files, and both are needed. The JSON holds everything the generator made
 * - states, provinces, settlements, rivers, sites - with a complete hierarchy.
 * The SVG holds the labels the author added by hand, which appear in no other
 * file. Neither is a superset of the other.
 */
import { readAddedLabels, guessGeographyKind } from './azgaar-svg.ts'
import type { ImportCandidate, ImportPlan, Tier } from './types.ts'

/** Placeholders the generator uses for "none of the above". Never articles. */
const NOT_REAL = new Set(['neutrals', 'wildlands', 'no religion', 'unnamed route segment'])

/** Where a marked site belongs. Anything unlisted becomes a location. */
const MARKER_CONTAINERS: Record<string, [string, string]> = {
  battlefields: ['history', 'battle'],
  volcanoes: ['geography', 'volcano'],
  caves: ['geography', 'cave'],
  'hot-springs': ['geography', 'hot-spring'],
  waterfalls: ['geography', 'waterfall'],
  'water-sources': ['geography', 'spring'],
  'sacred-forests': ['geography', 'forest'],
  'sacred-pineries': ['geography', 'forest'],
  'hill-monsters': ['fauna', 'monster'],
  'lake-monsters': ['fauna', 'monster'],
  'sea-monsters': ['fauna', 'monster'],
  encounters: ['phenomena', 'encounter'],
  migration: ['phenomena', 'migration'],
  pirates: ['institutions', 'band'],
  brigands: ['institutions', 'band'],
  circuses: ['traditions', 'festival'],
  fairs: ['traditions', 'fair'],
  jousts: ['traditions', 'tournament'],
  dances: ['traditions', 'festival'],
  party: ['traditions', 'festival'],
  libraries: ['institutions', 'library'],
}

interface Azgaar {
  info?: { mapName?: string; width?: number; height?: number }
  settings?: { populationRate?: number }
  pack?: Record<string, unknown[]>
}

type Row = Record<string, unknown>
const rows = (v: unknown): Row[] => (Array.isArray(v) ? (v.filter((x) => x && typeof x === 'object') as Row[]) : [])
const nameOf = (r: Row) => String(r.name ?? '').trim()
const fullNameOf = (r: Row) => String(r.fullName ?? r.name ?? '').trim()
const usable = (r: Row) => !!nameOf(r) && !NOT_REAL.has(nameOf(r).toLowerCase())

export interface BuildOptions {
  tier: Tier
  /** Settlements at or above this population are worth an article at tier 2. */
  minPopulation?: number
}

export function buildImportPlan(json: Azgaar, svg: string, options: BuildOptions): ImportPlan {
  const { tier, minPopulation = 1000 } = options
  const pack = json.pack ?? {}
  const rate = json.settings?.populationRate ?? 1000
  const candidates: ImportCandidate[] = []
  const counts: ImportPlan['counts'] = []
  const warnings: string[] = []

  const tally = (sourceType: string, container: string, found: number, included: number) =>
    counts.push({ sourceType, container, found, included })

  const admit = (at: Tier) => tier >= at

  const states = rows(pack.states)
  const provinces = rows(pack.provinces)
  const burgs = rows(pack.burgs)
  const cells = rows(pack.cells)

  const stateName = new Map(states.filter(usable).map((s) => [s.i as number, nameOf(s)]))
  const provinceName = new Map(provinces.filter(usable).map((p) => [p.i as number, fullNameOf(p)]))
  const cellById = new Map(cells.map((c) => [c.i as number, c]))

  // --- tier 0: the author's own labels, always -----------------------------

  const added = readAddedLabels(svg)
  for (const label of added) {
    const cell = nearestCell(cells, label.x, label.y)
    const parent = chain(cell, provinceName, stateName)
    candidates.push({
      name: label.name,
      container: 'geography',
      kind: guessGeographyKind(label.name),
      tier: 0,
      parentNames: parent,
      source: 'svg',
      sourceType: 'hand-added label',
      attributes: { mapPosition: `${Math.round(label.x)}, ${Math.round(label.y)}` },
    })
  }
  tally('hand-added label', 'geography', added.length, added.length)
  if (added.length === 0) {
    warnings.push('No hand-added labels found in the SVG. If you placed any, check the export included them.')
  }

  // --- tier 1: the spine ---------------------------------------------------

  const realStates = states.filter(usable)
  for (const s of realStates) {
    if (!admit(1)) break
    candidates.push({
      name: nameOf(s),
      container: 'locations',
      kind: 'country',
      tier: 1,
      summary: summarise([
        s.form ? `A ${String(s.form).toLowerCase()}` : 'A country',
        s.area ? `covering ${Number(s.area).toLocaleString()} square units` : '',
      ]),
      attributes: {
        population: s.urban || s.rural ? Math.round((Number(s.urban ?? 0) + Number(s.rural ?? 0)) * rate) : undefined,
        governmentForm: s.form,
      },
      source: 'json',
      sourceType: 'state',
    })
  }
  tally('state', 'locations', realStates.length, admit(1) ? realStates.length : 0)

  for (const [key, container, at] of [
    ['cultures', 'ethnicities', 1],
    ['religions', 'theology', 1],
    ['zones', 'history', 1],
    ['routes', 'roads', 1],
  ] as [string, string, Tier][]) {
    const found = rows(pack[key]).filter(usable)
    for (const r of found) {
      if (!admit(at)) break
      candidates.push({
        name: nameOf(r),
        container,
        kind: typeof r.type === 'string' ? String(r.type).toLowerCase() : undefined,
        tier: at,
        source: 'json',
        sourceType: key.replace(/s$/, ''),
      })
    }
    tally(key.replace(/s$/, ''), container, found.length, admit(at) ? found.length : 0)
  }

  addSettlements({ burgs, provinces, cellById, provinceName, stateName, rate, tier, minPopulation, candidates, tally })
  addGeography({ pack, tier, candidates, tally, rate, cellById, provinceName, stateName })

  candidates.sort((a, b) => order(a) - order(b))
  return { candidates, counts, warnings }
}

/** Parents first, so a child can name something that already exists. */
const RANK = ['state', 'province', 'hand-added label', 'culture', 'religion']
const order = (c: ImportCandidate) => {
  const at = RANK.indexOf(c.sourceType)
  return at === -1 ? RANK.length : at
}

/**
 * Province then country: the most specific parent first, both offered.
 *
 * `self` is excluded because Azgaar names a province after its capital, so a
 * capital's own name is frequently the first link in its own parent chain.
 */
function chain(
  cell: Row | undefined,
  provinces: Map<number, string>,
  states: Map<number, string>,
  self?: string,
): string[] {
  if (!cell) return []
  return [provinces.get(cell.province as number), states.get(cell.state as number)].filter(
    (n): n is string => !!n && n.toLowerCase() !== self?.toLowerCase(),
  )
}

function nearestCell(cells: Row[], x: number, y: number): Row | undefined {
  let best: Row | undefined
  let bestDist = Infinity
  for (const c of cells) {
    const p = c.p
    if (!Array.isArray(p) || p.length < 2) continue
    const d = (Number(p[0]) - x) ** 2 + (Number(p[1]) - y) ** 2
    if (d < bestDist) {
      bestDist = d
      best = c
    }
  }
  return best
}

const summarise = (parts: string[]) => parts.filter(Boolean).join(', ') + '.'

interface SectionArgs {
  burgs: Row[]
  provinces: Row[]
  cellById: Map<number, Row>
  provinceName: Map<number, string>
  stateName: Map<number, string>
  rate: number
  tier: Tier
  minPopulation: number
  candidates: ImportCandidate[]
  tally: (sourceType: string, container: string, found: number, included: number) => void
}

/**
 * Settlements, and the provinces they sit in.
 *
 * Every burg resolves to a province through its cell, and every province to a
 * state, so the whole chain - country, province, town - is known rather than
 * guessed from coordinates.
 */
function addSettlements(a: SectionArgs): void {
  const { burgs, provinces, cellById, provinceName, stateName, rate, tier, minPopulation, candidates, tally } = a
  const real = burgs.filter(usable)

  const capitals = real.filter((b) => b.capital)
  const included = tier >= 3 ? real : tier >= 2 ? real.filter(worthIt) : tier >= 1 ? capitals : []

  function worthIt(b: Row): boolean {
    return !!b.capital || !!b.port || Number(b.population ?? 0) * rate >= minPopulation
  }

  for (const b of included) {
    const cell = cellById.get(b.cell as number)
    const population = Math.round(Number(b.population ?? 0) * rate)
    candidates.push({
      name: nameOf(b),
      container: 'locations',
      kind: b.capital ? 'city' : population >= minPopulation ? 'town' : 'village',
      tier: b.capital ? 1 : worthIt(b) ? 2 : 3,
      parentNames: chain(cell, provinceName, stateName, nameOf(b)),
      summary: summarise([
        b.capital ? 'The capital' : 'A settlement',
        cell ? `in ${stateName.get(cell.state as number) ?? 'the wildlands'}` : '',
        b.port ? 'with a working harbour' : '',
      ]),
      attributes: {
        population: population || undefined,
        port: b.port ? true : undefined,
        walls: b.walls ? true : undefined,
        citadel: b.citadel ? true : undefined,
        temple: b.temple ? true : undefined,
      },
      source: 'json',
      sourceType: 'burg',
    })
  }
  tally('burg', 'locations', real.length, included.length)

  // Provinces are the middle of the chain, and arrive with tier 2 - the point
  // at which their towns start coming in and need somewhere to belong.
  const realProvinces = provinces.filter(usable)
  if (tier >= 2) {
    for (const p of realProvinces) {
      candidates.push({
        // Under its full name - "Blandbury County", not "Blandbury".
        //
        // Azgaar names a province after its capital, so importing provinces by
        // bare name would give this world 100+ pairs of articles sharing a name,
        // one a town and one the region around it. Every cross-reference to
        // either would then be a coin toss.
        name: fullNameOf(p),
        container: 'locations',
        kind: 'province',
        tier: 2,
        parentNames: [stateName.get(p.state as number) ?? ''].filter(Boolean),
        source: 'json',
        sourceType: 'province',
      })
    }
  }
  tally('province', 'locations', realProvinces.length, tier >= 2 ? realProvinces.length : 0)
  tally('capital', 'locations', capitals.length, tier >= 1 ? capitals.length : 0)
}

interface GeoArgs {
  pack: Record<string, unknown[]>
  tier: Tier
  candidates: ImportCandidate[]
  tally: SectionArgs['tally']
  rate: number
  cellById: Map<number, Row>
  provinceName: Map<number, string>
  stateName: Map<number, string>
}

/** Rivers, lakes, and the marked sites scattered over the map. */
function addGeography(a: GeoArgs): void {
  const { pack, tier, candidates, tally, cellById, provinceName, stateName } = a

  const rivers = rows(pack.rivers).filter(usable)
  if (tier >= 3) {
    for (const r of rivers) {
      candidates.push({
        name: nameOf(r),
        container: 'geography',
        kind: 'river',
        tier: 3,
        attributes: { length: r.length, discharge: r.discharge },
        source: 'json',
        sourceType: 'river',
      })
    }
  }
  tally('river', 'geography', rivers.length, tier >= 3 ? rivers.length : 0)

  const lakes = rows(pack.features).filter((f) => usable(f) && f.type === 'lake')
  if (tier >= 3) {
    for (const f of lakes) {
      candidates.push({
        name: nameOf(f),
        container: 'geography',
        kind: 'lake',
        tier: 3,
        summary: f.subtype ? `A ${String(f.subtype)} lake.` : undefined,
        source: 'json',
        sourceType: 'lake',
      })
    }
  }
  tally('lake', 'geography', lakes.length, tier >= 3 ? lakes.length : 0)

  const markers = rows(pack.markers).filter(usable)
  if (tier >= 3) {
    for (const m of markers) {
      const [container, kind] = MARKER_CONTAINERS[String(m.type)] ?? ['locations', 'site']
      const cell = cellById.get(m.cell as number)
      candidates.push({
        name: nameOf(m),
        container,
        kind,
        tier: 3,
        // The note is real prose the generator already wrote - the only content
        // in the whole export that is not just a name.
        summary: typeof m.note === 'string' ? m.note : undefined,
        parentNames: chain(cell, provinceName, stateName, nameOf(m)),
        source: 'json',
        sourceType: 'marker',
      })
    }
  }
  tally('marker', 'various', markers.length, tier >= 3 ? markers.length : 0)
}
