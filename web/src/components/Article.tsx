import { useEffect, useState } from 'react'
import { article as fetchArticle, brief, referencesTo, restoreItem, trashItem } from '../api'
import type { ArticleView, NavItem, Segment } from '../types'
import { MapFigure } from './MapFigure'

interface Props {
  universe: string
  item: NavItem
  onEdit: () => void
  /** Following a link opens that article. */
  onNavigate: (item: NavItem) => void
  /** Trashed or restored: the navigation and the open article both change. */
  onTrashed?: () => void
}

/** What deleting this would actually do, fetched before it is done. */
interface Fallout {
  linked: { id: string; name: string; container: string }[]
  mentioned: { id: string; name: string; container: string }[]
}

/** One field's prose, with the mentions of other articles made into links. */
function Prose({
  segments,
  onNavigate,
  inline,
}: {
  segments: Segment[]
  onNavigate: (t: NavItem) => void
  inline?: boolean
}) {
  const Tag = inline ? 'span' : 'p'
  return (
    <Tag className={inline ? 'prose inline' : 'prose'}>
      {segments.map((seg, i) =>
        seg.target ? (
          <button
            key={i}
            type="button"
            className={seg.target.stub ? 'xref xref-stub' : 'xref'}
            title={
              seg.target.stub
                ? `${seg.target.name} — a stub in ${seg.target.container}, nothing established yet`
                : `${seg.target.name} — ${seg.target.container}`
            }
            onClick={() => onNavigate({ id: seg.target!.id, name: seg.target!.name })}
          >
            {seg.text}
          </button>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </Tag>
  )
}

export function Article({ universe, item, onEdit, onNavigate, onTrashed }: Props) {
  const [view, setView] = useState<ArticleView | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showBrief, setShowBrief] = useState(false)
  const [briefText, setBriefText] = useState<string | null>(null)
  /** Null until Delete is pressed: the confirmation is the reference count. */
  const [fallout, setFallout] = useState<Fallout | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setView(null)
    setError(null)
    setShowBrief(false)
    fetchArticle(universe, item.id).then(setView, (e: unknown) =>
      setError(e instanceof Error ? e.message : String(e)),
    )
  }, [universe, item.id])

  useEffect(() => {
    if (showBrief && briefText === null) brief(universe, item.id).then(setBriefText, () => undefined)
  }, [showBrief, briefText, universe, item.id])

  if (error) return <section className="panel"><p className="error">{error}</p></section>
  if (!view) return <section className="panel"><p className="empty">Loading…</p></section>

  // Lists count as facts: a line of founders or genres is scanned like a value,
  // not read like a paragraph.
  const isFact = (kind: string) =>
    kind === 'text' || kind === 'number' || kind === 'list' || kind === 'timeline'
  const facts = view.fields.filter((f) => isFact(f.kind))
  const prose = view.fields.filter((f) => !isFact(f.kind))

  return (
    <section className="panel">
      <div className="form-head">
        <h2>
          {view.item.name}
          {view.item.kind && <span className="badge">{view.item.kind}</span>}
          {view.item.stub && <span className="badge stub-badge">stub</span>}
          {view.item.trashed && <span className="badge stub-badge">in the trash</span>}
        </h2>
        <div className="field-actions">
          <span className="examples">{view.container.label}</span>
          {view.item.trashed ?
            <button
              type="button"
              className="icon"
              disabled={busy}
              title="Put it back, with the relationships it went in with"
              onClick={async () => {
                setBusy(true)
                try {
                  const { refused } = await restoreItem(universe, view.item.id)
                  if (refused.length) setError(`Restored, but ${refused.length} link could not be re-made.`)
                  onTrashed?.()
                  fetchArticle(universe, item.id).then(setView, () => undefined)
                } finally {
                  setBusy(false)
                }
              }}
            >
              {busy ? 'Restoring…' : 'Restore'}
            </button>
          : <>
              <button type="button" className="icon" onClick={onEdit}>
                Edit
              </button>
              <button
                type="button"
                className="icon"
                disabled={busy}
                title="Move it to the trash. Nothing is destroyed."
                onClick={async () => {
                  // The count is the confirmation: asking "are you sure?" with
                  // no idea what depends on it is not a question anyone can
                  // answer.
                  setBusy(true)
                  try {
                    setFallout(await referencesTo(universe, view.item.id))
                  } finally {
                    setBusy(false)
                  }
                }}
              >
                Delete
              </button>
            </>
          }
        </div>
      </div>

      {view.item.stub && (
        <p className="note">
          A placeholder. The name is established and nothing else is — writing it is what turns this
          into an article.
        </p>
      )}

      {view.item.trashed && (
        <p className="note">
          In the trash. It is out of the navigation, out of every brief, and nothing links to it — but
          nothing has been destroyed, and Restore brings it back with the relationships it went in
          with.
        </p>
      )}

      {fallout && (
        <div className="note">
          <p>
            <strong>Move “{view.item.name}” to the trash?</strong> Nothing is destroyed — it can be
            restored from the Trash section.
          </p>
          {fallout.linked.length > 0 && (
            <p>
              {fallout.linked.length} article{fallout.linked.length === 1 ? '' : 's'}{' '}
              {fallout.linked.length === 1 ? 'has' : 'have'} a recorded relationship with it, and{' '}
              {fallout.linked.length === 1 ? 'that link is' : 'those links are'} removed:{' '}
              {fallout.linked.map((r) => r.name).join(', ')}. Restoring puts them back.
            </p>
          )}
          {fallout.mentioned.length > 0 && (
            <p>
              {fallout.mentioned.length} article{fallout.mentioned.length === 1 ? '' : 's'} mention
              {fallout.mentioned.length === 1 ? 's' : ''} it in prose:{' '}
              {fallout.mentioned.map((r) => r.name).join(', ')}. Their words are left exactly as
              written — the name simply stops linking here.
            </p>
          )}
          {fallout.linked.length === 0 && fallout.mentioned.length === 0 && (
            <p>Nothing else refers to it.</p>
          )}
          <div className="field-actions">
            <button type="button" className="icon" disabled={busy} onClick={() => setFallout(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="icon"
              disabled={busy}
              onClick={async () => {
                setBusy(true)
                try {
                  await trashItem(universe, view.item.id)
                  setFallout(null)
                  onTrashed?.()
                  fetchArticle(universe, item.id).then(setView, () => undefined)
                } finally {
                  setBusy(false)
                }
              }}
            >
              {busy ? 'Moving…' : 'Move to trash'}
            </button>
          </div>
        </div>
      )}

      {view.fields.length === 0 && !view.item.stub && (
        <p className="empty">No fields have been filled in yet.</p>
      )}

      {/*
        Two columns: what the article says, and what it is attached to.
        
        The prose is read in order and keeps the spec's, so it holds the left
        column on its own. Everything else is reference - a weight, a
        pronunciation, a map, the neighbours - which is looked *up* rather than
        read, and belongs beside the reading rather than interrupting it. The
        facts used to sit as a banner above the prose and the relations as a
        footer below, which put two things nobody reads in sequence into the
        sequence.
      */}
      <div className="article-body">
        <div className="article-main">
          {prose.map((field) => (
            <div key={field.key} className="article-field">
              <h3>{field.label}</h3>
              <Prose segments={field.segments} onNavigate={onNavigate} />
            </div>
          ))}
        </div>

        {(view.hasMap || facts.length > 0 || view.related.length > 0) && (
          <aside className="article-aside">
            {view.hasMap && (
              <MapFigure universe={universe} itemId={view.item.id} name={view.item.name} />
            )}

            {facts.length > 0 && (
              <dl className="facts">
                {facts.map((field) => (
                  <div key={field.key} className="fact">
                    <dt>{field.label}</dt>
                    <dd>
                      <Prose segments={field.segments} onNavigate={onNavigate} inline />
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            {view.related.length > 0 && (
              <div className="article-related">
                <h3>Related</h3>
                {view.related.map((set) => (
                  <div key={set.type} className="related-set">
                    <span className="related-type">
                      {set.type}
                      {set.closure === 'closed' && (
                        <span className="badge" title={set.closureNote}>complete</span>
                      )}
                      {set.closure === 'uncharted' && <span className="badge">uncharted</span>}
                    </span>
                    <div className="related-items">
                      {set.items.map((rel) => (
                        <button
                          key={rel.id}
                          type="button"
                          className={rel.stub ? 'xref xref-stub' : 'xref'}
                          onClick={() => onNavigate({ id: rel.id, name: rel.name })}
                        >
                          {rel.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>
        )}
      </div>

      <button type="button" className="icon brief-toggle" onClick={() => setShowBrief((v) => !v)}>
        {showBrief ? 'Hide' : 'Show'} what the skills see
      </button>
      {showBrief && <pre>{briefText ?? 'Loading…'}</pre>}
    </section>
  )
}
