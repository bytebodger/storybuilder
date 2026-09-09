import { useEffect, useState } from 'react'
import { canonCheck } from '../api'
import type { CanonCheckResult, FindingKind } from '../types'

interface Props {
  universe: string
  itemId: string
  itemName: string
  onDone: () => void
  /** Called instead of rendering when there is nothing to report. */
  onEmpty: () => void
  onEdit: () => void
}

const LABEL: Record<FindingKind, string> = {
  'closed-set': 'Contradicts a settled set',
  contradiction: 'Contradicts canon',
  'natural-law': 'Breaks a natural law',
  extancy: 'Treats something ended as present',
  'out-of-span': 'Outside the canon’s years',
  'unknown-reference': 'Unrecorded reference',
}

/**
 * The second half of the save flow.
 *
 * It reports and does not fix. A contradiction between a good paragraph and an
 * early canon note is often best resolved by changing the note, and only the
 * author can know which way round it goes.
 */
export function CanonCheck({ universe, itemId, itemName, onDone, onEmpty, onEdit }: Props) {
  const [result, setResult] = useState<CanonCheckResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    canonCheck(universe, itemId).then(
      (r) => {
        if (!live) return
        // Nothing to say, so say nothing: the author goes straight to the article.
        if (r.findings.length === 0 && !r.error) return onEmpty()
        setResult(r)
      },
      (e: unknown) => live && setError(e instanceof Error ? e.message : String(e)),
    )
    return () => {
      live = false
    }
  }, [universe, itemId, onEmpty])

  if (error) {
    return (
      <section className="panel">
        <p className="error">Canon check failed: {error}</p>
        <button type="button" className="primary" onClick={onDone}>
          Continue
        </button>
      </section>
    )
  }

  if (!result) {
    return (
      <section className="panel">
        <p className="empty">Checking {itemName} against canon…</p>
      </section>
    )
  }

  return (
    <section className="panel">
      <div className="form-head">
        <h2>Canon check: {itemName}</h2>
        <div className="field-actions">
          <button type="button" className="icon" onClick={onEdit}>
            Edit the article
          </button>
          <button type="button" className="primary" onClick={onDone}>
            Keep as written
          </button>
        </div>
      </div>

      <p className="help">
        Nothing here has been changed. A contradiction between a good paragraph and an early canon
        note is sometimes best fixed by changing the note — that call is yours.
      </p>

      {result.error && <p className="error">{result.error}</p>}

      <div className="findings">
        {result.findings.map((f, i) => (
          <article key={i} className={`finding ${f.kind}`}>
            <header>
              <span className="finding-kind">{LABEL[f.kind] ?? f.kind}</span>
              {f.field && <span className="examples">in {f.field}</span>}
            </header>
            <blockquote>{f.passage}</blockquote>
            {f.says && (
              <p className="help">
                <strong>Canon says:</strong> {f.says}
              </p>
            )}
            {f.resolve && (
              <p className="help">
                <strong>Resolve by:</strong> {f.resolve}
              </p>
            )}
          </article>
        ))}
      </div>

      {result.resolved.length > 0 && (
        <p className="help">
          Resolved by stubs you just created: {result.resolved.map((r) => r.matched).join(', ')}.
        </p>
      )}
    </section>
  )
}
