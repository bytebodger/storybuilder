import { useEffect, useState } from 'react'
import { article as fetchArticle, brief } from '../api'
import type { ArticleView, NavItem, Segment } from '../types'

interface Props {
  universe: string
  item: NavItem
  onEdit: () => void
  /** Following a link opens that article. */
  onNavigate: (item: NavItem) => void
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
            className={seg.target.stub ? 'xref stub' : 'xref'}
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

export function Article({ universe, item, onEdit, onNavigate }: Props) {
  const [view, setView] = useState<ArticleView | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showBrief, setShowBrief] = useState(false)
  const [briefText, setBriefText] = useState<string | null>(null)

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

  const facts = view.fields.filter((f) => f.kind === 'text' || f.kind === 'number')
  const prose = view.fields.filter((f) => f.kind !== 'text' && f.kind !== 'number')

  return (
    <section className="panel">
      <div className="form-head">
        <h2>
          {view.item.name}
          {view.item.kind && <span className="badge">{view.item.kind}</span>}
          {view.item.stub && <span className="badge stub-badge">stub</span>}
        </h2>
        <div className="field-actions">
          <span className="examples">{view.container.label}</span>
          <button type="button" className="icon" onClick={onEdit}>
            Edit
          </button>
        </div>
      </div>

      {view.item.stub && (
        <p className="note">
          A placeholder. The name is established and nothing else is — writing it is what turns this
          into an article.
        </p>
      )}

      {view.fields.length === 0 && !view.item.stub && (
        <p className="empty">No fields have been filled in yet.</p>
      )}

      {/*
        Short fields are reference data - a weight, a pronunciation - and belong
        together where they can be scanned. Prose is read in order, so it keeps
        the spec's order below.
      */}
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

      {prose.map((field) => (
        <div key={field.key} className="article-field">
          <h3>{field.label}</h3>
          <Prose segments={field.segments} onNavigate={onNavigate} />
        </div>
      ))}

      {view.related.length > 0 && (
        <div className="article-related">
          <h3>Related</h3>
          {view.related.map((set) => (
            <div key={set.type} className="related-set">
              <span className="related-type">
                {set.type}
                {set.closure === 'closed' && <span className="badge" title={set.closureNote}>complete</span>}
                {set.closure === 'uncharted' && <span className="badge">uncharted</span>}
              </span>
              <div className="related-items">
                {set.items.map((rel) => (
                  <button
                    key={rel.id}
                    type="button"
                    className={rel.stub ? 'xref stub' : 'xref'}
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

      <button type="button" className="icon brief-toggle" onClick={() => setShowBrief((v) => !v)}>
        {showBrief ? 'Hide' : 'Show'} what the skills see
      </button>
      {showBrief && <pre>{briefText ?? 'Loading…'}</pre>}
    </section>
  )
}
