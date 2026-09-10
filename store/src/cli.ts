#!/usr/bin/env node
/**
 * `sb` - the store's command-line surface.
 *
 * Skills are prose, not code: they need a way to read and write canon that can
 * be written into an instruction and run in a shell. Everything here is a thin
 * wrapper over the Store interface, so a skill and a UI cannot diverge in what
 * they are able to do.
 */
import { createUniverse, listUniverses, openUniverse, toUniverseId, universesRoot } from './universes.ts'
import { saveMapSource } from './import/media.ts'
import { join } from 'node:path'
import { renderBrief, renderUniverseBrief } from './brief.ts'
import { validate } from './validate.ts'
import { CanonViolation, type ClosureState } from './types.ts'
import { matchTerm } from './terms.ts'
import type { Store } from './store.ts'
import { buildImportPlan } from './import/azgaar.ts'
import { assess, countBy, importedAttributes } from './import/delta.ts'
import type { Tier } from './import/types.ts'
import { readFile, writeFile } from 'node:fs/promises'
import {
  boxOf,
  cropSvg,
  enclosure,
  gridSampler,
  growToShore,
  pad,
  fitVignette,
  relabelCoordinates,
  type Box,
} from './import/crop.ts'
import { readAddedLabels } from './import/azgaar-svg.ts'

type Row = Record<string, unknown>

const NL = String.fromCharCode(10)

const pct = (n: number) => `${Math.round(n * 100)}%`

const USAGE = `sb - storybuilder canon store

  sb universes                              List universes
  sb new-universe <id> --name <name> [--years N] [--genre g]... [--tone t]
                     [--theme t]... [--scale s] [--laws x] [--origins x]
                     [--geography x] [--cultures x] [--profession p]...
                     [--inspiration x]...

Everything below needs a universe: --universe <id>, or set SB_UNIVERSE.

  sb containers                             List container names in use
  sb list [container]                       List items
  sb find <name> [--container <c>]          Look up by name or alias
  sb show <id>                              Raw JSON for one item
  sb brief <id>                             Neighbourhood, rendered for a prompt
  sb intro                                  Universe premise and hard rules

  sb add <container> <name> [--kind <k>] [--summary <text>] [--alias <a>]... [--link <id>]...
                            [--begin <when>] [--end <when>]
  sb link <idA> <idB> [--role <text>] [--reverse-role <text>]
  sb unlink <idA> <idB>
  sb stub <container> <name>                Create a placeholder: a name and nothing else
  sb resolve <term>                         Does this term already exist? (plurals, aliases)
  sb move <id> <container> [--kind k]       Retype an item (a legend that turns out to be real)
  sb set-closure <id> <type> open|closed|uncharted --reason <why>
        Closing requires a reason. Reopening does not, but one is kept if given.
        Close only sets that are genuinely bounded - continents, moons. Leave
        religions, cities, characters and the like open: they accrete.
  sb remove <id>
  sb validate

  sb crop-map <map.svg> <map.json> --out <file.svg>
              [--state <name> | --label <name> | --box x0,y0,x1,y1]
              [--pad 0.08] [--enclose 0.9] [--no-coordinates] [--vignette]
        Cut a region out of a map, keeping full vector detail. A state is
        framed by its own cells; a hand-added label by its curve, grown outward
        until land rings the frame. --enclose is how much of each edge must be
        shore before the walk stops; water at the border is where the sea opens
        out, which is a feature of the sea rather than a fault in the crop.

  sb import-map <map.svg> <map.json> [--tier 0|1|2|3] [--min-population N]
                                     [--with-provinces] [--with-markers]
                                            Plan an import from an Azgaar export
        Add --write to create the articles. Without it, nothing is written.
        Hand-added labels come in at every tier: they exist only in the SVG,
        and nothing else will ever recover them. Provinces are left out unless
        asked for - the generator makes them whether or not you wanted them.
        So are map markers, which are prompts for a game master, not world facts.
`

interface Args {
  _: string[]
  flags: Record<string, string[]>
}

function parse(argv: string[]): Args {
  const out: Args = { _: [], flags: {} }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) {
      const key = a.slice(2)
      const next = argv[i + 1]
      if (next === undefined || next.startsWith('--')) (out.flags[key] ??= []).push('true')
      else (out.flags[key] ??= []).push(argv[++i])
    } else out._.push(a)
  }
  return out
}

const one = (a: Args, k: string) => a.flags[k]?.[0]
const many = (a: Args, k: string) => a.flags[k] ?? []

async function store(a: Args) {
  const id = one(a, 'universe') ?? process.env.SB_UNIVERSE
  if (!id) throw new Error('No universe selected. Pass --universe <id> or set SB_UNIVERSE.')
  return openUniverse(id)
}

async function main(argv: string[]): Promise<number> {
  const a = parse(argv)
  const [cmd, ...rest] = a._

  switch (cmd) {
    case undefined:
    case 'help':
    case '--help':
      console.log(USAGE)
      return 0

    case 'universes': {
      const list = await listUniverses()
      console.log(list.length ? list.join('\n') : '(none yet - sb new-universe <id> --name "...")')
      return 0
    }

    case 'new-universe': {
      const name = one(a, 'name') ?? rest[0]
      if (!name) throw new Error('Usage: sb new-universe <id> --name <name>')
      const id = rest[0] ?? toUniverseId(name)
      await createUniverse(id, {
        name,
        totalYears: one(a, 'years') ? Number(one(a, 'years')) : undefined,
        genres: many(a, 'genre'),
        tone: one(a, 'tone'),
        themes: many(a, 'theme'),
        scale: one(a, 'scale'),
        naturalLaws: one(a, 'laws'),
        origins: one(a, 'origins'),
        geography: one(a, 'geography'),
        cultures: one(a, 'cultures'),
        professions: many(a, 'profession'),
        inspiration: many(a, 'inspiration'),
      })
      console.log(`Created universe "${id}"`)
      return 0
    }

    case 'containers': {
      const s = await store(a)
      const names = await s.containers()
      if (!names.length) console.log('(none yet)')
      for (const n of names) console.log(n)
      return 0
    }

    case 'list': {
      const s = await store(a)
      for (const i of await s.list(rest[0])) {
        console.log(`${i.id}  ${(i.kind ?? i.container).padEnd(14)} ${i.name}${i.stub ? '  (stub)' : ''}`)
      }
      return 0
    }

    case 'find': {
      const s = await store(a)
      const hits = await s.find(rest.join(' '), one(a, 'container'))
      if (!hits.length) {
        console.log('(no match - the name is not in use in this universe)')
        return 1
      }
      for (const i of hits) console.log(`${i.id}  ${i.container}  ${i.name}`)
      return 0
    }

    case 'show': {
      const s = await store(a)
      const item = await s.get(rest[0])
      if (!item) throw new Error(`No item "${rest[0]}"`)
      console.log(JSON.stringify(item, null, 2))
      return 0
    }

    case 'brief': {
      const s = await store(a)
      console.log(renderBrief(await s.neighborhood(rest[0])))
      return 0
    }

    case 'intro': {
      const s = await store(a)
      console.log(await renderUniverseBrief(s))
      return 0
    }

    case 'add': {
      const s = await store(a)
      const [container, ...nameParts] = rest
      const item = await s.add({
        container,
        name: nameParts.join(' '),
        kind: one(a, 'kind'),
        summary: one(a, 'summary'),
        beginDate: one(a, 'begin'),
        endDate: one(a, 'end'),
        aliases: many(a, 'alias'),
        sources: many(a, 'source'),
        links: many(a, 'link').map((to) => ({ to })),
      })
      console.log(`${item.id}  ${item.container}  ${item.name}`)
      return 0
    }

    case 'stub': {
      const s = await store(a)
      const [container, ...nameParts] = rest
      const item = await s.add({ container, name: nameParts.join(' '), stub: true })
      console.log(`${item.id}  ${item.container}  ${item.name}  (stub)`)
      return 0
    }

    case 'resolve': {
      const s = await store(a)
      const hits = matchTerm(rest.join(' '), await s.list())
      if (!hits.length) {
        console.log('(new to this universe)')
        return 1
      }
      for (const h of hits) {
        console.log(`${h.item.id}  ${h.item.container}  ${h.item.name}  via ${h.via}${h.exact ? '' : ' (loose)'}`)
      }
      return 0
    }

    case 'move': {
      const s = await store(a)
      const item = await s.move(rest[0], rest[1], one(a, 'kind'))
      console.log(`${item.id} is now ${item.container}${item.kind ? ` / ${item.kind}` : ''}`)
      return 0
    }

    case 'link': {
      const s = await store(a)
      await s.link(rest[0], rest[1], { a: one(a, 'role'), b: one(a, 'reverse-role') })
      console.log(`Linked ${rest[0]} <-> ${rest[1]}`)
      return 0
    }

    case 'unlink': {
      const s = await store(a)
      await s.unlink(rest[0], rest[1])
      console.log(`Unlinked ${rest[0]} <-> ${rest[1]}`)
      return 0
    }

    case 'set-closure': {
      const s = await store(a)
      const [id, type, state] = rest
      await s.setClosure(id, type, state as ClosureState, one(a, 'reason'))
      console.log(`${id}: ${type} is now ${state}`)
      return 0
    }

    case 'remove': {
      const s = await store(a)
      await s.remove(rest[0])
      console.log(`Removed ${rest[0]}`)
      return 0
    }

    case 'crop-map': {
      const [svgPath, jsonPath] = rest
      const out = one(a, 'out')
      if (!svgPath || !jsonPath || !out) {
        throw new Error('Usage: sb crop-map <map.svg> <map.json> --out <file.svg>')
      }

      const svg = await readFile(svgPath, 'utf8')
      const json = JSON.parse(await readFile(jsonPath, 'utf8'))
      const canvas = { width: json.info?.width ?? 0, height: json.info?.height ?? 0 }
      const cells = (json.pack?.cells ?? []).filter((c: Row) => Array.isArray(c?.p))

      let box: Box
      let what: string
      let sample: ReturnType<typeof gridSampler> | undefined

      const explicit = one(a, 'box')
      const stateName = one(a, 'state')
      const labelName = one(a, 'label')

      if (explicit) {
        const [x0, y0, x1, y1] = explicit.split(',').map(Number)
        box = { x0, y0, x1, y1 }
        what = 'the box given'
      } else if (stateName) {
        const state = (json.pack?.states ?? []).find(
          (s: Row) => String(s?.name ?? '').toLowerCase() === stateName.toLowerCase(),
        )
        if (!state) throw new Error(`No state named "${stateName}" in this map`)
        const own = cells.filter((c: Row) => c.state === state.i)
        if (!own.length) throw new Error(`"${stateName}" holds no cells`)
        box = boxOf(own.map((c: Row) => ({ x: Number((c.p as number[])[0]), y: Number((c.p as number[])[1]) })))
        what = `${state.name}, from its own ${own.length} cells`
      } else if (labelName) {
        const label = readAddedLabels(svg).find(
          (l) => l.name.toLowerCase() === labelName.toLowerCase(),
        )
        if (!label) throw new Error(`No hand-added label named "${labelName}" in this SVG`)
        // A label over water names a stretch of sea the generator has no object
        // for, so the frame is found by walking out until the coasts close
        // around it - sampled on the regular lattice, since the packed cells
        // are too sparse in open sea to say what is there.
        const grid = json.grid ?? {}
        sample = gridSampler(
          (grid.cells ?? []).map((c: Row) => Number(c?.h ?? 0)),
          { spacing: Number(grid.spacing ?? 1), cellsX: Number(grid.cellsX ?? 1) },
        )
        const grown = growToShore(boxOf(label.points.length ? label.points : [label]), sample, canvas, {
          enclose: one(a, 'enclose') === undefined ? 0.9 : Number(one(a, 'enclose')),
        })
        box = grown.box
        what = grown.closed
          ? `${label.name}, grown from its label until the coasts closed around it`
          : `${label.name} — ${grown.reason}; use --box to frame it yourself`
      } else {
        throw new Error('Say what to crop to: --state, --label, or --box')
      }

      const fraction = one(a, 'pad') === undefined ? 0.08 : Number(one(a, 'pad'))
      const framed = pad(box, fraction, canvas)
      // Relabel before cropping: the labels are placed in canvas coordinates,
      // and the frame is what decides where the edges now are.
      let fitted = a.flags['no-coordinates'] ? svg : relabelCoordinates(svg, framed)
      fitted = fitVignette(fitted, framed, !!a.flags.vignette)
      await writeFile(out, cropSvg(fitted, framed), 'utf8')

      const w = Math.round(framed.x1 - framed.x0)
      const h = Math.round(framed.y1 - framed.y0)
      console.log(`Cropped to ${what}.`)
      if (sample) {
        const ring = enclosure(framed, sample)
        // Water at the border is where the sea opens out, and worth reporting:
        // a frame that is 60% shore is showing a bay, not a sea.
        console.log(
          `  edges ringed by land: N ${pct(ring.N)} S ${pct(ring.S)} W ${pct(ring.W)} E ${pct(ring.E)}`,
        )
      }
      console.log(
        `  ${w} x ${h} of ${canvas.width} x ${canvas.height} ` +
          `(${Math.round((100 * w * h) / (canvas.width * canvas.height))}% of the map), ` +
          `${Math.round(fraction * 100)}% overflow`,
      )
      console.log(`  written to ${out}`)
      return 0
    }

    case 'import-map': {
      const s = await store(a)
      const [svgPath, jsonPath] = rest
      if (!svgPath || !jsonPath) throw new Error('Usage: sb import-map <map.svg> <map.json>')

      const svg = await readFile(svgPath, 'utf8')
      const json = JSON.parse(await readFile(jsonPath, 'utf8'))
      const plan = buildImportPlan(json, svg, {
        tier: Number(one(a, 'tier') ?? 1) as Tier,
        minPopulation: Number(one(a, 'min-population') ?? 1000),
        withProvinces: !!a.flags['with-provinces'],
        withMarkers: !!a.flags['with-markers'],
      })

      for (const w of plan.warnings) console.log(`WARNING: ${w}`)
      console.log('  source          container      found  included')
      for (const c of plan.counts) {
        console.log(`  ${c.sourceType.padEnd(15)} ${c.container.padEnd(13)} ${String(c.found).padStart(5)} ${String(c.included).padStart(9)}`)
      }

      // An import is a comparison, not a rebuild: what the universe already
      // holds decides what is worth writing.
      const existing = await s.list()
      const delta = assess(plan.candidates, existing)
      const counts = countBy(delta)

      console.log(
        NL +
          `${plan.candidates.length} candidate(s): ${counts.new} new, ${counts.update} changed, ` +
          `${counts.unchanged} unchanged, ${counts.edited} written since import, ` +
          `${counts.authored} authored here.`,
      )
      if (delta.missing.length) {
        console.log(
          `${delta.missing.length} article(s) this import created are no longer on the map: ` +
            `${delta.missing.slice(0, 6).map((m) => m.name).join(', ')}` +
            `${delta.missing.length > 6 ? '...' : ''}`,
        )
        console.log('  Left alone. Remove them yourself if the world has really lost them.')
      }

      if (!a.flags.write) {
        console.log(NL + 'Nothing written. Re-run with --write to apply.')
        for (const at of delta.assessments.filter((x) => x.verdict === 'update').slice(0, 8)) {
          console.log(`  changed: ${at.candidate.name} (${at.changed.join(', ')})`)
        }
        for (const at of delta.assessments.filter((x) => x.verdict === 'new').slice(0, 8)) {
          console.log(`  new:     ${at.candidate.container}/${at.candidate.kind ?? '-'}  ${at.candidate.name}`)
        }
        return 0
      }

      let made = 0
      let updated = 0
      const byName = new Map<string, string>()
      // Everything already in the universe can be a link target, so a new
      // article can attach to a country imported months ago.
      for (const item of existing) byName.set(item.name.toLowerCase(), item.id)

      for (const at of delta.assessments) {
        const { candidate: c } = at
        if (at.verdict === 'new') {
          const item = await s.add({
            container: c.container,
            name: c.name,
            kind: c.kind,
            summary: c.summary,
            attributes: importedAttributes(c),
            stub: !c.summary,
          })
          byName.set(c.name.toLowerCase(), item.id)
          made++
        } else if (at.verdict === 'update' && at.existing) {
          await s.update(at.existing.id, {
            summary: c.summary,
            kind: c.kind ?? at.existing.kind,
            attributes: importedAttributes(c),
          })
          byName.set(at.existing.name.toLowerCase(), at.existing.id)
          updated++
        } else if (at.existing) {
          byName.set(at.existing.name.toLowerCase(), at.existing.id)
        }
      }

      // Links go on afterwards, once every name in the plan has an id.
      let linked = 0
      let bordered = 0
      for (const at of delta.assessments) {
        if (at.verdict === 'unchanged') continue
        const c = at.candidate
        const child = byName.get(c.name.toLowerCase())
        if (!child) continue

        const parent = (c.parentNames ?? []).map((n) => byName.get(n.toLowerCase())).find(Boolean)
        if (parent && parent !== child && !(await linkedAlready(s, child, parent))) {
          await s.link(child, parent)
          linked++
        }
        for (const rel of c.relations ?? []) {
          const other = byName.get(rel.name.toLowerCase())
          if (!other || other === child || (await linkedAlready(s, child, other))) continue
          await s.link(child, other, { a: rel.role, b: rel.reverseRole })
          bordered++
        }
      }

      const universeDir = join(universesRoot(), s.universeId)
      await saveMapSource(universeDir, svg)

      console.log(
        NL +
          `Created ${made}, updated ${updated}, ${linked} parent link(s), ${bordered} peer link(s).`,
      )
      console.log('Map saved to the universe.')
      return 0
    }

    case 'validate': {
      const s = await store(a)
      const issues = await validate(s)
      for (const i of issues) console.log(`${i.severity.toUpperCase()}: ${i.message}`)
      const errors = issues.filter((i) => i.severity === 'error').length
      console.log(errors ? `\n${errors} error(s).` : `\nStore is consistent (${issues.length} warning(s)).`)
      return errors ? 1 : 0
    }

    default:
      console.error(`Unknown command "${cmd}"\n\n${USAGE}`)
      return 1
  }
}

main(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (e: unknown) => {
    // A canon violation is a legitimate answer, not a crash: it is the store
    // telling a skill that the thing it wants to write is not true.
    if (e instanceof CanonViolation) console.error(`CANON VIOLATION\n\n${e.message}`)
    else console.error(e instanceof Error ? e.message : String(e))
    process.exit(1)
  },
)

/** A link already recorded is not written twice, so a re-import stays quiet. */
async function linkedAlready(store: Store, a: string, b: string): Promise<boolean> {
  const item = await store.get(a)
  return !!item?.tags.some((tag) => tag.relatedTo === b)
}
