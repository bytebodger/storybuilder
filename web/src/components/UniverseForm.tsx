import { useEffect, useMemo, useState } from 'react'
import { forge, getUniverse, saveUniverse, universeFields } from '../api'
import type { Universe, UniverseDraft, UniverseField } from '../types'
import { FieldRow } from './FieldRow'

interface Props {
  /** Absent when creating a new universe. */
  universeId?: string
  onSaved: (u: Universe) => void
  onCancel: () => void
}

const isEmpty = (v: unknown) =>
  v === null || v === undefined || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0)

export function UniverseForm({ universeId, onSaved, onCancel }: Props) {
  const [fields, setFields] = useState<UniverseField[]>([])
  const [values, setValues] = useState<UniverseDraft>({})
  const [locked, setLocked] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    universeFields().then(setFields, (e: unknown) => setError(String(e)))
  }, [])

  useEffect(() => {
    if (!universeId) return
    getUniverse(universeId).then(
      (u) => setValues(Object.fromEntries(Object.entries(u).filter(([k]) => k !== 'id' && !k.endsWith('At')))),
      (e: unknown) => setError(String(e)),
    )
  }, [universeId])

  const name = typeof values.name === 'string' ? values.name : ''

  /** Regeneration targets: never a locked field, and never one already filled. */
  const unlockedEmpty = useMemo(
    () => fields.filter((f) => !locked.has(f.key) && isEmpty(values[f.key])).map((f) => f.key),
    [fields, locked, values],
  )

  async function generate(fill: string[]) {
    if (fill.length === 0) {
      setNote('Nothing to generate — every field is locked or already filled.')
      return
    }
    setBusy(fill.length === 1 ? fill[0] : 'form')
    setNote(null)
    setError(null)
    try {
      // Clear first, so a regenerated field is replaced rather than merged into.
      setValues((v) => ({ ...v, ...Object.fromEntries(fill.map((k) => [k, null])) }))
      const current = Object.fromEntries(Object.entries(values).filter(([k]) => !fill.includes(k)))
      const result = await forge(fill, current)

      if (result.error) setError(result.error)
      setValues((v) => ({ ...v, ...result.values }))

      const missed = fill.filter((k) => !(k in result.values))
      const notes = [
        result.dropped.length ? `Ignored unrequested field(s): ${result.dropped.join(', ')}.` : '',
        missed.length ? `No value came back for: ${missed.join(', ')}.` : '',
      ].filter(Boolean)
      setNote(notes.join(' ') || null)
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
      onSaved(await saveUniverse(values, universeId))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className="panel">
      <div className="form-head">
        <h2>{universeId ? `Edit ${name || universeId}` : 'New universe'}</h2>
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

      <p className="help">
        Write any field yourself, or leave it blank and let the generator suggest something. Locked
        fields are never emptied or regenerated.
      </p>

      {note && <p className="note">{note}</p>}
      {error && <p className="error">{error}</p>}

      <div className="fields">
        {fields.map((f) => (
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

      <button type="button" className="primary" onClick={save} disabled={!!busy || !name.trim()}>
        {busy === 'save' ? 'Saving…' : 'Save universe'}
      </button>
      {!name.trim() && <p className="help">A universe needs a name before it can be saved.</p>}
    </section>
  )
}
