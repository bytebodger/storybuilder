import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { addTimeline, chronology, dropTimeline, editTimeline } from '../api'
import type { ChronologyEvent, NavItem, TimelineLane } from '../types'

interface Props {
  universe: string
  onOpen: (item: NavItem) => void
}

const ROOT = 'universal'

/** How many distinct colours before they start again. Matches `--tl-0..9`. */
const TIMELINE_COLOURS = 10

/**
 * A universe's history, drawn.
 *
 * Two halves that answer different questions. The **lanes** put every timeline
 * against one shared year axis, so nesting and simultaneity are visible at a
 * glance - which reign contained which war, and what else was going on at the
 * time. The **chronology** below lists the events in order, which is how anyone
 * actually reads history.
 *
 * Selecting a lane narrows the list to that timeline and everything beneath it,
 * because a timeline contains its descendants: an event under the War of the
 * Stewards is part of the reign the war was fought in, and a view that made you
 * click through four levels to find that out would be hiding the one
 * relationship it exists to show.
 */
export function Chronology({ universe, onOpen }: Props) {
  const [lanes, setLanes] = useState<TimelineLane[]>([])
  const [events, setEvents] = useState<ChronologyEvent[]>([])
  const [selected, setSelected] = useState<string>(ROOT)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState({ name: '', parent: ROOT })
  const [renaming, setRenaming] = useState<string | null>(null)
  const [rename, setRename] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await chronology(universe)
      setLanes(data.timelines)
      setEvents(data.events)
      setError(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [universe])

  useEffect(() => {
    load()
  }, [load])

  /** A timeline and everything under it — the set an event is measured against. */
  const within = useMemo(() => {
    const out = new Set([selected])
    let grew = true
    while (grew) {
      grew = false
      for (const lane of lanes) {
        if (lane.parent && out.has(lane.parent) && !out.has(lane.id)) {
          out.add(lane.id)
          grew = true
        }
      }
    }
    return out
  }, [lanes, selected])

  const nameOf = useMemo(
    () => new Map(lanes.map((l) => [l.id, l.name] as const)),
    [lanes],
  )

  /*
   * A colour per timeline, cycled, assigned in the order they are drawn.
   *
   * Every lane the same colour makes a wall rather than a set of timelines, and
   * the list of events below it a wall of one colour too. Assigned by position
   * rather than by a hash of the id, so the colours walk down the tree in order
   * instead of arriving scattered - and so two adjacent timelines can never
   * collide onto the same hue by bad luck, which reads as a bug. They repeat
   * past the tenth, which is the trade for that.
   */
  const colourOf = useMemo(() => {
    const out = new Map<string, string>()
    lanes.forEach((lane, i) => out.set(lane.id, `var(--tl-${i % TIMELINE_COLOURS})`))
    return out
  }, [lanes])

  /** The colour as an inline custom property, which the stylesheet reads. */
  const tint = (timeline: string | undefined): CSSProperties =>
    ({ '--tl': colourOf.get(timeline ?? '') }) as CSSProperties

  /*
   * The axis. Every lane is drawn against the same range, or the nesting would
   * be a lie: a war that occupies a quarter of its reign has to look like a
   * quarter of it, not like a full-width bar of its own.
   */
  const axis = useMemo(() => {
    const years = events.map((e) => e.year).filter((y): y is number => y !== null)
    if (!years.length) return null
    let first = Math.min(...years)
    let last = Math.max(...years)
    // A universe whose whole history is one year still needs an axis with width.
    if (first === last) {
      first -= 1
      last += 1
    }
    const pad = Math.max(1, Math.round((last - first) * 0.04))
    return { first: first - pad, last: last + pad }
  }, [events])

  const at = (year: number) =>
    axis ? ((year - axis.first) / (axis.last - axis.first)) * 100 : 0

  const ticks = useMemo(() => {
    if (!axis) return []
    const range = axis.last - axis.first
    const rough = range / 5
    const magnitude = 10 ** Math.floor(Math.log10(rough))
    const step = [1, 2, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? magnitude
    const out: number[] = []
    for (let y = Math.ceil(axis.first / step) * step; y <= axis.last; y += step) out.push(y)
    return out
  }, [axis])

  const listed = events.filter((e) => within.has(e.timeline))
  const dated = listed.filter((e) => e.year !== null)
  const undated = listed.filter((e) => e.year === null)

  async function act<T>(work: Promise<T>) {
    try {
      await work
      setError(null)
      await load()
    } catch (e: unknown) {
      // A refused placement is the tree saying no, which is an answer, and it
      // arrives already worded for a reader.
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const chosen = lanes.find((l) => l.id === selected)

  if (loading && !lanes.length) {
    return (
      <section className="panel">
        <p className="empty">Loading…</p>
      </section>
    )
  }

  return (
    <section className="panel chronology">
      <div className="form-head">
        <h2>Chronology</h2>
        <div className="field-actions">
          <button type="button" className="icon" onClick={() => setAdding((v) => !v)}>
            {adding ? 'Cancel' : '+ New timeline'}
          </button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {adding && (
        <div className="timeline-add">
          <input
            autoFocus
            placeholder="Name — e.g. Reign of King Tarinian"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            onKeyDown={(e) => {
              if (e.key !== 'Enter' || !draft.name.trim()) return
              act(addTimeline(universe, draft.name.trim(), draft.parent)).then(() => {
                setDraft({ name: '', parent: draft.parent })
                setAdding(false)
              })
            }}
          />
          <label>
            under
            <select value={draft.parent} onChange={(e) => setDraft({ ...draft, parent: e.target.value })}>
              {lanes.map((l) => (
                <option key={l.id} value={l.id}>
                  {'  '.repeat(l.depth) + l.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="primary"
            disabled={!draft.name.trim()}
            onClick={() =>
              act(addTimeline(universe, draft.name.trim(), draft.parent)).then(() => {
                setDraft({ name: '', parent: draft.parent })
                setAdding(false)
              })
            }
          >
            Add
          </button>
        </div>
      )}

      {axis && (
        <div className="lanes">
          <div className="lane-axis">
            <span className="lane-name" />
            <div className="lane-track">
              {ticks.map((year) => (
                <span key={year} className="tick" style={{ left: `${at(year)}%` }}>
                  {year}
                </span>
              ))}
            </div>
          </div>

          {lanes.map((lane) => {
            const own = events.filter((e) => e.timeline === lane.id && e.year !== null)
            // Several events in one year on one lane are one mark. At the scale
            // of a whole history they would sit on top of each other anyway,
            // and a mark that says "3" is more honest than three that overlap.
            const marks = new Map<number, ChronologyEvent[]>()
            for (const e of own) marks.set(e.year!, [...(marks.get(e.year!) ?? []), e])

            return (
              <button
                type="button"
                key={lane.id}
                className={lane.id === selected ? 'lane selected' : 'lane'}
                style={tint(lane.id)}
                onClick={() => setSelected(lane.id)}
              >
                <span className="lane-name" style={{ paddingLeft: `${lane.depth * 0.85}rem` }}>
                  {lane.name}
                  <span className="lane-count">{lane.count || ''}</span>
                </span>
                <div className="lane-track">
                  {lane.first !== null && lane.last !== null && (
                    <span
                      className="lane-bar"
                      style={{
                        left: `${at(lane.first)}%`,
                        width: `${Math.max(at(lane.last) - at(lane.first), 0.6)}%`,
                      }}
                    />
                  )}
                  {[...marks].map(([year, group]) => (
                    <span
                      key={year}
                      className="lane-mark"
                      style={{ left: `${at(year)}%` }}
                      title={`${year}: ${group.map((e) => e.name).join(', ')}`}
                    >
                      {group.length > 1 ? group.length : ''}
                    </span>
                  ))}
                </div>
              </button>
            )
          })}

          {/* Without this the root reads as broken: a lane with a full-width
              bar and no marks on it, because everything is filed further down. */}
          <p className="lane-legend">
            <span>
              <i className="key-bar" /> spans everything filed here or below
            </span>
            <span>
              <i className="key-mark" /> an event filed on this timeline
            </span>
          </p>
        </div>
      )}

      {chosen && (
        <div className="timeline-actions">
          <strong>{chosen.name}</strong>
          {chosen.first !== null && (
            <span className="muted">
              {chosen.first === chosen.last ? chosen.first : `${chosen.first} – ${chosen.last}`}
            </span>
          )}
          <span className="muted">
            {chosen.count} event{chosen.count === 1 ? '' : 's'} here and below
          </span>

          {chosen.id === ROOT ? (
            // Everything else in the tree is described by where it sits relative
            // to this one, so it has nowhere to be moved to.
            <span className="muted">The Universal History is fixed.</span>
          ) : renaming === chosen.id ? (
            <>
              <input
                autoFocus
                value={rename}
                onChange={(e) => setRename(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setRenaming(null)
                  if (e.key !== 'Enter' || !rename.trim()) return
                  act(editTimeline(universe, chosen.id, { name: rename.trim() })).then(() =>
                    setRenaming(null),
                  )
                }}
              />
              <button
                type="button"
                className="icon"
                onClick={() =>
                  act(editTimeline(universe, chosen.id, { name: rename.trim() })).then(() =>
                    setRenaming(null),
                  )
                }
              >
                Save
              </button>
              <button type="button" className="icon" onClick={() => setRenaming(null)}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="icon"
                onClick={() => {
                  setRename(chosen.name)
                  setRenaming(chosen.id)
                }}
              >
                Rename
              </button>
              <label>
                under
                <select
                  value={chosen.parent ?? ROOT}
                  onChange={(e) => act(editTimeline(universe, chosen.id, { parent: e.target.value }))}
                >
                  {lanes
                    // Its own descendants are not offered: the tree refuses the
                    // move anyway, and an option that always errors is a trap.
                    .filter((l) => !within.has(l.id))
                    .map((l) => (
                      <option key={l.id} value={l.id}>
                        {'  '.repeat(l.depth) + l.name}
                      </option>
                    ))}
                </select>
              </label>
              <button
                type="button"
                className="icon danger"
                title="Its child timelines and its events move up in its place"
                onClick={() => {
                  act(dropTimeline(universe, chosen.id)).then(() => setSelected(chosen.parent ?? ROOT))
                }}
              >
                Remove
              </button>
            </>
          )}
        </div>
      )}

      {listed.length === 0 ? (
        <p className="empty">
          {events.length === 0 ?
            'No events yet. Add one under History and it will appear here, on the timeline you file it into.'
          : 'Nothing is filed under this timeline.'}
        </p>
      ) : (
        <ol className="chron-list">
          {dated.map((event) => (
            <li key={event.id}>
              <span className="chron-year">{event.year}</span>
              <button
                type="button"
                className="chron-name"
                style={tint(event.timeline)}
                onClick={() => onOpen({ id: event.id, name: event.name })}
              >
                {event.name}
                {event.stub && <span className="badge">stub</span>}
              </button>
              <span className="chron-where">{nameOf.get(event.timeline)}</span>
              <span className="chron-when">
                {event.beginDate}
                {event.durationDays ?
                  ` · ${event.durationDays} day${event.durationDays === 1 ? '' : 's'}`
                : ''}
              </span>
              {event.summary && <p className="chron-summary">{event.summary}</p>}
            </li>
          ))}
        </ol>
      )}

      {undated.length > 0 && (
        <div className="chron-undated">
          <h4>Not on the line</h4>
          <p className="help">
            No year could be read out of these dates, so they cannot be placed — but they are filed
            here, and they count.
          </p>
          <ul>
            {undated.map((event) => (
              <li key={event.id}>
                <button
                  type="button"
                  className="chron-name"
                  style={tint(event.timeline)}
                  onClick={() => onOpen({ id: event.id, name: event.name })}
                >
                  {event.name}
                </button>
                <span className="chron-when">
                  {event.beginDate ? `“${event.beginDate}”` : 'no begin date'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
