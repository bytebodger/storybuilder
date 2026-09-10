import type { Universe } from '../types'

interface Props {
  universes: Universe[]
  onEnter: (id: string) => void
  onEdit: (id: string) => void
  onCreate: () => void
  error?: string | null
}

export function Home({ universes, onEnter, onEdit, onCreate, error }: Props) {
  return (
    <section>
      <div className="form-head">
        <h2>Universes</h2>
        <button type="button" className="primary" onClick={onCreate}>
          New universe
        </button>
      </div>

      {/*
        The error itself is reported once, above, with what to do about it. All
        this has to do is not claim the list is empty when it is only unread -
        "No universes yet" under a failed request is a lie about the world.
      */}
      {universes.length === 0 && !error && (
        <p className="empty">No universes yet. Create one to start building.</p>
      )}

      <div className="cards">
        {universes.map((u) => (
          <article key={u.id} className="card">
            <h3>{u.name}</h3>
            <p className="meta">
              {[u.genres?.join(', '), u.tone, u.scale].filter(Boolean).join(' · ') || 'No details recorded yet'}
            </p>
            <p className="meta">Canon spans Year 0 – Year {u.totalYears ?? 1000}</p>
            <div className="field-actions">
              <button type="button" className="primary" onClick={() => onEnter(u.id)}>
                Enter
              </button>
              <button type="button" className="icon" onClick={() => onEdit(u.id)}>
                Edit details
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
