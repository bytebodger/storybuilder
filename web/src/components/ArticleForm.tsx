import { useEffect, useMemo, useState } from 'react'
import { containerFields, defaultsFrom, forge, getItem, saveItem, skeleton, timelines } from '../api'
import type { Skeleton, TimelineNode, UniverseDraft, UniverseField } from '../types'
import { FieldRow } from './FieldRow'

interface Props {
  universe: string
  container: string
  label: string
  /** Absent when creating. */
  itemId?: string
  onSaved: (item: { id: string; name: string; kind?: string }) => void
  onCancel: () => void
}

/**
 * How many fields go into one generation request.
 *
 * Every request pays a large fixed cost - loading the CLI, the skill, and the
 * universe brief - and it dominates: a batch of six short date fields was timed
 * at 78 seconds, which is nearly all setup. So one request per section is too
 * many requests. A person's ten sections take about thirteen minutes that way,
 * against six for a single request for all fifty-eight fields.
 *
 * Fourteen merges those ten sections into five. That is roughly the wall-clock
 * of the single request, with something arriving every minute or so instead of
 * nothing arriving for six. A spec of fourteen fields or fewer is one request,
 * exactly as before.
 */
const BATCH_SIZE = 14

const isEmpty = (v: unknown) =>
  v === null ||
  v === undefined ||
  (typeof v === 'string' && v.trim() === '') ||
  (Array.isArray(v) && v.length === 0)

/**
 * The same form as the universe manifest, over a different spec.
 *
 * Generation differs in one way that matters: an article is generated inside a
 * universe, so the request carries it and the skill can ground the result in
 * canon that already exists.
 */
export function ArticleForm({ universe, container, label, itemId, onSaved, onCancel }: Props) {
  const [fields, setFields] = useState<UniverseField[] | null>(null)
  const [values, setValues] = useState<UniverseDraft>({})
  const [locked, setLocked] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lines, setLines] = useState<TimelineNode[]>([])
  /** Which batch of a sectioned generation is running, for the button. */
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  /** Per field, every value the author has regenerated away from this session. */
  const [rejected, setRejected] = useState<Record<string, unknown[]>>({})

  useEffect(() => {
    containerFields(container).then((spec) => {
      setFields(spec)
      // Defaults belong to a new article only. On an edit the stored values
      // arrive next and a default would overwrite a field cleared on purpose.
      if (spec && !itemId) setValues(defaultsFrom(spec))
    }, (e: unknown) => setError(String(e)))
  }, [container, itemId])

  // Only fetched for a spec that has somewhere to put them.
  useEffect(() => {
    if (!fields?.some((f) => f.kind === 'timeline')) return
    timelines(universe).then(setLines, (e: unknown) => setError(String(e)))
  }, [universe, fields])

  useEffect(() => {
    if (!itemId) return
    getItem(universe, itemId).then(
      (r) => setValues(r.values),
      (e: unknown) => setError(String(e)),
    )
  }, [universe, itemId])

  const spec = fields ?? []
  const unlockedEmpty = useMemo(
    () => spec.filter((f) => !locked.has(f.key) && isEmpty(values[f.key])).map((f) => f.key),
    [spec, locked, values],
  )
  const required = spec.filter((f) => f.required)
  const missing = required.filter((f) => isEmpty(values[f.key]))

  /*
   * The spec, cut into the sections it declares.
   *
   * A run of fields sharing a group becomes one section, in spec order - the
   * spec decides what follows what, and this only draws a line where the group
   * changes. A spec that declares no groups comes back as a single untitled
   * section and renders exactly as it did before sections existed.
   */
  const sections = useMemo(() => {
    const out: { title: string; fields: UniverseField[] }[] = []
    for (const field of spec) {
      const title = field.group ?? ''
      const last = out[out.length - 1]
      if (last && last.title === title) last.fields.push(field)
      else out.push({ title, fields: [field] })
    }
    return out
  }, [spec])

  /*
   * A whole form is generated a section at a time, not in one request.
   *
   * A person has fifty-eight fields, most of them prose. Asked for at once they
   * are one enormous answer that takes minutes to arrive, shows nothing while
   * it does, and is lost entire if anything goes wrong in it. Asked for by
   * section they arrive in pieces a reader can watch land, each one keeping
   * whatever came before.
   *
   * Each batch is given everything settled so far, the previous batches
   * included, so a life story still coheres with the name at the top of it.
   */
  function batches(fill: string[]): string[][] {
    const runs: string[][] = []

    for (const section of sections) {
      const keys = section.fields.map((f) => f.key).filter((k) => fill.includes(k))
      if (!keys.length) continue
      // Adjacent sections ride together while they fit, which keeps related
      // fields in one request without making that request enormous.
      const last = runs[runs.length - 1]
      if (last && last.length + keys.length <= BATCH_SIZE) last.push(...keys)
      else runs.push([...keys])
    }

    // Nothing goes out over the size, section or no section - a spec that
    // declares no groups is one long run otherwise.
    const sized = runs.flatMap((run) => {
      if (run.length <= BATCH_SIZE) return [run]
      const split: string[][] = []
      for (let i = 0; i < run.length; i += BATCH_SIZE) split.push(run.slice(i, i + BATCH_SIZE))
      return split
    })
    return sized.length ? sized : [fill]
  }

  /**
   * Roll first, then write.
   *
   * The die settles what a die can settle - a trade, a birthplace, a lifespan,
   * whether this person has a title at all - and those land on the form at
   * once, before a single request goes out. Then the prose is written around
   * facts that are already on screen.
   *
   * Two things come of that. Every person is no longer the most obvious person
   * this world could produce; and something appears immediately instead of two
   * minutes later.
   */
  async function fillWholeForm() {
    let roll: Skeleton | null = null
    try {
      roll = await skeleton(universe, container)
    } catch {
      // A world with nothing to roll from is not a failure. Generate as before.
    }

    if (roll) {
      const settled = Object.fromEntries(
        Object.entries(roll.values).filter(
          ([key, v]) => !isEmpty(v) && !locked.has(key) && isEmpty(values[key]),
        ),
      )
      setValues((v) => ({ ...v, ...settled }))
      await generate(
        unlockedEmpty.filter((k) => !(k in settled)),
        { ...roll, values: settled },
      )
      return
    }
    await generate(unlockedEmpty)
  }

  async function generate(fill: string[], roll?: Skeleton | null) {
    if (fill.length === 0) {
      setNote('Nothing to generate — every field is locked or already filled.')
      return
    }
    /*
     * What the die settled is not asked for, and what it says this person does
     * not have is not asked for either.
     *
     * The second half is the one that matters. A model handed an optional field
     * fills it: asked for an honorific it returns one, and every person in the
     * world comes back a Captain with three swashbuckling nicknames. The only
     * way to get a person with no title is to not ask for one.
     */
    if (roll) fill = fill.filter((k) => !(k in roll.values) && !roll.omit.includes(k))
    if (fill.length === 0) {
      setNote('The roll settled everything there was to settle.')
      return
    }
    const runs = batches(fill)

    /*
     * Everything these fields have offered and had turned down.
     *
     * Clicking Regenerate asks the same question the form asked a moment ago,
     * and an identical question gets an identical answer. Sending only the
     * value on screen buys exactly one step and then cycles: reject Halvard and
     * get Elkirk, reject Elkirk and Halvard is fair game again. So the whole
     * history is kept, per field, for as long as the form is open.
     */
    const avoid: Record<string, unknown[]> = {}
    for (const key of fill) {
      const seen = [...(rejected[key] ?? []), values[key]].filter((v) => !isEmpty(v))
      if (seen.length) avoid[key] = seen
    }
    setRejected((prev) => ({ ...prev, ...avoid }))

    setBusy(fill.length === 1 ? fill[0] : 'form')
    setNote(null)
    setError(null)
    setValues((v) => ({ ...v, ...Object.fromEntries(fill.map((k) => [k, null])) }))

    const dropped: string[] = []
    const missed: string[] = []
    // The running answer, because setValues is not synchronous and the next
    // batch has to be told what the last one decided.
    let settled = Object.fromEntries(Object.entries(values).filter(([k]) => !fill.includes(k)))

    /*
     * The first batch alone, then the rest together.
     *
     * The first is the identity - the name, the overview, what this person is -
     * and everything else hangs off it. Nothing else hangs off anything but it,
     * so the remaining batches have no reason to wait for each other. Run in
     * turn they were about four minutes; run together, about two.
     *
     * The cost is that the later batches cannot see each other, so a life story
     * and a set of motivations are each coherent with who this is and only
     * loosely with one another. That is the trade, and it is worth it: the
     * identity carries most of the coherence, and nobody wants to sit through
     * four minutes to find out what a stranger's hobbies are.
     */
    const merge = (result: { values: Record<string, unknown>; dropped: string[] }, run: string[]) => {
      setValues((v) => ({ ...v, ...result.values }))
      dropped.push(...result.dropped)
      missed.push(...run.filter((k) => !(k in result.values)))
    }

    let done = 0
    const step = () => setProgress({ done: ++done, total: runs.length })

    try {
      const [head, ...rest] = runs
      if (runs.length > 1) setProgress({ done: 0, total: runs.length })

      const first = await forge(head, settled, container, universe, avoid, roll?.notes)
      if (first.error) {
        setError(first.error)
        return
      }
      settled = { ...settled, ...first.values }
      merge(first, head)
      step()

      // Bounded, because each run is a separate CLI process holding a few
      // hundred megabytes. Four at once is fine; forty would not be.
      const failures: string[] = []
      const queue = [...rest]
      const workers = Array.from({ length: Math.min(3, queue.length) }, async () => {
        for (let run = queue.shift(); run; run = queue.shift()) {
          try {
            let result = await forge(run, settled, container, universe, avoid, roll?.notes)
            /*
             * One retry when a batch comes back with nothing.
             *
             * A run that produced no usable answer left a whole section of the
             * form blank, and the only sign of it was a line at the bottom
             * listing thirteen field names. Asking again costs one more request
             * and usually gets one; asking twice would be a policy of grinding.
             */
            if (result.error || !Object.keys(result.values).length) {
              result = await forge(run, settled, container, universe, avoid, roll?.notes)
            }
            // One batch failing is not the others failing. Whatever came back
            // stays on the form and the rest is reported.
            if (result.error) failures.push(result.error)
            else merge(result, run)
          } catch (e: unknown) {
            failures.push(e instanceof Error ? e.message : String(e))
          }
          step()
        }
      })
      await Promise.all(workers)
      if (failures.length) setError(failures[0])

      setNote(
        [
          dropped.length ? `Ignored unrequested field(s): ${dropped.join(', ')}.` : '',
          missed.length ? `No value came back for: ${missed.join(', ')}.` : '',
        ]
          .filter(Boolean)
          .join(' ') || null,
      )
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(null)
      setProgress(null)
    }
  }

  async function save() {
    setBusy('save')
    setError(null)
    try {
      onSaved(await saveItem({ universe, id: itemId, container, values }))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(null)
    }
  }

  if (fields === null && !error) return <section className="panel"><p className="empty">Loading…</p></section>
  if (fields !== null && fields.length === 0) {
    return (
      <section className="panel">
        <p className="empty">
          <strong>{label}</strong> has no article form yet — no field spec has been written for this
          container. Entries can still be created with the <code>sb</code> CLI.
        </p>
      </section>
    )
  }

  return (
    <section className="panel">
      <div className="form-head">
        <h2>{itemId ? `Edit ${String(values.name ?? '')}` : `New ${label}`}</h2>
        <div className="field-actions">
          <button
            type="button"
            className="icon"
            disabled={!!busy}
            title="Generate every unlocked field that is still empty"
            onClick={fillWholeForm}
          >
            {busy !== 'form' ?
              `Fill ${unlockedEmpty.length} empty field(s)`
            : progress ?
              // Completions rather than position: the later sections run at the
              // same time, so "3 of 5" is a count of what has landed, not of
              // which one is in flight.
              `Generated ${progress.done} of ${progress.total}…`
            : 'Generating…'}
          </button>
          <button type="button" className="icon" onClick={onCancel} disabled={!!busy}>
            Cancel
          </button>
        </div>
      </div>

      {busy === 'form' && (
        <p className="note">
          Writing a long form takes a couple of minutes. The name and overview go first, then the
          rest of the sections are written at the same time and fill in as they arrive. Anything
          already on the form is kept.
        </p>
      )}
      {note && <p className="note">{note}</p>}
      {error && <p className="error">{error}</p>}

      {sections.map(({ title, fields: rows }) => (
        <div className="fields" key={title || '-'}>
          {title && <h3 className="section">{title}</h3>}
          {rows.map((f) => (
            <FieldRow
              key={f.key}
              field={f}
              value={values[f.key]}
              locked={locked.has(f.key)}
              busy={!!busy}
              timelines={lines}
              onChange={(v) => setValues((prev) => ({ ...prev, [f.key]: v }))}
              onToggleLock={() =>
                setLocked((prev) => {
                  const next = new Set(prev)
                  if (!next.delete(f.key)) next.add(f.key)
                  return next
                })
              }
              onClear={() => setValues((prev) => ({ ...prev, [f.key]: f.kind === 'list' ? [] : null }))}
              onRegenerate={() => generate([f.key])}
            />
          ))}
        </div>
      ))}

      <button type="button" className="primary" onClick={save} disabled={!!busy || missing.length > 0}>
        {busy === 'save' ? 'Saving…' : 'Save article'}
      </button>
      {missing.length > 0 && (
        <p className="help">Still required: {missing.map((f) => f.label).join(', ')}.</p>
      )}
    </section>
  )
}
