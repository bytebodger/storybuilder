import type { TimelineNode, UniverseField } from '../types'

interface Props {
  field: UniverseField
  value: unknown
  locked: boolean
  busy: boolean
  /** The universe's timelines, for a field whose value is one of them. */
  timelines?: TimelineNode[]
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

export function FieldRow({
  field,
  value,
  locked,
  busy,
  timelines,
  onChange,
  onToggleLock,
  onRegenerate,
  onClear,
}: Props) {
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
          {/* A checkbox is already one click from either answer, so clearing
              and regenerating it are noise. */}
          <button
            type="button"
            className="icon"
            title="Clear this field"
            disabled={locked || busy || text === '' || field.kind === 'boolean'}
            onClick={onClear}
          >
            Clear
          </button>
          <button
            type="button"
            className="icon"
            title="Replace this field with a newly generated value"
            disabled={locked || busy || field.kind === 'boolean'}
            onClick={onRegenerate}
          >
            Regenerate
          </button>
        </div>
      </div>

      {field.kind === 'timeline' ? (
        /*
         * Chosen, never typed. A timeline that does not exist is not a typo to
         * be caught on save - it is an event filed nowhere - and the store
         * refuses one anyway, so offering a free text box would only be a way
         * of finding that out later.
         */
        <select
          id={field.key}
          value={typeof value === 'string' ? value : ''}
          disabled={locked || !timelines?.length}
          onChange={(e) => onChange(e.target.value || null)}
        >
          {!timelines?.length && <option value="">Loading…</option>}
          {timelines?.map((t) => (
            // Indented so the nesting is visible in a flat list: an event is
            // filed against one timeline, and which one that is only means
            // something relative to the ones above it.
            <option key={t.id} value={t.id}>
              {'  '.repeat(t.depth) + t.name}
            </option>
          ))}
        </select>
      ) : field.kind === 'boolean' ? (
        <input
          id={field.key}
          type="checkbox"
          className="switch"
          checked={value === true}
          disabled={locked}
          onChange={(e) => onChange(e.target.checked)}
        />
      ) : field.kind === 'longtext' ? (
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
