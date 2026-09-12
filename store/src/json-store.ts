import { randomBytes } from 'node:crypto'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import type { Store } from './store.ts'
import {
  CanonViolation,
  StoreError,
  type ClosureState,
  groupKey,
  type ContainerFile,
  type Item,
  type ItemPatch,
  type Neighborhood,
  type NewItem,
  type RelationSet,
  type Tag,
  type Timeline,
  type Universe,
  ROOT_TIMELINE_ID,
  ROOT_TIMELINE_NAME,
} from './types.ts'
import { assertValidPlacement, childrenOf, isRoot, rootTimeline } from './timelines.ts'

const MANIFEST = 'universe.json'
const CONTAINER_DIR = 'store'
/*
 * Beside the manifest rather than inside `store/`, because `containers()` reads
 * that directory and every file in it is a container. A timeline is not one -
 * it holds no articles - and filing it there would put "timelines" in the nav
 * as a thing to write articles about.
 */
const TIMELINES = 'timelines.json'

/**
 * File-backed Store: one JSON file per container, inside one universe directory.
 *
 * Every operation reads from disk rather than holding a cache. Universes are
 * small - thousands of items, not millions - and creative work is bursty and
 * often edited by hand between calls, so a stale in-memory copy would be a much
 * likelier source of wrong answers than the I/O is a bottleneck.
 */
export class JsonFileStore implements Store {
  readonly universeId: string

  constructor(private readonly root: string) {
    this.universeId = basename(root)
  }

  // --- universe -----------------------------------------------------------

  async manifest(): Promise<Universe> {
    return this.readJson<Universe>(join(this.root, MANIFEST))
  }

  async updateManifest(patch: Partial<Omit<Universe, 'id' | 'createdAt'>>): Promise<Universe> {
    const current = await this.manifest()
    const next = {
      ...current,
      ...patch,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    }
    await writeFile(join(this.root, MANIFEST), stringify(next), 'utf8')
    return next
  }

  /** Create a universe directory with a manifest and an empty container store. */
  static async create(root: string, universe: Omit<Universe, 'createdAt'>): Promise<JsonFileStore> {
    await mkdir(join(root, CONTAINER_DIR), { recursive: true })
    const manifest: Universe = {
      totalYears: 1000,
      ...universe,
      createdAt: new Date().toISOString(),
    }
    await writeFile(join(root, MANIFEST), stringify(manifest), 'utf8')
    await writeFile(join(root, TIMELINES), stringify([rootTimeline()]), 'utf8')
    return new JsonFileStore(root)
  }

  // --- reads --------------------------------------------------------------

  async containers(): Promise<string[]> {
    const dir = join(this.root, CONTAINER_DIR)
    let names: string[]
    try {
      names = await readdir(dir)
    } catch {
      return []
    }
    return names
      .filter((n) => n.endsWith('.json'))
      .map((n) => n.slice(0, -5))
      .sort()
  }

  /**
   * The world, without what has been thrown out of it.
   *
   * One filter, in the one place every read passes through: the navigation, the
   * briefs, the cross-referencer, `validate`, the rolled skeleton, and so every
   * canon check and query. A trashed article leaves all of them at once, and a
   * rescue puts it back in all of them at once.
   */
  async list(container?: string): Promise<Item[]> {
    return (await this.readAll(container)).filter((i) => !i.trashed)
  }

  /** What is in the trash, most recently thrown out first. */
  async trashed(): Promise<Item[]> {
    return (await this.readAll())
      .filter((i) => i.trashed)
      .sort((a, b) => (b.trashed?.at ?? '').localeCompare(a.trashed?.at ?? ''))
  }

  /** Everything on disk, trash included. Only the trash and `mintId` want this. */
  private async readAll(container?: string): Promise<Item[]> {
    if (container) return (await this.readContainer(container)).items
    const all: Item[] = []
    for (const c of await this.containers()) all.push(...(await this.readContainer(c)).items)
    return all
  }

  async get(id: string): Promise<Item | null> {
    for (const c of await this.containers()) {
      const hit = (await this.readContainer(c)).items.find((i) => i.id === id)
      if (hit) return hit
    }
    return null
  }

  async find(name: string, container?: string): Promise<Item[]> {
    const needle = name.trim().toLowerCase()
    const pool = await this.list(container)
    return pool.filter(
      (i) => i.name.toLowerCase() === needle || (i.aliases ?? []).some((a) => a.toLowerCase() === needle),
    )
  }

  async neighborhood(id: string): Promise<Neighborhood> {
    const item = await this.require(id)
    const index = await this.index()
    const related: Record<string, RelationSet> = {}

    for (const tag of item.tags) {
      const other = index.get(tag.relatedTo)
      // A dangling tag is a data error, not a query error; `validate` reports it
      // in full. Skipping here keeps reads working on a damaged store.
      if (!other) continue
      // Grouped by the target's group key, not its container, so a closed set of
      // continents reads as continents rather than as all of geography.
      const key = groupKey(other)
      const set = (related[key] ??= {
        type: key,
        closure: item.closure?.[key]?.state ?? 'open',
        closureNote: item.closure?.[key]?.note,
        items: [],
      })
      set.items.push(other)
    }

    // A set declared closed or uncharted with no members yet still has to be
    // reported - "this planet has no moons, and that is settled" is a fact.
    for (const [type, record] of Object.entries(item.closure ?? {})) {
      related[type] ??= { type, closure: record.state, closureNote: record.note, items: [] }
    }

    for (const set of Object.values(related)) set.items.sort(byName)
    return { item, related }
  }

  // --- writes -------------------------------------------------------------

  async add(input: NewItem): Promise<Item> {
    if (!input.container.trim()) throw new StoreError('container is required')
    if (!input.name.trim()) throw new StoreError('name is required')
    await this.assertTimelineExists(input.timeline)

    const now = new Date().toISOString()
    const item: Item = {
      id: await this.mintId(),
      container: input.container,
      name: input.name,
      kind: input.kind,
      stub: input.stub || undefined,
      aliases: input.aliases,
      demonyms: input.demonyms,
      summary: input.summary,
      beginDate: input.beginDate,
      endDate: input.endDate,
      timeline: input.timeline,
      attributes: input.attributes,
      tags: [],
      closure: input.closure,
      sources: input.sources,
      createdAt: now,
      updatedAt: now,
    }

    const file = await this.readContainer(item.container)
    file.items.push(item)
    await this.writeContainer(file)

    // Links go through `link` rather than being written inline, so a new item
    // cannot slip past a closed set on the way in.
    for (const l of input.links ?? []) await this.link(item.id, l.to, { a: l.role })

    return (await this.get(item.id))!
  }

  async update(id: string, patch: ItemPatch): Promise<Item> {
    const item = await this.require(id)

    await this.assertTimelineExists(patch.timeline)

    const file = await this.readContainer(item.container)
    const idx = file.items.findIndex((i) => i.id === id)
    file.items[idx] = { ...item, ...patch, updatedAt: new Date().toISOString() }
    await this.writeContainer(file)
    return file.items[idx]
  }

  async remove(id: string): Promise<void> {
    const item = await this.require(id)
    for (const tag of [...item.tags]) await this.unlink(id, tag.relatedTo)
    const file = await this.readContainer(item.container)
    file.items = file.items.filter((i) => i.id !== id)
    await this.writeContainer(file)
  }

  /**
   * Out of the world, still on disk.
   *
   * The edges go, because a relationship with something that is not in the
   * world is not a relationship - and they are kept on the item so a rescue can
   * re-make them. Nothing else is touched: the prose of every other article is
   * left exactly as its author wrote it, and a name mentioned there is still
   * mentioned. It simply stops linking here.
   */
  async trash(id: string): Promise<Item> {
    const item = await this.require(id)
    if (item.trashed) return item

    const cut: Tag[] = item.tags.map((t) => ({ ...t }))
    const touched: Item[] = [item]
    const changed = new Set<string>([item.container])

    for (const tag of cut) {
      const other = await this.get(tag.relatedTo)
      if (!other) continue
      if (dropTag(other, id)) {
        touched.push(other)
        changed.add(other.container)
      }
    }

    item.tags = []
    item.trashed = { at: new Date().toISOString(), tags: cut }
    await this.persist(touched, changed)
    return (await this.get(id))!
  }

  /**
   * Back into the world, with the edges it went in with.
   *
   * Those are best effort, and deliberately not a reason to fail: a set closed
   * while the item was away refuses a new member, and the other end may have
   * been removed in the meantime. The refusals are reported so the author can
   * see what did not come back rather than discovering it later.
   */
  async restore(id: string): Promise<{ item: Item; relinked: number; refused: string[] }> {
    const item = await this.require(id)
    if (!item.trashed) return { item, relinked: 0, refused: [] }

    const { tags } = item.trashed
    delete item.trashed
    await this.persist([item], new Set([item.container]))

    let relinked = 0
    const refused: string[] = []
    for (const tag of tags) {
      try {
        await this.link(id, tag.relatedTo, { a: tag.role })
        relinked++
      } catch (e: unknown) {
        refused.push(e instanceof Error ? e.message : String(e))
      }
    }
    return { item: (await this.get(id))!, relinked, refused }
  }

  async link(aId: string, bId: string, role?: { a?: string; b?: string }): Promise<void> {
    if (aId === bId) throw new StoreError('An item cannot be linked to itself')
    const a = await this.require(aId)
    const b = await this.require(bId)
    const index = await this.index()

    this.assertClosureAllows(a, b, index)
    this.assertClosureAllows(b, a, index)

    const changed = new Set<string>()
    if (addTag(a, b, role?.a)) changed.add(a.container)
    if (addTag(b, a, role?.b)) changed.add(b.container)
    await this.persist([a, b], changed)
  }

  async unlink(aId: string, bId: string): Promise<void> {
    const a = await this.require(aId)
    const b = await this.require(bId)
    const changed = new Set<string>()
    if (dropTag(a, bId)) changed.add(a.container)
    if (dropTag(b, aId)) changed.add(b.container)
    await this.persist([a, b], changed)
  }

  /**
   * Retype an item into a different container - the path a legend takes when it
   * turns out to be real, or an idea takes when it settles into what it is.
   *
   * The move is checked, not assumed: every neighbour sees this item under a new
   * type, so if any of them has closed that set, the promotion is refused. A
   * lost continent cannot be found on a planet already known to have two.
   */
  async move(id: string, container: string, kind?: string): Promise<Item> {
    const item = await this.require(id)
    const nextKind = kind === undefined ? item.kind : kind.trim() || undefined
    if (item.container === container && nextKind === item.kind) return item

    const index = await this.index()
    const moved: Item = { ...item, container, kind: nextKind, updatedAt: new Date().toISOString() }
    for (const tag of item.tags) {
      const other = index.get(tag.relatedTo)
      if (other) this.assertClosureAllows(other, moved, index)
    }

    if (item.container === container) {
      // Same container, new kind: rewrite in place. The far side of each edge
      // still names the container, so nothing else has to change.
      const file = await this.readContainer(container)
      file.items[file.items.findIndex((i) => i.id === id)] = moved
      await this.writeContainer(file)
      return moved
    }

    const from = await this.readContainer(item.container)
    from.items = from.items.filter((i) => i.id !== id)
    await this.writeContainer(from)

    const to = await this.readContainer(container)
    to.items.push(moved)
    await this.writeContainer(to)

    // A tag names the container of the item it points at, so every edge into
    // this one is now mistyped and has to be rewritten.
    const touched: Item[] = []
    for (const tag of item.tags) {
      const other = await this.get(tag.relatedTo)
      if (!other) continue
      for (const t of other.tags) if (t.relatedTo === id) t.type = container
      touched.push(other)
    }
    await this.persist(touched, new Set(touched.map((i) => i.container)))

    return (await this.get(id))!
  }

  /**
   * Declare how complete a relation set is.
   *
   * Closing demands a reason, because closing is the one operation here that
   * makes future authoring harder. Reopening does not - it is an ordinary
   * authorial decision and should cost nothing - but a reason given is kept, so
   * the record of what was once settled survives the reopening.
   */
  async setClosure(id: string, type: string, state: ClosureState, note?: string): Promise<Item> {
    if (state === 'closed' && !note?.trim()) {
      throw new StoreError(
        `Closing a set requires a reason. Say why ${type} is complete, so a later session can tell ` +
          `a structural constraint from an early guess.`,
      )
    }
    const item = await this.require(id)
    const next = { ...(item.closure ?? {}) }
    if (state === 'open' && !note?.trim()) delete next[type]
    else next[type] = { state, ...(note?.trim() ? { note: note.trim() } : {}), setAt: new Date().toISOString() }
    return this.update(id, { closure: next })
  }

  // --- internals ----------------------------------------------------------

  /**
   * The closure rule, in one place: a closed set admits no new members.
   *
   * Membership is an edge *of the right type*, which is why this also governs
   * `move` - retyping an item into a closed container makes it a new member of
   * that set, and has to be refused on exactly the same grounds as a new link.
   */
  private assertClosureAllows(owner: Item, incoming: Item, index: Map<string, Item>): void {
    const key = groupKey(incoming)
    const record = owner.closure?.[key]
    if (record?.state !== 'closed') return

    const memberIds = owner.tags
      .map((t) => index.get(t.relatedTo))
      .filter((m): m is Item => !!m && groupKey(m) === key)
    if (memberIds.some((m) => m.id === incoming.id)) return

    const members = memberIds.map((m) => m.name)
    throw new CanonViolation(
      `${owner.name} (${owner.container}) has a closed set of ${key}: ` +
        `${members.join(', ') || '(empty)'}.

` +
        `Why it was closed: ${record.note ?? '(no reason recorded)'}

` +
        `Adding "${incoming.name}" would contradict that. Three legitimate ways forward, and the ` +
        `third is not a defeat - worlds grow, and a set closed in an early pass is often just ` +
        `wrong:
` +
        `  1. It is not a ${key} of ${owner.name}.
` +
        `  2. It belongs in a different container.
` +
        `  3. The set was closed too early. Reopen it deliberately:
` +
        `     sb set-closure ${owner.id} ${key} open --reason "..."`,
    )
  }

  // --- timelines ----------------------------------------------------------

  /**
   * Read the timelines, creating the Universal History if there is none.
   *
   * Healing on read rather than in a migration step: a universe made before
   * timelines existed, or one whose file was deleted by hand, comes back with
   * a root and everything that reads timelines can assume there is one. The
   * write only happens when something was actually missing.
   */
  async timelines(): Promise<Timeline[]> {
    let list: Timeline[]
    try {
      list = await this.readJson<Timeline[]>(join(this.root, TIMELINES))
    } catch (e: unknown) {
      if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e
      list = []
    }
    if (list.some((t) => isRoot(t.id))) return list

    const healed = [rootTimeline(), ...list]
    await this.writeTimelines(healed)
    return healed
  }

  async addTimeline(input: { name: string; parent?: string }): Promise<Timeline> {
    const list = await this.timelines()
    assertValidPlacement(list, input)

    const timeline: Timeline = {
      id: await this.mintTimelineId(list),
      name: input.name.trim(),
      parent: input.parent ?? ROOT_TIMELINE_ID,
      createdAt: new Date().toISOString(),
    }
    await this.writeTimelines([...list, timeline])
    return timeline
  }

  async updateTimeline(id: string, patch: { name?: string; parent?: string }): Promise<Timeline> {
    const list = await this.timelines()
    const current = list.find((t) => t.id === id)
    if (!current) throw new StoreError(`No timeline with id "${id}" in universe "${this.universeId}"`)

    if (isRoot(id)) {
      // Named and placed by the tool, not by the author. Everything else in the
      // tree is described by where it sits relative to this, so it has nowhere
      // to be moved to and renaming it would rename the frame of reference.
      throw new StoreError(`${ROOT_TIMELINE_NAME} cannot be renamed or moved`)
    }

    const next: Timeline = {
      ...current,
      name: (patch.name ?? current.name).trim(),
      parent: patch.parent ?? current.parent ?? ROOT_TIMELINE_ID,
      updatedAt: new Date().toISOString(),
    }
    assertValidPlacement(list, { name: next.name, parent: next.parent }, id)

    await this.writeTimelines(list.map((t) => (t.id === id ? next : t)))
    return next
  }

  async removeTimeline(id: string): Promise<void> {
    const list = await this.timelines()
    const timeline = list.find((t) => t.id === id)
    if (!timeline) throw new StoreError(`No timeline with id "${id}" in universe "${this.universeId}"`)
    if (isRoot(id)) throw new StoreError(`${ROOT_TIMELINE_NAME} cannot be removed`)

    // Children take the removed timeline's place rather than going with it.
    // Deleting the Reign of King Tarinian says the reign is not a useful
    // grouping; it does not say the War of the Stewards never happened.
    const inherited = timeline.parent ?? ROOT_TIMELINE_ID
    const moved = childrenOf(list, id).map((c) => c.id)
    const stamp = new Date().toISOString()

    // The events filed under it move up for exactly the same reason, and they
    // move rather than block the removal: an event filed under the reign did
    // happen during whatever contained the reign, so promoting it stays true.
    // Refusing instead would mean re-filing every event by hand to be rid of a
    // grouping that turned out to be a bad idea.
    const events = (await this.list()).filter((i) => i.timeline === id)
    for (const event of events) await this.update(event.id, { timeline: inherited })

    await this.writeTimelines(
      list
        .filter((t) => t.id !== id)
        .map((t) => (moved.includes(t.id) ? { ...t, parent: inherited, updatedAt: stamp } : t)),
    )
  }

  /**
   * An item may only be filed under a timeline this universe has.
   *
   * Checked here rather than in the field spec because it is a question about
   * the world, not about the shape of a form: whether this universe has a
   * timeline by this id is something only the store can answer, and an event
   * filed under one that does not exist is filed nowhere.
   */
  private async assertTimelineExists(id: string | undefined): Promise<void> {
    if (id === undefined) return
    const list = await this.timelines()
    if (list.some((t) => t.id === id)) return
    throw new StoreError(
      `No timeline with id "${id}" in universe "${this.universeId}". ` +
        `It has: ${list.map((t) => `${t.name} [${t.id}]`).join(', ')}`,
    )
  }

  private async writeTimelines(list: Timeline[]): Promise<void> {
    await mkdir(this.root, { recursive: true })
    await writeFile(join(this.root, TIMELINES), stringify(list), 'utf8')
  }

  private async mintTimelineId(list: Timeline[]): Promise<string> {
    const taken = new Set(list.map((t) => t.id))
    for (;;) {
      const id = randomBytes(4).toString('hex')
      if (!taken.has(id)) return id
    }
  }

  private async require(id: string): Promise<Item> {
    const item = await this.get(id)
    if (!item) throw new StoreError(`No item with id "${id}" in universe "${this.universeId}"`)
    return item
  }

  private async index(): Promise<Map<string, Item>> {
    return new Map((await this.list()).map((i) => [i.id, i]))
  }

  private async mintId(): Promise<string> {
    // Against everything on disk, not the world: an id handed out twice because
    // the first holder was in the trash would collide the moment it came back.
    const taken = new Set((await this.readAll()).map((i) => i.id))
    for (;;) {
      const id = randomBytes(4).toString('hex')
      if (!taken.has(id)) return id
    }
  }

  /** Rewrite the containers holding these (already mutated) items. */
  private async persist(items: Item[], containers: Set<string>): Promise<void> {
    for (const container of containers) {
      const file = await this.readContainer(container)
      for (const item of items) {
        if (item.container !== container) continue
        const idx = file.items.findIndex((i) => i.id === item.id)
        if (idx >= 0) file.items[idx] = { ...item, updatedAt: new Date().toISOString() }
      }
      await this.writeContainer(file)
    }
  }

  private async readContainer(container: string): Promise<ContainerFile> {
    try {
      return await this.readJson<ContainerFile>(this.containerPath(container))
    } catch (e: unknown) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') return { container, items: [] }
      throw e
    }
  }

  private async writeContainer(file: ContainerFile): Promise<void> {
    file.items.sort(byName)
    await mkdir(join(this.root, CONTAINER_DIR), { recursive: true })
    await writeFile(this.containerPath(file.container), stringify(file), 'utf8')
  }

  private containerPath(container: string): string {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(container)) {
      throw new StoreError(`Invalid container name "${container}" (expected kebab-case)`)
    }
    return join(this.root, CONTAINER_DIR, `${container}.json`)
  }

  private async readJson<T>(path: string): Promise<T> {
    return JSON.parse(await readFile(path, 'utf8')) as T
  }
}

function addTag(owner: Item, other: Item, role?: string): boolean {
  const existing = owner.tags.find((t) => t.relatedTo === other.id)
  if (existing) {
    if (role && existing.role !== role) {
      existing.role = role
      return true
    }
    return false
  }
  owner.tags.push({ type: other.container, relatedTo: other.id, ...(role ? { role } : {}) })
  return true
}

function dropTag(owner: Item, otherId: string): boolean {
  const before = owner.tags.length
  owner.tags = owner.tags.filter((t) => t.relatedTo !== otherId)
  return owner.tags.length !== before
}

const byName = (a: Item, b: Item) => a.name.localeCompare(b.name)

const stringify = (v: unknown) => `${JSON.stringify(v, null, 2)}\n`
