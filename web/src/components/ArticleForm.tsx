import { useEffect, useMemo, useState } from 'react'
import { containerFields, defaultsFrom, forge, getItem, saveItem } from '../api'
import type { UniverseDraft, UniverseField } from '../types'
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

  useEffect(() => {
    containerFields(container).then((spec) => {
      setFields(spec)
      // Defaults belong to a new article only. On an edit the stored values
      // arrive next and a default would overwrite a field cleared on purpose.
      if (spec && !itemId) setValues(defaultsFrom(spec))
    }, (e: unknown) => setError(String(e)))
  }, [container, itemId])

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

  async function generate(fill: string[]) {
    if (fill.length === 0) {
      setNote('Nothing to generate — every field is locked or already filled.')
      return
    }
    setBusy(fill.length === 1 ? fill[0] : 'form')
    setNote(null)
    setError(null)
    try {
      setValues((v) => ({ ...v, ...Object.fromEntries(fill.map((k) => [k, null])) }))
      const current = Object.fromEntries(Object.entries(values).filter(([k]) => !fill.includes(k)))
      const result = await forge(fill, current, container, universe)

      if (result.error) setError(result.error)
      setValues((v) => ({ ...v, ...result.values }))

      const missed = fill.filter((k) => !(k in result.values))
      setNote(
        [
          result.dropped.length ? `Ignored unrequested field(s): ${result.dropped.join(', ')}.` : '',
          missed.length ? `No value came back for: ${missed.join(', ')}.` : '',
        ]
          .filter(Boolean)
          .join(' ') || null,
      )
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(null)
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
            onClick={() => generate(unlockedEmpty)}
          >
            {busy === 'form' ? 'Generating…' : `Fill ${unlockedEmpty.length} empty field(s)`}
          </button>
          <button type="button" className="icon" onClick={onCancel} disabled={!!busy}>
            Cancel
          </button>
        </div>
      </div>

      {note && <p className="note">{note}</p>}
      {error && <p className="error">{error}</p>}

      <div className="fields">
        {spec.map((f) => (
          <FieldRow
            key={f.key}
            field={f}
            value={values[f.key]}
            locked={locked.has(f.key)}
            busy={!!busy}
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

      <button type="button" className="primary" onClick={save} disabled={!!busy || missing.length > 0}>
        {busy === 'save' ? 'Saving…' : 'Save article'}
      </button>
      {missing.length > 0 && (
        <p className="help">Still required: {missing.map((f) => f.label).join(', ')}.</p>
      )}
    </section>
  )
}
