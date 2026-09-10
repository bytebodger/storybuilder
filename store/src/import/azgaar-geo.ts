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

  // Pixels mean nothing outside this export; degrees survive it.
  for (const g of out.values()) {
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
