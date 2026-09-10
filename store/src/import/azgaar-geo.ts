/**
 * What the map knows about a country beyond its name.
 *
 * Borders, water access, and where on the globe it sits. None of it is stated
 * outright in the export - `neighbors` aside - so it is derived here, once,
 * from the cell grid.
 */
type Row = Record<string, unknown>

export interface StateGeography {
  /** Ocean, lake, or neither - the physical coastline, not the port flags. */
  coast: 'sea' | 'lake' | 'none'
  seaPorts: number
  lakePorts: number
  /**
   * Ports on a navigable river, inland of any coast.
   *
   * These look wrong until you remember New Orleans: a city can be a port
   * without being on the sea. Counting them separately is what keeps a
   * landlocked country from either losing its harbours or gaining a coastline.
   */
  riverPorts: number
  /** Degrees, so the numbers mean something outside this one image. */
  bounds: { north: number; south: number; east: number; west: number }
  /** The same extent in canvas pixels, which is what a map crop is framed in. */
  boundsPx: { x0: number; y0: number; x1: number; y1: number }
}

interface Coords {
  latN: number
  latS: number
  lonW: number
  lonE: number
}

/**
 * A land cell records `harbor` (how much water it touches) and `haven` (the
 * water cell it opens onto). Following the haven to its feature is what
 * separates a sea coast from a lake shore; the port flags on settlements do
 * not, because a river port carries one too.
 */
export function readStateGeography(
  cells: Row[],
  burgs: Row[],
  features: Map<number, Row>,
  coords: Coords,
  size: { width: number; height: number },
): Map<number, StateGeography> {
  const byId = new Map<number, Row>()
  for (const c of cells) byId.set(c.i as number, c)

  const out = new Map<number, StateGeography>()
  const get = (state: number) => {
    let g = out.get(state)
    if (!g) {
      g = {
        coast: 'none',
        seaPorts: 0,
        lakePorts: 0,
        riverPorts: 0,
        // Canvas y grows southward, so the northern edge is the smallest y and
        // starts high; the eastern edge is the largest x and starts low.
        bounds: { north: Infinity, south: -Infinity, east: -Infinity, west: Infinity },
        // Filled from `bounds` once every cell has been seen, before those are
        // converted to degrees.
        boundsPx: { x0: 0, y0: 0, x1: 0, y1: 0 },
      }
      out.set(state, g)
    }
    return g
  }

  const waterAt = (cell: Row | undefined): string | undefined =>
    cell ? (features.get(cell.f as number)?.type as string | undefined) : undefined

  for (const cell of cells) {
    const state = cell.state as number
    if (!state) continue
    const point = cell.p
    if (!Array.isArray(point) || point.length < 2) continue

    const g = get(state)
    const [x, y] = [Number(point[0]), Number(point[1])]
    g.bounds.east = Math.max(g.bounds.east, x)
    g.bounds.west = Math.min(g.bounds.west, x)
    g.bounds.north = Math.min(g.bounds.north, y) // canvas y grows southward
    g.bounds.south = Math.max(g.bounds.south, y)

    if (!cell.harbor) continue
    const water = waterAt(byId.get(cell.haven as number))
    if (water === 'ocean') g.coast = 'sea'
    else if (water === 'lake' && g.coast === 'none') g.coast = 'lake'
  }

  for (const burg of burgs) {
    if (!burg.port) continue
    const state = burg.state as number
    if (!state) continue
    const cell = byId.get(burg.cell as number)
    const g = get(state)

    if (cell?.harbor) {
      const water = waterAt(byId.get(cell.haven as number))
      if (water === 'lake') g.lakePorts++
      else g.seaPorts++
    } else if (cell?.r) {
      g.riverPorts++
    }
  }

  // Pixels mean nothing outside this export; degrees survive it. Both are kept:
  // degrees for anyone reading the article, pixels for framing the map.
  for (const g of out.values()) {
    g.boundsPx = {
      x0: g.bounds.west,
      y0: g.bounds.north,
      x1: g.bounds.east,
      y1: g.bounds.south,
    }
    const lon = (x: number) => round(coords.lonW + (x / size.width) * (coords.lonE - coords.lonW))
    const lat = (y: number) => round(coords.latN - (y / size.height) * (coords.latN - coords.latS))
    g.bounds = {
      east: lon(g.bounds.east),
      west: lon(g.bounds.west),
      north: lat(g.bounds.north),
      south: lat(g.bounds.south),
    }
  }
  return out
}

const round = (n: number) => (Number.isFinite(n) ? Math.round(n * 10) / 10 : 0)

/**
 * The states a run of cells passes through, in the order first met.
 *
 * Exact rather than inferred: a river carries the cells it flows along, so the
 * countries it crosses are a lookup, not a guess about where a line went.
 */
export function statesAlong(
  cellIds: number[],
  byId: Map<number, Row>,
  stateName: Map<number, string>,
): string[] {
  const seen = new Set<string>()
  for (const id of cellIds) {
    const name = stateName.get(byId.get(id)?.state as number)
    if (name) seen.add(name)
  }
  return [...seen]
}

/**
 * The states beneath a set of points on the canvas.
 *
 * Used for hand-added labels, whose curve traces the feature they name. Each
 * point falls to the nearest cell, so a range labelled across a border reports
 * both countries rather than whichever one its midpoint happened to land in.
 */
export function statesUnder(
  points: { x: number; y: number }[],
  cells: Row[],
  stateName: Map<number, string>,
): string[] {
  const seen = new Set<string>()
  for (const p of points) {
    let best: Row | undefined
    let bestDist = Infinity
    for (const c of cells) {
      const at = c.p
      if (!Array.isArray(at) || at.length < 2) continue
      const d = (Number(at[0]) - p.x) ** 2 + (Number(at[1]) - p.y) ** 2
      if (d < bestDist) {
        bestDist = d
        best = c
      }
    }
    const name = stateName.get(best?.state as number)
    if (name) seen.add(name)
  }
  return [...seen]
}
