/**
 * Storybuilder bridge: the only component that touches the working tree.
 *
 * The frontend is static and cannot run anything; it posts here, and this
 * process shells out to the Claude Code CLI to invoke a skill against a universe.
 * Bound to loopback only — it runs commands, so it must never be exposed.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { readCatalog } from './catalog.ts'
import type { RunRequest } from './types.ts'
import {
  CONTAINER_TYPES,
  createUniverse,
  draftToItem,
  draftToPatch,
  fieldsFor,
  flatten,
  byFirstYear,
  forgeName,
  rollAccepts,
  rollFor,
  treeOf,
  subtree,
  spanOf,
  eventsIn,
  yearOf,
  isEmptyValue,
  itemToDraft,
  containerType,
  linkify,
  buildImportPlan,
  TIERS,
  listUniverses,
  openUniverse,
  renderBrief,
  renderUniverseBrief,
  toUniverseId,
} from '../../store/src/index.ts'
import type { ImportCandidate, Item, UniverseDraft } from '../../store/src/index.ts'
import { readFile } from 'node:fs/promises'
import { applyForgeResponse, buildForgePrompt, type ForgeRequest } from './forge.ts'
import { extractCandidates, screenCandidates, stubContainers } from './stubs.ts'
import { normalizeTerm } from '../../store/src/index.ts'
import { buildCanonCheckPrompt, extractFindings, screenFindings } from './canon.ts'
import { groupPlan, type PlanRequest } from './import.ts'
import { forgetMaps, renderMap } from './map.ts'
import { universesRoot } from '../../store/src/index.ts'
import { join } from 'node:path'

const PORT = Number(process.env.PORT ?? 8787)
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

/**
 * Builds the prompt sent to the CLI. Skills are invoked by name so that the same
 * skill behaves identically whether it was reached from this UI or typed into
 * Claude Code directly — there is no second, divergent implementation here.
 */
function buildPrompt(req: RunRequest): string {
  const args = Object.entries(req.args)
    .filter(([, v]) => v.trim() !== '')
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')
  return [
    `Use the ${req.skill} skill.`,
    `Universe: ${req.universe}. Read and write canon with: sb --universe ${req.universe} <command>`,
    args && `Arguments:\n${args}`,
  ]
    .filter(Boolean)
    .join('\n\n')
}

/**
 * The universe as a generator needs to see it: its standing constraints, then
 * an inventory of what it already contains.
 *
 * This is what `article-forge` used to fetch for itself, one `sb` call and one
 * model turn at a time. The bridge has the store open, so it costs a few
 * milliseconds here and saves twenty-odd seconds there.
 *
 * Names only, not articles. What stops a generator inventing a fourteenth
 * continent is knowing the thirteen; what any one of them is made of is a
 * lookup it can still make if it turns out to matter.
 */
const INVENTORY_CAP = 60

async function canonBrief(universe: string): Promise<string> {
  const store = await openUniverse(universe)
  const parts = [await renderUniverseBrief(store)]

  const items = await store.list()
  const byContainer = new Map<string, string[]>()
  for (const item of items) {
    const names = byContainer.get(item.container) ?? []
    names.push(item.stub ? `${item.name} (stub)` : item.name)
    byContainer.set(item.container, names)
  }

  if (byContainer.size) {
    const lines = [...byContainer.entries()].sort().map(([container, names]) => {
      names.sort()
      const shown = names.slice(0, INVENTORY_CAP)
      // A truncated list still has to say it is truncated, or the absence of a
      // name reads as the thing not existing - which is the one mistake this
      // whole inventory is here to prevent.
      const more = names.length > shown.length ? `, and ${names.length - shown.length} more` : ''
      return `${container} (${names.length}): ${shown.join(', ')}${more}`
    })
    parts.push(`WHAT THIS UNIVERSE ALREADY HOLDS${NL}${lines.join(NL)}`)
  } else {
    parts.push('This universe holds no articles yet. Anything you name will be the first of its kind.')
  }

  const timelines = await store.timelines()
  if (timelines.length > 1) {
    parts.push(`TIMELINES: ${timelines.map((t) => t.name).join(', ')}`)
  }
  return parts.join(NL + NL)
}

/**
 * The rolled facts, framed so they read as settled rather than suggested.
 *
 * The wording matters more than it looks. Handed a list of facts with no
 * instruction, a model treats them as a starting point and improves on them -
 * which puts back exactly the salience-seeking the roll was there to remove.
 */
function rolledBlock(notes: string[]): string {
  return [
    'ALREADY DECIDED, BY A DIE, ABOUT THIS PARTICULAR ARTICLE.',
    'These are not suggestions and not a starting point. They were chosen at random on purpose,',
    'so that this article is not the most obvious article this world could produce. Write around',
    'them. Do not improve on them, do not steer back toward whatever the universe is best known',
    'for, and do not quietly drop one because a more interesting option occurs to you.',
    '',
    ...notes.map((n) => `- ${n}`),
  ].join(NL)
}

/**
 * What a skill run is allowed to do, declared here rather than inherited.
 *
 * A non-interactive run has nobody to answer a permission prompt, so the surface
 * has to be granted up front - and granting it in code means it is reviewable in
 * one place instead of depending on whatever ambient settings the process picked
 * up. `sb` is the whole canon interface, so allowing it is allowing the skill to
 * do its job; reads are allowed because checking a draft means opening it.
 */
const NL = String.fromCharCode(10)

const ALLOWED_TOOLS = ['Bash(npm run sb:*)', 'Read', 'Glob', 'Grep'].join(',')

/**
 * How long a run may take before it is abandoned, in minutes.
 *
 * Generous, because writing a long article genuinely takes minutes and cutting
 * one off at ninety seconds would be worse than waiting. But not unbounded: a
 * run that wedges with no limit leaves a browser tab waiting on it forever,
 * with nothing to distinguish that from a slow answer.
 */
const RUN_TIMEOUT_MS = Number(process.env.SB_RUN_TIMEOUT_MINUTES ?? 10) * 60_000

function runClaude(prompt: string): Promise<{ output: string; error?: string }> {
  return new Promise((done) => {
    const child = spawn('claude', ['-p', prompt, '--allowedTools', ALLOWED_TOOLS], {
      cwd: REPO,
      shell: false,
    })
    let out = ''
    let err = ''
    let settled = false
    const finish = (result: { output: string; error?: string }) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      done(result)
    }

    const timer = setTimeout(() => {
      child.kill()
      finish({
        output: out,
        // Says how long it waited, so the number is not a mystery to argue with.
        error:
          `The run was still going after ${Math.round(RUN_TIMEOUT_MS / 60_000)} minutes and was ` +
          `stopped. Try asking for fewer fields at once, or raise ` +
          `SB_RUN_TIMEOUT_MINUTES if this one legitimately takes longer.`,
      })
    }, RUN_TIMEOUT_MS)

    child.stdout.on('data', (d: Buffer) => (out += d))
    child.stderr.on('data', (d: Buffer) => (err += d))
    child.on('error', (e) => finish({ output: out, error: `Could not run the claude CLI: ${e.message}` }))
    child.on('close', (code) =>
      finish(code === 0 ? { output: out } : { output: out, error: err || `claude exited with ${code}` }),
    )
  })
}

/**
 * The fields an article actually has values in.
 *
 * Reading them back through the container's spec matters: a field declared
 * `storeAs: 'beginDate'` lives on a column, not in `attributes`, so anything
 * that reassembled an article from `attributes` alone would silently lose every
 * date - unrendered in the view, unchecked by the canon check.
 */
function filledFields(item: Item) {
  const spec = fieldsFor(item.container)
  const values: Record<string, unknown> = spec
    ? itemToDraft(item.container, item)
    : { ...(item.attributes ?? {}), ...(item.summary ? { description: item.summary } : {}) }

  return Object.fromEntries(Object.entries(values).filter(([, v]) => !isEmptyValue(v)))
}

function send(res: ServerResponse, status: number, body: unknown) {
  const json = JSON.stringify(body)
  res.writeHead(status, { 'content-type': 'application/json', 'content-length': Buffer.byteLength(json) })
  res.end(json)
}

async function readJson<T>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = []
  for await (const c of req) chunks.push(c as Buffer)
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as T
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', `http://localhost:${PORT}`)

    if (req.method === 'GET' && url.pathname === '/api/universes') {
      const ids = await listUniverses()
      const universes = await Promise.all(
        ids.map(async (id) => (await openUniverse(id)).manifest()),
      )
      return send(res, 200, { universes })
    }

    // The form, the generator and this endpoint all read one field spec, so a
    // field cannot exist in one of them and not the others.
    if (req.method === 'GET' && url.pathname === '/api/universe/fields') {
      return send(res, 200, { fields: fieldsFor('universe') })
    }

    // The same, for any container that has a spec. A container without one is
    // not an error - it just has no article form yet.
    if (req.method === 'GET' && url.pathname === '/api/fields') {
      const container = url.searchParams.get('container') ?? ''
      // What generating this container can be aimed at rides along, because the
      // form asks for the spec on mount and needs to know whether to offer a
      // year before anyone presses anything.
      return send(res, 200, {
        container,
        fields: fieldsFor(container),
        accepts: rollAccepts(container),
      })
    }

    /**
     * One article, ready to read: its fields in spec order, each split into
     * plain and linked runs.
     *
     * Linking happens here rather than in the browser because it is the same
     * question the stub scan asks - does this term name something the universe
     * has? - and it should be answered by the same code against the same store,
     * not by a second implementation that can drift.
     */
    if (req.method === 'GET' && url.pathname === '/api/article') {
      const store = await openUniverse(url.searchParams.get('universe') ?? '')
      const item = await store.get(url.searchParams.get('id') ?? '')
      if (!item) return send(res, 404, { error: 'No such item' })

      const all = await store.list()
      const spec = fieldsFor(item.container)
      const values = filledFields(item)

      // A timeline is stored as an id and read as a name. The id is what makes
      // the filing unambiguous and is exactly what nobody wants to look at.
      // Found through the spec rather than by key, so a container is free to
      // call its timeline field whatever suits it.
      for (const field of spec?.filter((f) => f.kind === 'timeline') ?? []) {
        const line = (await store.timelines()).find((t) => t.id === values[field.key])
        if (line) values[field.key] = line.name
      }

      // Spec order where there is a spec, so an article always reads the same
      // way; insertion order otherwise, which is all a container without one has.
      // The name and the kind are left out: the heading already shows them, as
      // the title and the badge beside it.
      const ordered = spec
        ? spec
            .filter((f) => f.storeAs !== 'name' && f.storeAs !== 'kind' && !isEmptyValue(values[f.key]))
            .map((f) => ({ key: f.key, label: f.label, kind: f.kind, value: values[f.key] }))
        : Object.entries(values).map(([key, value]) => ({
            key,
            label: key,
            kind: 'longtext' as const,
            value,
          }))

      // `kind` travels with each field so the reader can lay out a lifespan and
      // a life cycle differently. A one-line fact rendered as a paragraph reads
      // as though something is missing from it.
      // A list is joined before linking, so each entry is matched on its own and
      // "Antin Forin, III" does not become one long unmatched run.
      const fields = ordered.map((f) => ({
        key: f.key,
        label: f.label,
        kind: f.kind,
        segments: linkify(
          Array.isArray(f.value) ? f.value.join(', ') : String(f.value),
          all,
          { excludeId: item.id },
        ),
      }))

      const { related } = await store.neighborhood(item.id)
      return send(res, 200, {
        item,
        // Whether this article has a window onto the universe's map.
        hasMap: !!item.attributes?.mapFrame,
        container: containerType(item.container) ?? { key: item.container, label: item.container },
        fields,
        related: Object.values(related).map((set) => ({
          type: set.type,
          closure: set.closure,
          closureNote: set.closureNote,
          items: set.items.map((i) => ({ id: i.id, name: i.name, container: i.container, stub: i.stub })),
        })),
      })
    }

    if (req.method === 'GET' && url.pathname === '/api/item') {
      const store = await openUniverse(url.searchParams.get('universe') ?? '')
      const item = await store.get(url.searchParams.get('id') ?? '')
      if (!item) return send(res, 404, { error: 'No such item' })
      return send(res, 200, { item, values: itemToDraft(item.container, item) })
    }

    if (req.method === 'POST' && url.pathname === '/api/item') {
      const body = await readJson<{
        universe: string
        id?: string
        container: string
        values: Record<string, unknown>
        links?: string[]
      }>(req)
      const store = await openUniverse(body.universe)

      if (body.id) {
        // The stored item is passed in so attributes outside this container's
        // spec - a map frame, an imported population - survive the save.
        const before = await store.get(body.id)
        const item = await store.update(
          body.id,
          draftToPatch(body.container, body.values, before ?? undefined),
        )
        return send(res, 200, { item })
      }
      const draft = draftToItem(body.container, body.values)
      const item = await store.add({ ...draft, links: (body.links ?? []).map((to) => ({ to })) })
      return send(res, 200, { item })
    }

    // Navigation for one universe: every declared container, whether or not it
    // holds anything. An empty section the author can click into is the prompt
    // to write the first article; a nav built only from what exists would never
    // show them where the gaps are.
    if (req.method === 'GET' && url.pathname === '/api/nav') {
      const store = await openUniverse(url.searchParams.get('universe') ?? '')
      const items = await store.list()
      const sections = CONTAINER_TYPES.map((type) => ({
        ...type,
        items: items
          .filter((i) => i.container === type.key)
          .map((i) => ({ id: i.id, name: i.name, kind: i.kind, summary: i.summary })),
      }))
      // Anything in the store under a container that is not in the catalog is
      // still shown - the store never refused it, and hiding it would be a lie.
      const known = new Set(CONTAINER_TYPES.map((c) => c.key))
      for (const container of [...new Set(items.map((i) => i.container))].filter((c) => !known.has(c))) {
        sections.push({
          key: container,
          label: container,
          singular: container,
          description: 'Not in the container catalog.',
          items: items.filter((i) => i.container === container).map((i) => ({ id: i.id, name: i.name, kind: i.kind, summary: i.summary })),
        })
      }

      /*
       * Alphabetical, not catalog order.
       *
       * The catalog is written in a reading order - people first, then the sky,
       * then the ground - which is right for a document explaining what the
       * containers are and wrong for a list somebody is hunting through. A
       * reader who wants Fauna looks where F would be, and there is no order
       * but alphabetical that puts it there. Uncatalogued containers sort in
       * with the rest rather than trailing after them; they are things the
       * universe holds, whatever the catalog says.
       */
      sections.sort((a, b) => a.label.localeCompare(b.label))
      return send(res, 200, { sections })
    }

    if (req.method === 'GET' && url.pathname === '/api/universe') {
      const store = await openUniverse(url.searchParams.get('id') ?? '')
      return send(res, 200, { universe: await store.manifest() })
    }

    // Saving never generates. A field the author left blank stays blank.
    /*
     * Timelines: the buckets history events are filed into, as a tree.
     *
     * Returned in tree order with a depth on each rather than nested, because
     * every consumer so far wants to draw an indented list, and because the
     * arranging is done by one tested function in the store rather than a
     * second one in the browser that can disagree with it.
     */
    if (req.method === 'GET' && url.pathname === '/api/timelines') {
      const store = await openUniverse(url.searchParams.get('universe') ?? '')
      const timelines = await store.timelines()
      return send(res, 200, {
        timelines: flatten(treeOf(timelines)).map(({ children, ...node }) => node),
      })
    }

    /**
     * Everything needed to draw a universe's history: the timelines, their
     * spans, and every event with a year attached where one could be read.
     *
     * Assembled here rather than in the browser because every part of it -
     * arranging the tree, reaching a span through a subtree, reading a year out
     * of "January 1, 1139" - is a rule, and a second implementation of a rule
     * is a second answer waiting to disagree with the first.
     *
     * Events whose date yields no year come back with `year: null` rather than
     * being dropped. They are filed somewhere; they simply cannot be placed,
     * and a view that quietly showed four of five events would be worse than
     * one that shows the fifth and says why it is not on the line.
     */
    if (req.method === 'GET' && url.pathname === '/api/chronology') {
      const store = await openUniverse(url.searchParams.get('universe') ?? '')
      const lines = await store.timelines()
      const items = await store.list()
      const dated = eventsIn(items)

      // Spans first, because the order depends on them: a chronology reads in
      // chronological order, and the tree has no dates of its own to sort by.
      const spans = new Map(lines.map((t) => [t.id, spanOf(lines, dated, t.id)]))
      const inOrder = treeOf(lines, byFirstYear((id) => spans.get(id)?.first ?? null))

      const timelines = flatten(inOrder).map((node) => {
        const within = subtree(lines, node.id)
        const span = spans.get(node.id) ?? null
        return {
          id: node.id,
          name: node.name,
          parent: node.parent,
          depth: node.depth,
          first: span?.first ?? null,
          last: span?.last ?? null,
          // Everything beneath it, undated events included: they are filed here
          // whether or not they can be drawn.
          count: items.filter((i) => i.timeline && within.includes(i.timeline)).length,
        }
      })

      const events = items
        .filter((i) => i.timeline)
        .map((i) => ({
          id: i.id,
          name: i.name,
          container: i.container,
          timeline: i.timeline!,
          beginDate: i.beginDate ?? null,
          year: yearOf(i.beginDate),
          durationDays:
            typeof i.attributes?.durationDays === 'number' ? i.attributes.durationDays : null,
          summary: i.summary ?? null,
          stub: !!i.stub,
        }))
        .sort((a, b) => (a.year ?? Infinity) - (b.year ?? Infinity) || a.name.localeCompare(b.name))

      return send(res, 200, { timelines, events })
    }

    if (req.method === 'POST' && url.pathname === '/api/timelines') {
      const body = await readJson<{ universe: string; name?: string; parent?: string }>(req)
      const store = await openUniverse(body.universe ?? '')
      try {
        const timeline = await store.addTimeline({ name: body.name ?? '', parent: body.parent })
        return send(res, 200, { timeline })
      } catch (e: unknown) {
        // A rejected placement is an answer, not a fault: the tree said no.
        return send(res, 400, { error: e instanceof Error ? e.message : String(e) })
      }
    }

    if (req.method === 'PATCH' && url.pathname === '/api/timelines') {
      const body = await readJson<{
        universe: string
        id: string
        name?: string
        parent?: string
      }>(req)
      const store = await openUniverse(body.universe ?? '')
      try {
        const timeline = await store.updateTimeline(body.id ?? '', {
          name: body.name,
          parent: body.parent,
        })
        return send(res, 200, { timeline })
      } catch (e: unknown) {
        return send(res, 400, { error: e instanceof Error ? e.message : String(e) })
      }
    }

    if (req.method === 'DELETE' && url.pathname === '/api/timelines') {
      const store = await openUniverse(url.searchParams.get('universe') ?? '')
      try {
        await store.removeTimeline(url.searchParams.get('id') ?? '')
        return send(res, 200, { ok: true })
      } catch (e: unknown) {
        return send(res, 400, { error: e instanceof Error ? e.message : String(e) })
      }
    }

    if (req.method === 'POST' && url.pathname === '/api/universe') {
      const body = await readJson<{ id?: string; draft: UniverseDraft }>(req)
      const draft = body.draft ?? {}
      if (!draft.name?.trim()) return send(res, 400, { error: 'A universe needs a name' })

      if (body.id) {
        const store = await openUniverse(body.id)
        return send(res, 200, { universe: await store.updateManifest(draft) })
      }
      const id = toUniverseId(draft.name)
      const store = await createUniverse(id, draft)
      return send(res, 200, { universe: await store.manifest() })
    }

    /**
     * A universe's map, framed to one article when `id` names one that carries
     * a frame. Served as an image, so it can be an <img> like any other.
     */
    if (req.method === 'GET' && url.pathname === '/api/map') {
      const universe = url.searchParams.get('universe') ?? ''
      const store = await openUniverse(universe)
      const id = url.searchParams.get('id')
      const item = id ? await store.get(id) : null

      let svg: string
      try {
        svg = await renderMap({
          universeDir: join(universesRoot(), universe),
          frame: item?.attributes?.mapFrame,
        })
      } catch {
        return send(res, 404, { error: 'This universe has no map' })
      }

      res.writeHead(200, {
        'content-type': 'image/svg+xml; charset=utf-8',
        'content-length': Buffer.byteLength(svg),
        'cache-control': 'no-cache',
      })
      return res.end(svg)
    }

    if (req.method === 'GET' && url.pathname === '/api/import/tiers') {
      return send(res, 200, { tiers: TIERS })
    }

    /**
     * Read two export files and say what an import would do.
     *
     * Paths rather than uploads: the bridge already runs on the author's own
     * machine, and a Full export is 75MB. Nothing is written here.
     */
    if (req.method === 'POST' && url.pathname === '/api/import/plan') {
      const body = await readJson<PlanRequest>(req)
      const store = await openUniverse(body.universe)

      let svg: string
      let json: unknown
      try {
        svg = await readFile(body.svgPath, 'utf8')
        json = JSON.parse(await readFile(body.jsonPath, 'utf8'))
      } catch (e: unknown) {
        return send(res, 400, { error: `Could not read the export: ${(e as Error).message}` })
      }

      const plan = buildImportPlan(json as never, svg, {
        tier: body.tier,
        minPopulation: body.minPopulation,
        withProvinces: body.withProvinces,
        withMarkers: body.withMarkers,
      })
      return send(res, 200, groupPlan(plan, await store.list()))
    }

    /**
     * Create what the author kept.
     *
     * Parents are linked in a second pass, once every name in the batch has an
     * id - a settlement can name a country that is being created alongside it.
     */
    if (req.method === 'POST' && url.pathname === '/api/import/commit') {
      const body = await readJson<{ universe: string; candidates: ImportCandidate[] }>(req)
      const store = await openUniverse(body.universe)
      const chosen = body.candidates ?? []

      const byName = new Map<string, string>()
      let created = 0
      for (const c of chosen) {
        const item = await store.add({
          container: c.container,
          name: c.name,
          kind: c.kind,
          summary: c.summary,
          attributes: c.attributes && Object.keys(c.attributes).length ? c.attributes : undefined,
          stub: !c.summary,
        })
        byName.set(c.name.toLowerCase(), item.id)
        created++
      }

      let linked = 0
      let bordered = 0
      for (const c of chosen) {
        const child = byName.get(c.name.toLowerCase())
        if (!child) continue
        const parent = (c.parentNames ?? []).map((n) => byName.get(n.toLowerCase())).find(Boolean)
        if (parent && child !== parent) {
          await store.link(child, parent)
          linked++
        }
        // Peers, not parents: a border reads the same from both ends.
        for (const rel of c.relations ?? []) {
          const other = byName.get(rel.name.toLowerCase())
          if (!other || other === child) continue
          await store.link(child, other, { a: rel.role, b: rel.reverseRole })
          bordered++
        }
      }
      // A re-import rewrites the map, so nothing held may be served again.
      forgetMaps()
      return send(res, 200, { created, linked, bordered })
    }

    // Containers a stub may be filed under. Never the universe manifest.
    if (req.method === 'GET' && url.pathname === '/api/stubs/containers') {
      return send(res, 200, { containers: stubContainers() })
    }

    /**
     * Scan a saved article for references it does not explain.
     *
     * The model reads the prose; the store decides what is new. A candidate is
     * only shown to the author after it has failed to match anything already in
     * the universe - plurals, articles and aliases included.
     */
    if (req.method === 'POST' && url.pathname === '/api/stubs/scan') {
      const body = await readJson<{ universe: string; id: string }>(req)
      const store = await openUniverse(body.universe)
      const item = await store.get(body.id)
      if (!item) return send(res, 404, { error: 'No such item' })

      const fields = filledFields(item)

      const prompt = [
        'Use the stub-forge skill.',
        `Universe: ${body.universe}. Container: ${item.container}.`,
        `Article: ${item.name} [${item.id}]`,
        `Fields:` + NL + JSON.stringify(fields, null, 2),
        'Reply with a single JSON object: {"candidates": [...]}. No other text.',
      ].join(NL + NL)

      const run = await runClaude(prompt)
      const proposed = extractCandidates(run.output)
      if (!proposed) {
        return send(res, 200, { candidates: [], alreadyKnown: [], discarded: [], error: run.error })
      }
      return send(res, 200, screenCandidates(proposed, await store.list(), item))
    }

    /**
     * The second round of the save flow, run after stubs are created.
     *
     * Order is the whole design: a stub accepted a moment ago now resolves, so
     * it is never reported here; one the author declined does not, and being
     * told about it once is the point.
     */
    if (req.method === 'POST' && url.pathname === '/api/canon/check') {
      const body = await readJson<{ universe: string; id: string }>(req)
      const store = await openUniverse(body.universe)
      const item = await store.get(body.id)
      if (!item) return send(res, 404, { error: 'No such item' })

      const run = await runClaude(buildCanonCheckPrompt(body.universe, item, filledFields(item)))
      const proposed = extractFindings(run.output)
      if (!proposed) return send(res, 200, { findings: [], resolved: [], error: run.error })
      return send(res, 200, screenFindings(proposed, await store.list()))
    }

    /**
     * Create the stubs the author accepted. A stub is a name and a container:
     * no summary, no attributes, and no generated content - drafting them would
     * produce references of their own, and the cascade would not stop.
     */
    if (req.method === 'POST' && url.pathname === '/api/stubs') {
      const body = await readJson<{
        universe: string
        stubs: { term: string; container: string; alias?: string }[]
        linkTo?: string
      }>(req)
      const store = await openUniverse(body.universe)
      const created = []
      const skipped = []

      for (const stub of body.stubs ?? []) {
        const name = stub.term?.trim()
        if (!name || !stub.container) {
          skipped.push({ term: stub.term, why: 'Needs a title and a container' })
          continue
        }
        // Re-checked at creation: the author may have edited a title into
        // something that already exists, or scanned twice.
        const store_items = await store.list()
        const { candidates } = screenCandidates([{ term: name, container: stub.container }], store_items)
        if (candidates.length === 0) {
          skipped.push({ term: name, why: 'Already exists in this universe' })
          continue
        }
        // The author may have retitled the candidate - "Antin Forin" saved as
        // "Antin Forin, III". Keeping the term as written in the prose is what
        // lets the canon check that follows recognise the reference instead of
        // reporting it as unrecorded.
        const alias = stub.alias?.trim()
        const aliases = alias && normalizeTerm(alias) !== normalizeTerm(name) ? [alias] : undefined

        created.push(
          await store.add({
            container: stub.container,
            name,
            aliases,
            stub: true,
            links: body.linkTo ? [{ to: body.linkTo }] : undefined,
          }),
        )
      }
      return send(res, 200, { created, skipped })
    }

    /**
     * The part of an article a die can decide, decided before anything is asked
     * of a model.
     *
     * Separate from the forge on purpose. It costs milliseconds where a
     * generation costs a minute, so the form can show a trade, a birthplace and
     * a lifespan the instant the button is pressed, and write the prose around
     * facts that are already on screen.
     */
    if (req.method === 'GET' && url.pathname === '/api/skeleton') {
      const container = url.searchParams.get('container') ?? ''
      const store = await openUniverse(url.searchParams.get('universe') ?? '')
      // A year narrows the roll to someone alive in it. Absent, the whole canon
      // is in play, which is what most worldbuilding wants.
      const asked = url.searchParams.get('year')
      const year = asked !== null && asked.trim() !== '' && Number.isFinite(Number(asked))
        ? Number(asked)
        : undefined

      const skeleton = rollFor(
        container,
        {
          universe: await store.manifest(),
          items: await store.list(),
          timelines: await store.timelines(),
        },
        undefined,
        { year },
      )
      return send(res, 200, { skeleton })
    }

    /**
     * One name, made rather than asked for.
     *
     * Instant, and unbounded: a seed from a broad pool or from this universe's
     * own names, one or two mutations, checked against everything already taken
     * and everything the author has turned down. The model is not involved,
     * which is why Regenerate on a name no longer costs twenty seconds and no
     * longer cycles between two answers.
     */
    if (req.method === 'POST' && url.pathname === '/api/name') {
      const body = await readJson<{ universe?: string; kind?: string; avoid?: string[] }>(req)
      const kind = body.kind === 'family-name' ? 'family' : 'given'

      let canon: string[] = []
      let taken: string[] = []
      if (body.universe) {
        const items = await (await openUniverse(body.universe)).list()
        taken = items.map((i) => i.name)
        canon = items.filter((i) => i.container === 'people').map((i) => i.name)
      }

      const name = forgeName({ kind, canon, taken, avoid: body.avoid ?? [] })
      if (!name) {
        return send(res, 400, {
          error: 'Could not find a name that has not already been offered and refused.',
        })
      }
      return send(res, 200, { name })
    }

    if (req.method === 'POST' && url.pathname === '/api/universe/forge') {
      const body = await readJson<ForgeRequest>(req)
      body.container ||= 'universe'
      if (!Array.isArray(body.fill) || body.fill.length === 0) {
        return send(res, 400, { error: 'Nothing to generate: every field is locked or filled.' })
      }
      if (!fieldsFor(body.container)) {
        return send(res, 400, { error: `No field spec for container "${body.container}"` })
      }
      // Read here, where the store already is, rather than leaving the skill to
      // shell out for the same facts a turn at a time.
      if (body.universe) body.canon = await canonBrief(body.universe)
      // What the die already settled, so the prose is written around it rather
      // than reaching past it for something more dramatic.
      if (body.rolled?.length) body.canon = `${body.canon ?? ''}${NL}${NL}${rolledBlock(body.rolled)}`

      const run = await runClaude(buildForgePrompt(body))
      if (run.error) return send(res, 200, { values: {}, dropped: [], error: run.error })
      // Requested keys only - the author's locks are enforced here, not upstream.
      return send(res, 200, applyForgeResponse(run.output, body))
    }

    // The console shows the universe's premise and hard rules alongside the
    // skill form, so the author can see the constraints a run will be held to.
    if (req.method === 'GET' && url.pathname === '/api/intro') {
      const id = url.searchParams.get('universe') ?? ''
      const store = await openUniverse(id)
      return send(res, 200, { intro: await renderUniverseBrief(store) })
    }

    if (req.method === 'GET' && url.pathname === '/api/brief') {
      const store = await openUniverse(url.searchParams.get('universe') ?? '')
      const id = url.searchParams.get('id') ?? ''
      return send(res, 200, { brief: renderBrief(await store.neighborhood(id)) })
    }

    if (req.method === 'GET' && url.pathname === '/api/skills') {
      return send(res, 200, { skills: await readCatalog(REPO) })
    }

    if (req.method === 'POST' && url.pathname === '/api/run') {
      const body = await readJson<RunRequest>(req)
      const universes = await listUniverses()
      // Validate against the real lists rather than trusting the request: the
      // universe name reaches a spawned process, and the skill name a prompt.
      if (!universes.includes(body.universe))
        return send(res, 400, { error: `Unknown universe: ${body.universe}` })
      const skills = await readCatalog(REPO)
      if (!skills.some((s) => s.name === body.skill))
        return send(res, 400, { error: `Unknown skill: ${body.skill}` })
      return send(res, 200, await runClaude(buildPrompt(body)))
    }

    send(res, 404, { error: 'Not found' })
  } catch (e: unknown) {
    send(res, 500, { error: e instanceof Error ? e.message : String(e) })
  }
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`storybuilder bridge on http://127.0.0.1:${PORT} (repo: ${REPO})`)
})
