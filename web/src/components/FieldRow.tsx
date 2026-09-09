import type { UniverseField } from '../types'

interface Props {
  field: UniverseField
  value: unknown
  locked: boolean
  busy: boolean
  onChange: (value: unknown) => void
  onToggleLock: () => void
  onRegenerate: () => void
  onClear: () => void
}

/** List fields are edited as comma-separated text; the store keeps them as arrays. */
const toInput = (v: unknown) => (Array.isArray(v) ? v.join(', ') : v === null || v === undefined ? '' : String(v))

function fromInput(field: UniverseField, raw: string): unknown {
  if (field.kind === 'list') {
    const items = raw.split(',').map((s) => s.trim()).filter(Boolean)
    return items.length ? items : []
  }
  if (field.kind === 'number') {
    const n = Number(raw)
    return raw.trim() === '' ? null : Number.isFinite(n) ? n : raw
  }
  return raw
}

export function FieldRow({ field, value, locked, busy, onChange, onToggleLock, onRegenerate, onClear }: Props) {
  const text = toInput(value)
  const set = (raw: string) => onChange(fromInput(field, raw))

  return (
    <div className={locked ? 'field locked' : 'field'}>
      <div className="field-head">
        <label htmlFor={field.key}>
          {field.label}
          {field.required && <span className="req" title="Required"> *</span>}
        </label>
        <div className="field-actions">
          <button
            type="button"
            className={locked ? 'icon on' : 'icon'}
            aria-pressed={locked}
            title={locked ? 'Locked — regeneration will skip this field' : 'Lock this field'}
            onClick={onToggleLock}
          >
            {locked ? 'Locked' : 'Lock'}
          </button>
          <button
            type="button"
            className="icon"
            title="Clear this field"
            disabled={locked || busy || text === ''}
            onClick={onClear}
          >
            Clear
          </button>
          <button
            type="button"
            className="icon"
            title="Replace this field with a newly generated value"
            disabled={locked || busy}
            onClick={onRegenerate}
          >
            Regenerate
          </button>
        </div>
      </div>

      {field.kind === 'longtext' ? (
        <textarea id={field.key} rows={4} value={text} disabled={locked} onChange={(e) => set(e.target.value)} />
      ) : (
        <input
          id={field.key}
          type={field.kind === 'number' ? 'number' : 'text'}
          value={text}
          disabled={locked}
          placeholder={field.kind === 'list' ? 'Comma separated' : undefined}
          onChange={(e) => set(e.target.value)}
        />
      )}

      <p className="help">{field.help}</p>
      {field.examples?.length ? <p className="examples">e.g. {field.examples.join(' · ')}</p> : null}
    </div>
  )
}
