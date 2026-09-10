import { useMemo, useState } from 'react'
import type { GroupedPlan, ImportCandidate } from '../types'

interface Props {
  plan: GroupedPlan
  busy: boolean
  onCancel: () => void
  onImport: (chosen: ImportCandidate[]) => void
}

/**
 * Reviewing thousands of candidates without a wall of thousands of checkboxes.
 *
 * The decision an author actually makes here is at the group level — keep every
 * country, drop every river — so groups are the interface and start collapsed.
 * Rows are underneath for the audit, not for the choosing.
 *
 * Unlike a stub proposal, everything is selected by default. The author already
 * scoped this by choosing a tier and two files; the plan is the consequence of
 * that choice rather than a set of guesses they never asked for.
 */
export function ImportReview({ plan, busy, onCancel, onImport }: Props) {
  const [dropped, setDropped] = useState<Set<string>>(new Set())
  const [open, setOpen] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState('')

  const needle = filter.trim().toLowerCase()
  const matches = (c: ImportCandidate) => !needle || c.name.toLowerCase().includes(needle)

  const chosen = useMemo(
    () => plan.groups.filter((g) => !dropped.has(g.key)).flatMap((g) => g.candidates),
    [plan.groups, dropped],
  )

  const toggleGroup = (key: string) =>
    setDropped((prev) => {
      const next = new Set(prev)
      if (!next.delete(key)) next.add(key)
      return next
    })

  const toggleOpen = (key: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (!next.delete(key)) next.add(key)
      return next
    })

  return (
    <>
      <div className="form-head">
        <h3>{plan.total.toLocaleString()} to import</h3>
        <div className="field-actions">
          <button type="button" className="icon" onClick={() => setDropped(new Set())}>
            Keep all
          </button>
          <button type="button" className="icon" onClick={() => setDropped(new Set(plan.groups.map((g) => g.key)))}>
            Drop all
          </button>
          <button type="button" className="icon" onClick={onCancel} disabled={busy}>
            Change the plan
          </button>
        </div>
      </div>

      {plan.warnings.map((w, i) => (
        <p key={i} className="note">
          {w}
        </p>
      ))}

      {/*
        A re-import is a comparison. Saying what is being left alone matters as
        much as saying what will be written: an author who has spent a month on
        these articles wants to know the import is not about to undo it.
      */}
      {plan.delta && (
        <p className="help">
          {plan.delta.new} new, {plan.delta.update} changed on the map.{' '}
          {plan.delta.unchanged > 0 && `${plan.delta.unchanged} already match. `}
          {plan.delta.edited > 0 && (
            <strong>
              {plan.delta.edited} written since they were imported — left untouched.{' '}
            </strong>
          )}
          {plan.delta.authored > 0 && `${plan.delta.authored} authored here, not from any import. `}
          {plan.delta.missing.length > 0 && (
            <>
              {plan.delta.missing.length} no longer on the map (
              {plan.delta.missing.slice(0, 4).join(', ')}
              {plan.delta.missing.length > 4 ? '…' : ''}) — kept, not deleted.
            </>
          )}
        </p>
      )}

      <label>
        Find
        <input value={filter} placeholder="A name, to check it is in here" onChange={(e) => setFilter(e.target.value)} />
      </label>

      <div className="groups">
        {plan.groups.map((group, i) => {
          const kept = !dropped.has(group.key)
          const shown = group.candidates.filter(matches)
          if (needle && shown.length === 0) return null

          // A heading wherever the container changes, so the list reads as the
          // sections of the world rather than as one undifferentiated run.
          const startsContainer = i === 0 || plan.groups[i - 1].container !== group.container
          const siblings = plan.groups.filter((g) => g.container === group.container)

          return (
            <div key={group.key} className={kept ? 'group kept' : 'group'}>
              {startsContainer && (
                <div className="container-head">
                  <span>{group.container}</span>
                  <button
                    type="button"
                    className="icon"
                    onClick={() =>
                      setDropped((prev) => {
                        const next = new Set(prev)
                        const allKept = siblings.every((g) => !next.has(g.key))
                        for (const g of siblings) allKept ? next.add(g.key) : next.delete(g.key)
                        return next
                      })
                    }
                  >
                    {siblings.every((g) => !dropped.has(g.key)) ? 'Drop all' : 'Keep all'}
                  </button>
                </div>
              )}
              <div className="group-head">
                <label className="group-check">
                  <input type="checkbox" checked={kept} onChange={() => toggleGroup(group.key)} />
                  <span className="group-name">{group.kind ?? group.container}</span>
                </label>
                <span className="group-count">{group.candidates.length.toLocaleString()}</span>
                <button type="button" className="icon" onClick={() => toggleOpen(group.key)}>
                  {open.has(group.key) || needle ? 'Hide' : 'List'}
                </button>
              </div>

              {(open.has(group.key) || needle) && (
                <ul className="group-items">
                  {shown.slice(0, 300).map((c) => (
                    <li key={c.name}>
                      {c.name}
                      {c.parentNames?.length ? <span className="examples"> in {c.parentNames[0]}</span> : null}
                      {c.summary ? <span className="help"> — {c.summary}</span> : null}
                    </li>
                  ))}
                  {shown.length > 300 && <li className="examples">…and {shown.length - 300} more</li>}
                </ul>
              )}
            </div>
          )
        })}
      </div>

      {plan.alreadyPresent.length > 0 && (
        <p className="help">
          {plan.alreadyPresent.length} already in this universe, so not offered:{' '}
          {plan.alreadyPresent.slice(0, 6).map((a) => a.matched).join(', ')}
          {plan.alreadyPresent.length > 6 ? '…' : ''}
        </p>
      )}

      <button type="button" className="primary" disabled={busy || chosen.length === 0} onClick={() => onImport(chosen)}>
        {busy ? 'Importing…' : `Import ${chosen.length.toLocaleString()} article(s)`}
      </button>
    </>
  )
}
