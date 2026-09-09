import { useEffect, useState } from 'react'
import { createStubs, scanStubs, stubContainers } from '../api'
import type { StubContainer, StubScan } from '../types'

interface Props {
  universe: string
  /** The article just saved. Stubs found in it are linked back to it. */
  itemId: string
  itemName: string
  onDone: () => void
  /** Called instead of rendering when the article left no loose ends. */
  onEmpty: () => void
}

interface Row {
  term: string
  /** The term as it appeared in the prose, kept even if the title is edited. */
  original: string
  container: string
  context?: string
  field?: string
  accepted: boolean
}

/**
 * Every candidate on one screen, accept or reject each, edit the title, pick the
 * container.
 *
 * Nothing is accepted by default. A stub the author did not choose is a name in
 * their world they did not put there, and a screen that creates things by
 * default trains them to click past it.
 */
export function StubReview({ universe, itemId, itemName, onDone, onEmpty }: Props) {
  const [scan, setScan] = useState<StubScan | null>(null)
  const [rows, setRows] = useState<Row[]>([])
  const [containers, setContainers] = useState<StubContainer[]>([])
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    stubContainers().then(setContainers, () => setContainers([]))
    let live = true
    scanStubs(universe, itemId).then(
      (s) => {
        if (!live) return
        // Nothing unexplained, so the author never sees this step at all.
        if (s.candidates.length === 0 && !s.error) return onEmpty()
        setScan(s)
        setRows(s.candidates.map((c) => ({ ...c, original: c.term, accepted: false })))
      },
      (e: unknown) => live && setError(e instanceof Error ? e.message : String(e)),
    )
    return () => {
      live = false
    }
  }, [universe, itemId, onEmpty])

  const accepted = rows.filter((r) => r.accepted && r.term.trim() && r.container)
  const update = (i: number, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r, n) => (n === i ? { ...r, ...patch } : r)))

  async function create() {
    setBusy(true)
    setError(null)
    try {
      const res = await createStubs(
        universe,
        // The original term goes along as an alias, so the canon check that
        // runs next recognises the reference even under a retitled stub.
        accepted.map((r) => ({ term: r.term.trim(), container: r.container, alias: r.original })),
        itemId,
      )
      setResult(
        [
          res.created.length ? `Created ${res.created.length} stub(s).` : 'Nothing created.',
          ...res.skipped.map((s) => `Skipped ${s.term}: ${s.why}`),
        ].join(' '),
      )
      setRows((prev) => prev.filter((r) => !r.accepted))
      // The created stubs are canon now, which is what the canon check needs.
      onDone()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="panel">
      <div className="form-head">
        <h2>Loose ends in {itemName}</h2>
        <button type="button" className="icon" onClick={onDone}>
          {rows.some((r) => r.accepted) ? 'Skip the rest' : 'None of these'}
        </button>
      </div>

      <p className="help">
        Terms this article leans on that the universe has not written down. A stub records the name so
        a later session can find it — nothing else is created, and no text is generated for it.
      </p>

      {error && <p className="error">{error}</p>}
      {result && <p className="note">{result}</p>}
      {scan?.error && <p className="error">{scan.error}</p>}
      {!scan && !error && <p className="empty">Reading {itemName} for loose ends…</p>}

      {scan && rows.length === 0 && result && (
        <p className="empty">Done. Continue to the canon check.</p>
      )}

      {rows.length > 0 && (
        <div className="stubs">
          {rows.map((row, i) => (
            <div key={`${row.term}-${i}`} className={row.accepted ? 'stub accepted' : 'stub'}>
              <label className="stub-check">
                <input
                  type="checkbox"
                  checked={row.accepted}
                  onChange={(e) => update(i, { accepted: e.target.checked })}
                />
                <span className="visually-hidden">Create a stub for {row.term}</span>
              </label>

              <div className="stub-body">
                <input
                  className="stub-title"
                  value={row.term}
                  aria-label="Stub title"
                  onChange={(e) => update(i, { term: e.target.value })}
                />
                <select
                  value={row.container}
                  aria-label="Container"
                  onChange={(e) => update(i, { container: e.target.value })}
                >
                  <option value="">Choose a container…</option>
                  {containers.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
                {row.context && <p className="help">{row.context}</p>}
                {row.field && <p className="examples">from {row.field}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {rows.length > 0 && (
        <button type="button" className="primary" disabled={busy || accepted.length === 0} onClick={create}>
          {busy ? 'Creating…' : `Create ${accepted.length} stub(s)`}
        </button>
      )}

      {scan?.alreadyKnown?.length ? (
        <p className="help">
          Already in this universe, so not proposed:{' '}
          {scan.alreadyKnown.map((k) => `${k.term} → ${k.matched}`).join(', ')}.
        </p>
      ) : null}
    </section>
  )
}
