/**
 * Turning an Azgaar Fantasy Map Generator export into import candidates.
 *
 * Two files, and both are needed. The JSON holds everything the generator made
 * - states, provinces, settlements, rivers, sites - with a complete hierarchy.
 * The SVG holds the labels the author added by hand, which appear in no other
 * file. Neither is a superset of the other.
 */
import { readAddedLabels, guessGeographyKind } from './azgaar-svg.ts'
import { normalizeTerm } from '../terms.ts'
import { readStateGeography, statesAlong, statesUnder, type StateGeography } from './azgaar-geo.ts'
import { boxOf, frameBox, gridSampler, growToShore, pad } from './crop.ts'
import { frameToAttribute } from './media.ts'
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

/**
 * Where a zone belongs.
 *
 * Azgaar's zones are mostly things that happened - an invasion, a crusade, a
 * flood - and those are history. A fault is not: it is a feature of the ground
 * that will still be there when the story is over.
 */
const ZONE_CONTAINERS: Record<string, [string, string]> = {
  fault: ['geography', 'fault'],
}

interface Azgaar {
  info?: { mapName?: string; width?: number; height?: number }
  settings?: { populationRate?: number }
  mapCoordinates?: { latN?: number; latS?: number; lonW?: number; lonE?: number }
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
  /**
   * Import the generator's provinces as articles. Off by default.
   *
   * Azgaar produces an administrative layer whether or not anyone asked for it,
   * and a province is rarely a thing a story names: everyone knows Mos Eisley is
   * a city on Tatooine, and nobody knows or cares which province it is in.
   * Leaving them out also shortens every settlement's parentage to the country,
   * which is the relationship a reader actually holds in mind.
   */
  withProvinces?: boolean
  /**
   * Import the generator's map markers as articles. Off by default.
   *
   * Markers are prompts for a game master rather than facts about a world -
   * nearly half of them repeat verbatim, and the ones that do not are mostly
   * scenery with a label. A world is not richer for 224 articles about jetties
   * and columns, and the nav is measurably worse.
   */
  withMarkers?: boolean
}

export function buildImportPlan(json: Azgaar, svg: string, options: BuildOptions): ImportPlan {
  const { tier, minPopulation = 1000, withProvinces = false, withMarkers = false } = options
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

  const canvas = { width: json.info?.width ?? 0, height: json.info?.height ?? 0 }
  const grid = (json as { grid?: { cells?: Row[]; spacing?: number; cellsX?: number } }).grid ?? {}
  const isLand = gridSampler(
    (grid.cells ?? []).map((c) => Number(c?.h ?? 0)),
    { spacing: Number(grid.spacing ?? 1), cellsX: Number(grid.cellsX ?? 1) },
  )

  const added = readAddedLabels(svg)
  for (const label of added) {
    // The whole curve, not its midpoint: a range labelled across a border
    // belongs to both countries, and the label's own path says which.
    const crossed = statesUnder(label.points.length ? label.points : [label], cells, stateName)
    candidates.push({
      name: label.name,
      container: 'geography',
      kind: guessGeographyKind(label.name),
      tier: 0,
      relations: crossed.map((name) => ({ name, role: 'crosses', reverseRole: 'crossed by' })),
      source: 'svg',
      sourceType: 'hand-added label',
      attributes: {
        mapPosition: `${Math.round(label.x)}, ${Math.round(label.y)}`,
        ...(crossed.length ? { spans: crossed } : {}),
        ...(canvas.width ? { mapFrame: frameToAttribute(labelFrame(label, isLand, canvas)) } : {}),
      },
    })
  }
  tally('hand-added label', 'geography', added.length, added.length)
  if (added.length === 0) {
    warnings.push('No hand-added labels found in the SVG. If you placed any, check the export included them.')
  }

  // --- tier 1: the spine ---------------------------------------------------

  const geography = readStateGeography(
    cells,
    burgs,
    new Map(rows(pack.features).map((f) => [f.i as number, f])),
    {
      latN: json.mapCoordinates?.latN ?? 90,
      latS: json.mapCoordinates?.latS ?? -90,
      lonW: json.mapCoordinates?.lonW ?? -180,
      lonE: json.mapCoordinates?.lonE ?? 180,
    },
    { width: json.info?.width ?? 1, height: json.info?.height ?? 1 },
  )

  const realStates = states.filter(usable)
  for (const s of realStates) {
    if (!admit(1)) break
    const geo = geography.get(s.i as number)
    candidates.push({
      name: nameOf(s),
      container: 'locations',
      kind: 'country',
      tier: 1,
      // Borders are the one relationship the export states outright, and the
      // one a reader asks about first: who is next to whom.
      relations: (Array.isArray(s.neighbors) ? (s.neighbors as number[]) : [])
        .map((n) => stateName.get(n))
        .filter((n): n is string => !!n)
        .map((name) => ({ name, role: 'borders', reverseRole: 'borders' })),
      summary: summarise([
        s.form ? `A ${String(s.form).toLowerCase()}` : 'A country',
        s.area ? `covering ${Number(s.area).toLocaleString()} square units` : '',
        geo ? waterPhrase(geo) : '',
      ]),
      attributes: {
        population: s.urban || s.rural ? Math.round((Number(s.urban ?? 0) + Number(s.rural ?? 0)) * rate) : undefined,
        governmentForm: s.form,
        ...(geo
          ? {
              // The window onto the map this country occupies. Stored rather
              // than rendered: a crop is a change of view, so fourteen country
              // maps would be fourteen copies of one drawing.
              mapFrame: frameToAttribute(pad(geo.boundsPx, 0.08, canvas)),
              coast: geo.coast,
              seaPorts: geo.seaPorts || undefined,
              lakePorts: geo.lakePorts || undefined,
              riverPorts: geo.riverPorts || undefined,
              bounds: geo.bounds,
            }
          : {}),
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
      // Azgaar's culture "type" describes how a culture spread across terrain
      // while the map was generated - Naval cultures hug coasts, Nomadic ones
      // roam. That is a fact about the simulation, not about the people, and
      // carrying it in would split one section into four meaningless ones.
      const kind =
        key === 'cultures' || typeof r.type !== 'string' ? undefined : String(r.type).toLowerCase()
      const override = key === 'zones' && kind ? ZONE_CONTAINERS[kind] : undefined
      candidates.push({
        name: nameOf(r),
        container: override?.[0] ?? container,
        kind: override?.[1] ?? kind,
        tier: at,
        source: 'json',
        sourceType: key.replace(/s$/, ''),
      })
    }
    tally(key.replace(/s$/, ''), container, found.length, admit(at) ? found.length : 0)
  }

  addSettlements({ burgs, provinces, cellById, provinceName, stateName, rate, tier, minPopulation, withProvinces, candidates, tally })
  addGeography({
    pack,
    tier,
    withMarkers,
    candidates,
    tally,
    rate,
    cellById,
    provinceName,
    stateName,
    canvas,
  })

  candidates.sort((a, b) => order(a) - order(b))

  const qualified = disambiguate(candidates)
  if (qualified) {
    warnings.push(
      `${qualified} name(s) were reused across the map and have been qualified by country, ` +
        'e.g. "Betford (Brandlemar)". Two articles sharing a name would make every reference to ' +
        'either one a coin toss.',
    )
  }
  return { candidates, counts, warnings }
}

/**
 * Give every candidate a name no other candidate answers to.
 *
 * A generated world reuses settlement names freely - this one has seven Uxbrids
 * - and two articles with one name break every cross-reference to either, since
 * the linker has no way to choose. Qualifying by country is what a real
 * gazetteer does: Springfield, Illinois and Springfield, Massachusetts.
 *
 * All members of a clash are qualified, not just the later ones. Leaving the
 * first bare would make a bare mention resolve to whichever happened to be
 * imported first, which is arbitrary dressed up as certain.
 */
function disambiguate(candidates: ImportCandidate[]): number {
  const groups = new Map<string, ImportCandidate[]>()
  for (const c of candidates) {
    const key = normalizeTerm(c.name)
    if (!key) continue
    groups.set(key, [...(groups.get(key) ?? []), c])
  }

  let qualified = 0
  const renamed = new Map<string, string>()

  for (const group of groups.values()) {
    if (group.length < 2) continue
    const used = new Set<string>()
    for (const c of group) {
      const country = c.parentNames?.[c.parentNames.length - 1]
      let name = country ? `${c.name} (${country})` : c.name
      // Two of a name inside one country still need telling apart.
      if (used.has(normalizeTerm(name))) {
        let n = 2
        while (used.has(normalizeTerm(`${name} ${n}`))) n++
        name = `${name} ${n}`
      }
      used.add(normalizeTerm(name))
      if (name !== c.name) {
        renamed.set(normalizeTerm(c.name), name)
        c.name = name
        qualified++
      }
    }
  }

  // Anything naming a renamed candidate as its parent has to follow it, or the
  // link would be looked up under a name that no longer exists.
  if (renamed.size) {
    for (const c of candidates) {
      if (!c.parentNames?.length) continue
      c.parentNames = c.parentNames.map((n) => renamed.get(normalizeTerm(n)) ?? n)
    }
  }
  return qualified
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

/**
 * The window onto the map for a hand-added label.
 *
 * A label over land names something with a shape - a range, a forest - and its
 * curve traces it, so the curve is the frame. A label over water names a stretch
 * of sea the generator has no object for, and the useful frame is the one that
 * reaches its shores. Which it is comes from the map rather than from the words:
 * the points of the curve are sampled, and the majority decides.
 */
function labelFrame(
  label: { x: number; y: number; points: { x: number; y: number }[] },
  isLand: (x: number, y: number) => boolean,
  canvas: { width: number; height: number },
) {
  const points = label.points.length ? label.points : [label]
  const overLand = points.filter((p) => isLand(p.x, p.y)).length
  const box = boxOf(points)

  if (overLand * 2 >= points.length) return frameBox(box, canvas)
  return frameBox(growToShore(box, isLand, canvas).box, canvas, { pad: 0.04 })
}

/** The window onto a run of cells - a river's course. */
function courseFrame(
  cellIds: unknown,
  byId: Map<number, Row>,
  canvas: { width: number; height: number },
): { mapFrame: string } | null {
  // A river lists the cells it runs through; a feature stores only how many it
  // has. The shape is checked rather than assumed.
  if (!Array.isArray(cellIds)) return null
  return pointsFrame(
    cellIds
      .map((id) => byId.get(id)?.p)
      .filter((p): p is number[] => Array.isArray(p) && p.length >= 2)
      .map((p) => ({ x: Number(p[0]), y: Number(p[1]) })),
    canvas,
  )
}

/** The window onto anything with a scatter of points on the canvas. */
function pointsFrame(
  points: { x: number; y: number }[] | undefined,
  canvas: { width: number; height: number },
): { mapFrame: string } | null {
  if (!canvas.width || !points?.length) return null
  return { mapFrame: frameToAttribute(frameBox(boxOf(points), canvas)) }
}

const summarise = (parts: string[]) => parts.filter(Boolean).join(', ') + '.'

/**
 * How a country reaches water, in a clause.
 *
 * Landlocked and portless are different claims, and conflating them is what
 * would put New Orleans on the coast or take its harbour away.
 */
function waterPhrase(g: StateGeography): string {
  if (g.coast === 'sea') return g.seaPorts ? `with ${g.seaPorts} sea port(s)` : 'on the coast'
  const inland = [
    g.riverPorts ? `${g.riverPorts} river port(s)` : '',
    g.lakePorts ? `${g.lakePorts} lake port(s)` : '',
  ].filter(Boolean)
  if (!inland.length) return g.coast === 'lake' ? 'landlocked, on a lake shore' : 'landlocked'
  return `landlocked but reached by water, with ${inland.join(' and ')}`
}

interface SectionArgs {
  burgs: Row[]
  provinces: Row[]
  cellById: Map<number, Row>
  provinceName: Map<number, string>
  stateName: Map<number, string>
  rate: number
  tier: Tier
  minPopulation: number
  withProvinces: boolean
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
  const { burgs, provinces, cellById, provinceName, stateName, rate, tier, minPopulation, withProvinces, candidates, tally } = a
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

  // Only on request. Without them a settlement's parent falls through to its
  // country, which is the relationship worth recording.
  const realProvinces = provinces.filter(usable)
  if (withProvinces) {
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
  tally('province', 'locations', realProvinces.length, withProvinces ? realProvinces.length : 0)
  tally('capital', 'locations', capitals.length, tier >= 1 ? capitals.length : 0)
}

interface GeoArgs {
  pack: Record<string, unknown[]>
  tier: Tier
  withMarkers: boolean
  canvas: { width: number; height: number }
  candidates: ImportCandidate[]
  tally: SectionArgs['tally']
  rate: number
  cellById: Map<number, Row>
  provinceName: Map<number, string>
  stateName: Map<number, string>
}

/** Rivers, lakes, and the marked sites scattered over the map. */
function addGeography(a: GeoArgs): void {
  const { pack, tier, withMarkers, candidates, tally, cellById, provinceName, stateName, canvas } = a

  const rivers = rows(pack.rivers).filter(usable)
  const riverName = new Map(rivers.map((r) => [r.i as number, nameOf(r)]))
  if (tier >= 3) {
    for (const r of rivers) {
      const crossed = statesAlong((r.cells as number[]) ?? [], cellById, stateName)
      // A tributary names the river it joins. Azgaar marks a river as its own
      // parent when it has none, which is not a relationship.
      const parent = r.parent !== r.i ? riverName.get(r.parent as number) : undefined

      candidates.push({
        name: nameOf(r),
        container: 'geography',
        kind: 'river',
        tier: 3,
        relations: [
          ...crossed.map((name) => ({ name, role: 'flows through', reverseRole: 'watered by' })),
          ...(parent && parent !== nameOf(r)
            ? [{ name: parent, role: 'flows into', reverseRole: 'fed by' }]
            : []),
        ],
        summary: crossed.length > 1 ? `A river crossing ${crossed.join(', ')}.` : undefined,
        attributes: {
          length: r.length,
          discharge: r.discharge,
          ...(crossed.length ? { crosses: crossed } : {}),
          // A river's course is its extent: the cells it runs through.
          ...(courseFrame(r.cells, cellById, canvas) ?? {}),
        },
        source: 'json',
        sourceType: 'river',
      })
    }
  }
  tally('river', 'geography', rivers.length, tier >= 3 ? rivers.length : 0)

  /*
   * A feature records `cells` as a count, not a list - so its extent has to be
   * gathered from the other side, by asking which cells claim it. One pass, in
   * case a universe has many lakes.
   */
  const featurePoints = new Map<number, { x: number; y: number }[]>()
  for (const cell of cellById.values()) {
    const f = cell.f as number
    const p = cell.p
    if (f === undefined || !Array.isArray(p) || p.length < 2) continue
    const points = featurePoints.get(f) ?? []
    points.push({ x: Number(p[0]), y: Number(p[1]) })
    featurePoints.set(f, points)
  }

  const lakes = rows(pack.features).filter((f) => usable(f) && f.type === 'lake')
  if (tier >= 3) {
    for (const f of lakes) {
      candidates.push({
        name: nameOf(f),
        container: 'geography',
        kind: 'lake',
        tier: 3,
        summary: f.subtype ? `A ${String(f.subtype)} lake.` : undefined,
        attributes: pointsFrame(featurePoints.get(f.i as number), canvas) ?? undefined,
        source: 'json',
        sourceType: 'lake',
      })
    }
  }
  tally('lake', 'geography', lakes.length, tier >= 3 ? lakes.length : 0)

  /*
   * Only the marked sites that are actually places.
   *
   * Azgaar scatters prompts across the map as markers - 81 of them named
   * "Random encounter", 35 named "Dungeon", all carrying identical notes. They
   * are decoration for a game master, not entities in a world, and importing
   * them would bury the ones that are: a volcano someone named, a hot spring
   * with a place attached to it.
   *
   * A repeated name is the tell, and it needs no list of banned words.
   */
  const allMarkers = rows(pack.markers).filter(usable)
  const seen = new Map<string, number>()
  for (const m of allMarkers) seen.set(nameOf(m), (seen.get(nameOf(m)) ?? 0) + 1)
  const markers = allMarkers.filter((m) => seen.get(nameOf(m)) === 1)

  if (withMarkers) {
    for (const m of markers) {
      const [container, kind] = MARKER_CONTAINERS[String(m.type)] ?? ['locations', 'site']
      const cell = cellById.get(m.cell as number)
      candidates.push({
        name: nameOf(m),
        container,
        kind,
        tier: 2,
        // The note is real prose the generator already wrote - the one thing
        // markers have going for them, if they are wanted at all.
        summary: typeof m.note === 'string' ? m.note : undefined,
        parentNames: chain(cell, provinceName, stateName, nameOf(m)),
        source: 'json',
        sourceType: 'marker',
      })
    }
  }
  tally('marker', 'various', allMarkers.length, withMarkers ? markers.length : 0)
}
