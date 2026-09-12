export type FieldKind = 'text' | 'longtext' | 'list' | 'number' | 'timeline' | 'boolean'

/** Mirrors the field spec the bridge serves from the store. */
export interface UniverseField {
  key: string
  label: string
  kind: FieldKind
  required: boolean
  default: string | number | string[] | boolean | null
  /** Shown only while another field holds this value. */
  showWhen?: { field: string; equals: string | number | boolean }
  help: string
  examples?: string[]
  /** The form section this field belongs to. Absent on short specs. */
  group?: string
  /** Set when code makes this field, not a model. Filled instantly, never asked for. */
  generator?: 'given-name' | 'family-name'
}

/** One of a universe's timelines, in tree order with its depth. */
export interface TimelineNode {
  id: string
  name: string
  parent?: string
  depth: number
}

/** A timeline as the chronology draws it: its span, and how much is under it. */
export interface TimelineLane extends TimelineNode {
  /** The years its events reach, or null on a timeline that holds none. */
  first: number | null
  last: number | null
  /** Events anywhere beneath it, undated ones included. */
  count: number
}

export interface ChronologyEvent {
  id: string
  name: string
  container: string
  timeline: string
  beginDate: string | null
  /** null when no year could be read out of the begin date. */
  year: number | null
  durationDays: number | null
  summary: string | null
  stub: boolean
}

export interface Chronology {
  timelines: TimelineLane[]
  events: ChronologyEvent[]
}

export interface Universe {
  id: string
  name: string
  totalYears?: number
  genres?: string[]
  tone?: string
  themes?: string[]
  scale?: string
  naturalLaws?: string
  origins?: string
  geography?: string
  cultures?: string
  inspiration?: string[]
  createdAt: string
  updatedAt?: string
}

export type UniverseDraft = Record<string, unknown>

export interface ForgeResult {
  values: Record<string, unknown>
  /** Keys the model returned that were not requested. Surfaced, never applied. */
  dropped: string[]
  error?: string
}

/** What a die settled about one article, before any of it was written. */
export interface Skeleton {
  values: Record<string, unknown>
  /** Fields this one simply does not have. Never asked for. */
  omit: string[]
  /** Facts for the generator that are not fields: trade, station, era. */
  notes: string[]
}

export interface NavItem {
  id: string
  name: string
  kind?: string
  summary?: string
}

/** One container section of a universe's navigation, empty or not. */
export interface NavSection {
  key: string
  label: string
  singular: string
  description: string
  narrative?: boolean
  items: NavItem[]
}

export interface StubCandidate {
  term: string
  container: string
  context?: string
  field?: string
  note?: string
}

export interface StubScan {
  candidates: StubCandidate[]
  /** Terms the universe already had, under some spelling. Shown, never proposed. */
  alreadyKnown: { term: string; matched: string; id: string }[]
  discarded: string[]
  error?: string
}

export interface StubContainer {
  key: string
  label: string
  singular: string
}

export type FindingKind =
  | 'closed-set'
  | 'contradiction'
  | 'natural-law'
  | 'extancy'
  | 'out-of-span'
  | 'unknown-reference'

export interface Finding {
  kind: FindingKind
  field?: string
  term?: string
  passage: string
  says?: string
  id?: string
  resolve?: string
}

export interface CanonCheckResult {
  findings: Finding[]
  /** References that resolved - usually because a stub was just accepted for them. */
  resolved: { term: string; matched: string }[]
  error?: string
}

export interface LinkTarget {
  id: string
  name: string
  container: string
  stub?: boolean
}

/** A run of article text, linked or plain. */
export interface Segment {
  text: string
  target?: LinkTarget
}

export interface ArticleField {
  key: string
  label: string
  /** Short values are looked up; long ones are read. They are laid out differently. */
  kind: FieldKind
  segments: Segment[]
}

export interface ArticleView {
  item: {
    id: string
    name: string
    container: string
    kind?: string
    stub?: boolean
    /** Set while it is in the trash: shown as such, and restored rather than edited. */
    trashed?: { at: string; tags: unknown[] }
  }
  /** True when this article has a window onto the universe's map. */
  hasMap?: boolean
  container: { key: string; label: string; singular?: string }
  fields: ArticleField[]
  related: {
    type: string
    closure: 'open' | 'closed' | 'uncharted'
    closureNote?: string
    items: { id: string; name: string; container: string; stub?: boolean }[]
  }[]
}

export interface ImportCandidate {
  name: string
  container: string
  kind?: string
  tier: 0 | 1 | 2 | 3
  parentNames?: string[]
  summary?: string
  attributes?: Record<string, unknown>
  source: 'svg' | 'json'
  sourceType: string
}

export interface PlanGroup {
  key: string
  container: string
  kind?: string
  sourceType: string
  candidates: ImportCandidate[]
}

export interface GroupedPlan {
  groups: PlanGroup[]
  alreadyPresent: { name: string; matched: string }[]
  /** How the plan sits against what the universe already holds. */
  delta?: {
    new: number
    update: number
    unchanged: number
    edited: number
    authored: number
    missing: string[]
  }
  counts: { sourceType: string; container: string; found: number; included: number }[]
  warnings: string[]
  total: number
}

export interface Skill {
  /** The identifier the run is made against, not necessarily what is shown. */
  name: string
  /** What a person should see instead of the name, where a skill sets one. */
  title?: string
  description: string
  args: SkillArg[]
  /** Whether invoking it can modify canon. */
  writes: boolean
}

export interface SkillArg {
  name: string
  label: string
  placeholder?: string
  multiline?: boolean
  required?: boolean
}

export interface RunRequest {
  universe: string
  skill: string
  args: Record<string, string>
}

export interface RunResult {
  output: string
  /** Unified diff of proposed canon changes, when the skill writes. */
  diff?: string
  error?: string
}
