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
  UNIVERSE_FIELDS,
  createUniverse,
  draftToItem,
  draftToPatch,
  fieldsFor,
  isEmptyValue,
  itemToDraft,
  containerType,
  linkify,
  listUniverses,
  openUniverse,
  renderBrief,
  renderUniverseBrief,
  toUniverseId,
} from '../../store/src/index.ts'
import type { Item, UniverseDraft } from '../../store/src/index.ts'
import { applyForgeResponse, buildForgePrompt, type ForgeRequest } from './forge.ts'
import { extractCandidates, screenCandidates, stubContainers } from './stubs.ts'
import { normalizeTerm } from '../../store/src/index.ts'
import { buildCanonCheckPrompt, extractFindings, screenFindings } from './canon.ts'

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

function runClaude(prompt: string): Promise<{ output: string; error?: string }> {
  return new Promise((done) => {
    const child = spawn('claude', ['-p', prompt, '--allowedTools', ALLOWED_TOOLS], {
      cwd: REPO,
      shell: false,
    })
    let out = ''
    let err = ''
    child.stdout.on('data', (d: Buffer) => (out += d))
    child.stderr.on('data', (d: Buffer) => (err += d))
    child.on('error', (e) => done({ output: out, error: `Could not run the claude CLI: ${e.message}` }))
    child.on('close', (code) =>
      done(code === 0 ? { output: out } : { output: out, error: err || `claude exited with ${code}` }),
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
      return send(res, 200, { fields: UNIVERSE_FIELDS })
    }

    // The same, for any container that has a spec. A container without one is
    // not an error - it just has no article form yet.
    if (req.method === 'GET' && url.pathname === '/api/fields') {
      const container = url.searchParams.get('container') ?? ''
      return send(res, 200, { container, fields: fieldsFor(container) })
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

      // Spec order where there is a spec, so an article always reads the same
      // way; insertion order otherwise, which is all a container without one has.
      const ordered = spec
        ? spec
            .filter((f) => f.storeAs !== 'name' && !isEmptyValue(values[f.key]))
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
        const item = await store.update(body.id, draftToPatch(body.container, body.values))
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
      return send(res, 200, { sections })
    }

    if (req.method === 'GET' && url.pathname === '/api/universe') {
      const store = await openUniverse(url.searchParams.get('id') ?? '')
      return send(res, 200, { universe: await store.manifest() })
    }

    // Saving never generates. A field the author left blank stays blank.
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

    if (req.method === 'POST' && url.pathname === '/api/universe/forge') {
      const body = await readJson<ForgeRequest>(req)
      body.container ||= 'universe'
      if (!Array.isArray(body.fill) || body.fill.length === 0) {
        return send(res, 400, { error: 'Nothing to generate: every field is locked or filled.' })
      }
      if (!fieldsFor(body.container)) {
        return send(res, 400, { error: `No field spec for container "${body.container}"` })
      }
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
