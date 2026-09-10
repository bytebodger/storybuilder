import type {
  ArticleView,
  GroupedPlan,
  ImportCandidate,
  CanonCheckResult,
  ForgeResult,
  StubContainer,
  StubScan,
  NavSection,
  RunRequest,
  RunResult,
  Skill,
  Universe,
  UniverseDraft,
  UniverseField,
  TimelineNode,
  Chronology,
  Skeleton,
} from './types'

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...init?.headers },
  })
  if (!res.ok) throw new Error(await failure(res))
  return res.json() as Promise<T>
}

/**
 * What went wrong, in the words the bridge used.
 *
 * A refusal from the store is a sentence written for a person - "This universe
 * already has a timeline called X" - and it arrives as `{"error": "..."}`.
 * Showing the envelope instead of the message puts JSON on screen where an
 * explanation should be. Anything that is not shaped that way falls back to the
 * status line, which is all there is to say about it.
 */
async function failure(res: Response): Promise<string> {
  const body = await res.text()
  try {
    const parsed = JSON.parse(body) as { error?: unknown }
    if (typeof parsed.error === 'string' && parsed.error.trim()) return parsed.error
  } catch {
    // Not JSON. The raw body is more use than nothing.
  }
  return `${res.status} ${res.statusText}${body ? `: ${body}` : ''}`
}

export const listUniverses = () =>
  json<{ universes: Universe[] }>('/universes').then((r) => r.universes)

export const universeFields = () =>
  json<{ fields: UniverseField[] }>('/universe/fields').then((r) => r.fields)

/** A container's field spec, or null when it has no article form yet. */
export const containerFields = (container: string) =>
  json<{ fields: UniverseField[] | null }>(
    `/fields?container=${encodeURIComponent(container)}`,
  ).then((r) => r.fields)

/**
 * What a blank form starts with. Only for a new article - applying defaults to
 * an edit would resurrect a value the author had cleared.
 */
export function defaultsFrom(fields: UniverseField[]): UniverseDraft {
  const values: UniverseDraft = {}
  for (const f of fields) if (f.default !== null && f.default !== undefined) values[f.key] = f.default
  return values
}

/**
 * A universe's timelines, in tree order with a depth on each.
 *
 * Arranged by the store rather than here: a second implementation of "what is
 * under what" in the browser is one that can disagree with the one that
 * enforces it.
 */
export const timelines = (universe: string) =>
  json<{ timelines: TimelineNode[] }>(
    `/timelines?universe=${encodeURIComponent(universe)}`,
  ).then((r) => r.timelines)

/** The timelines with their spans, and every event filed into one. */
export const chronology = (universe: string) =>
  json<Chronology>(`/chronology?universe=${encodeURIComponent(universe)}`)

export const addTimeline = (universe: string, name: string, parent?: string) =>
  json<{ timeline: TimelineNode }>('/timelines', {
    method: 'POST',
    body: JSON.stringify({ universe, name, parent }),
  }).then((r) => r.timeline)

export const editTimeline = (
  universe: string,
  id: string,
  patch: { name?: string; parent?: string },
) =>
  json<{ timeline: TimelineNode }>('/timelines', {
    method: 'PATCH',
    body: JSON.stringify({ universe, id, ...patch }),
  }).then((r) => r.timeline)

export const dropTimeline = (universe: string, id: string) =>
  json<{ ok: true }>(
    `/timelines?universe=${encodeURIComponent(universe)}&id=${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  )

export const getItem = (universe: string, id: string) =>
  json<{ item: { id: string; name: string; kind?: string }; values: UniverseDraft }>(
    `/item?universe=${encodeURIComponent(universe)}&id=${encodeURIComponent(id)}`,
  )

export const saveItem = (body: {
  universe: string
  id?: string
  container: string
  values: UniverseDraft
  links?: string[]
}) =>
  json<{ item: { id: string; name: string; kind?: string } }>('/item', {
    method: 'POST',
    body: JSON.stringify(body),
  }).then((r) => r.item)

export const getUniverse = (id: string) =>
  json<{ universe: Universe }>(`/universe?id=${encodeURIComponent(id)}`).then((r) => r.universe)

export const saveUniverse = (draft: UniverseDraft, id?: string) =>
  json<{ universe: Universe }>('/universe', { method: 'POST', body: JSON.stringify({ id, draft }) }).then(
    (r) => r.universe,
  )

/** Generate values for `fill` only. The bridge discards anything else. */
/**
 * The part of an article a die can decide. Null for a container with no roll.
 *
 * Milliseconds, against a minute for a generation - so it lands on the form
 * before the writing starts rather than after it.
 */
export const skeleton = (universe: string, container: string) =>
  json<{ skeleton: Skeleton | null }>(
    `/skeleton?universe=${encodeURIComponent(universe)}&container=${encodeURIComponent(container)}`,
  ).then((r) => r.skeleton)

export const forge = (
  fill: string[],
  current: UniverseDraft,
  container = 'universe',
  universe?: string,
  /** Everything these fields have offered and had rejected, not just the last. */
  avoid?: Record<string, unknown[]>,
  /** Notes from the roll, so the prose is written around what was settled. */
  rolled?: string[],
) =>
  json<ForgeResult>('/universe/forge', {
    method: 'POST',
    body: JSON.stringify({ container, universe, fill, current, avoid, rolled }),
  })

export const nav = (universe: string) =>
  json<{ sections: NavSection[] }>(`/nav?universe=${encodeURIComponent(universe)}`).then((r) => r.sections)

export const article = (universe: string, id: string) =>
  json<ArticleView>(`/article?universe=${encodeURIComponent(universe)}&id=${encodeURIComponent(id)}`)

export const brief = (universe: string, id: string) =>
  json<{ brief: string }>(
    `/brief?universe=${encodeURIComponent(universe)}&id=${encodeURIComponent(id)}`,
  ).then((r) => r.brief)

export const stubContainers = () =>
  json<{ containers: StubContainer[] }>('/stubs/containers').then((r) => r.containers)

export const scanStubs = (universe: string, id: string) =>
  json<StubScan>('/stubs/scan', { method: 'POST', body: JSON.stringify({ universe, id }) })

export const createStubs = (
  universe: string,
  stubs: { term: string; container: string; alias?: string }[],
  linkTo?: string,
) =>
  json<{ created: { id: string; name: string }[]; skipped: { term: string; why: string }[] }>('/stubs', {
    method: 'POST',
    body: JSON.stringify({ universe, stubs, linkTo }),
  })

export const canonCheck = (universe: string, id: string) =>
  json<CanonCheckResult>('/canon/check', { method: 'POST', body: JSON.stringify({ universe, id }) })

export const planImport = (body: {
  universe: string
  svgPath: string
  jsonPath: string
  tier: number
  minPopulation?: number
  withProvinces?: boolean
  withMarkers?: boolean
}) => json<GroupedPlan>('/import/plan', { method: 'POST', body: JSON.stringify(body) })

export const commitImport = (universe: string, candidates: ImportCandidate[]) =>
  json<{ created: number; linked: number }>('/import/commit', {
    method: 'POST',
    body: JSON.stringify({ universe, candidates }),
  })

export const intro = (universe: string) =>
  json<{ intro: string }>(`/intro?universe=${encodeURIComponent(universe)}`).then((r) => r.intro)

export const listSkills = () => json<{ skills: Skill[] }>('/skills').then((r) => r.skills)

export const run = (req: RunRequest) =>
  json<RunResult>('/run', { method: 'POST', body: JSON.stringify(req) })
