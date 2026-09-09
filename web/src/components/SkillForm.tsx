import { useEffect, useState } from 'react'
import type { Skill } from '../types'

interface Props {
  skill: Skill
  busy: boolean
  onSubmit: (args: Record<string, string>) => void
}

export function SkillForm({ skill, busy, onSubmit }: Props) {
  const [values, setValues] = useState<Record<string, string>>({})

  // Arguments are per-skill; don't carry one skill's input into the next.
  useEffect(() => setValues({}), [skill.name])

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(values)
      }}
    >
      <h2>{skill.name}</h2>
      <p className="skill-desc">{skill.description}</p>

      {skill.args.map((arg) => (
        <label key={arg.name}>
          {arg.label}
          {arg.multiline ? (
            <textarea
              rows={8}
              required={arg.required}
              placeholder={arg.placeholder}
              value={values[arg.name] ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, [arg.name]: e.target.value }))}
            />
          ) : (
            <input
              required={arg.required}
              placeholder={arg.placeholder}
              value={values[arg.name] ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, [arg.name]: e.target.value }))}
            />
          )}
        </label>
      ))}

      <button type="submit" disabled={busy}>
        {busy ? 'Running…' : skill.writes ? 'Run (proposes changes)' : 'Run'}
      </button>
    </form>
  )
}
