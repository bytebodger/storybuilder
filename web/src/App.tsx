import { useCallback, useEffect, useState } from 'react'
import { intro, listSkills, listUniverses, nav, run } from './api'
import type { NavItem, NavSection, RunResult, Skill, Universe } from './types'
import { SkillForm } from './components/SkillForm'
import { ResultPanel } from './components/ResultPanel'
import { UniverseForm } from './components/UniverseForm'
import { Home } from './components/Home'
import { Nav } from './components/Nav'
import { Article } from './components/Article'
import { ArticleForm } from './components/ArticleForm'
import { StubReview } from './components/StubReview'
import { CanonCheck } from './components/CanonCheck'
import { ImportPanel } from './components/ImportPanel'
import { Chronology } from './components/Chronology'

type View = { name: 'home' } | { name: 'edit'; id?: string } | { name: 'inside'; id: string }

export function App() {
  const [view, setView] = useState<View>({ name: 'home' })
  const [universes, setUniverses] = useState<Universe[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [skill, setSkill] = useState<Skill | null>(null)
  const [premise, setPremise] = useState('')
  const [sections, setSections] = useState<NavSection[]>([])
  const [article, setArticle] = useState<NavItem | null>(null)
  /** An open article form: a new entry in a section, or an existing item being edited. */
  const [composing, setComposing] = useState<{ section: NavSection; itemId?: string } | null>(null)
  const [importing, setImporting] = useState(false)
  const [chronology, setChronology] = useState(false)
  /**
   * The post-save sequence: stubs, then the canon check, then the article.
   *
   * They run in order rather than together because the first changes what the
   * second sees - a stub accepted in the first round is canon by the second, so
   * it is not reported, while one declined still is.
   */
  const [saved, setSaved] = useState<{ id: string; name: string; phase: 'stubs' | 'canon' } | null>(null)
  const [result, setResult] = useState<RunResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const refresh = useCallback(
    () =>
      listUniverses().then(setUniverses, (e: unknown) =>
        setLoadError(e instanceof Error ? e.message : String(e)),
      ),
    [],
  )

  useEffect(() => {
    refresh()
    listSkills().then(setSkills, () => undefined)
  }, [refresh])

  // The universe's standing constraints belong on screen wherever work happens.
  useEffect(() => {
    if (view.name !== 'inside') {
      setPremise('')
      setSections([])
      return
    }
    setArticle(null)
    setComposing(null)
    setSaved(null)
    setImporting(false)
    setChronology(false)
    intro(view.id).then(setPremise, () => setPremise(''))
    nav(view.id).then(setSections, () => setSections([]))
  }, [view])

  async function submit(args: Record<string, string>) {
    if (!skill || view.name !== 'inside') return
    setBusy(true)
    setResult(null)
    try {
      setResult(await run({ universe: view.id, skill: skill.name, args }))
    } catch (e: unknown) {
      setResult({ output: '', error: e instanceof Error ? e.message : String(e) })
    } finally {
      setBusy(false)
    }
  }

  const current = view.name === 'inside' ? universes.find((u) => u.id === view.id) : undefined

  return (
    <div className="app">
      <header>
        <h1 onClick={() => setView({ name: 'home' })} className="brand">
          Storybuilder
        </h1>
        {current && <span className="crumb">{current.name}</span>}
        {view.name !== 'home' && (
          <button type="button" className="icon" onClick={() => setView({ name: 'home' })}>
            All universes
          </button>
        )}
      </header>

      {loadError && (
        <p className="error">
          Could not reach the bridge service ({loadError}). Start it with <code>npm run dev</code> in{' '}
          <code>bridge/</code>.
        </p>
      )}

      {view.name === 'home' && (
        <Home
          universes={universes}
          error={loadError}
          onCreate={() => setView({ name: 'edit' })}
          onEdit={(id) => setView({ name: 'edit', id })}
          onEnter={(id) => setView({ name: 'inside', id })}
        />
      )}

      {view.name === 'edit' && (
        <UniverseForm
          universeId={view.id}
          onCancel={() => setView({ name: 'home' })}
          onSaved={(u) => {
            refresh()
            setView({ name: 'inside', id: u.id })
          }}
        />
      )}

      {view.name === 'inside' && (
        <>
          {premise && <pre className="intro">{premise}</pre>}
          <main>
            <div className="sidebar">
              <Nav
                sections={sections}
                selectedId={article?.id}
                onSelect={(item) => {
                  setComposing(null)
                  setSaved(null)
                  setImporting(false)
                  setChronology(false)
                  setArticle(item)
                }}
                onCreate={(section) => {
                  setArticle(null)
                  setSaved(null)
                  setImporting(false)
                  setChronology(false)
                  setComposing({ section })
                }}
              />
              <div className="sidebar-block">
                <h4>Build</h4>
                <button
                  className={chronology ? 'skill selected' : 'skill'}
                  onClick={() => {
                    setArticle(null)
                    setComposing(null)
                    setSaved(null)
                    setImporting(false)
                    setChronology(true)
                  }}
                >
                  <span className="skill-name">Chronology</span>
                  <span className="skill-desc">
                    The timelines and everything filed into them, drawn against one axis of years.
                  </span>
                </button>
                <button
                  className={importing ? 'skill selected' : 'skill'}
                  onClick={() => {
                    setArticle(null)
                    setComposing(null)
                    setSaved(null)
                    setChronology(false)
                    setImporting(true)
                  }}
                >
                  <span className="skill-name">Import a map</span>
                  <span className="skill-desc">
                    Bring in an Azgaar export: countries, settlements, and the labels you added
                    yourself.
                  </span>
                </button>
              </div>

              <div className="sidebar-block">
                <h4>Skills</h4>
                {skills.map((s) => (
                  <button
                    key={s.name}
                    className={
                      !article && !composing && !importing && !chronology && s.name === skill?.name ?
                        'skill selected'
                      : 'skill'
                    }
                    onClick={() => {
                      setSkill(s)
                      setArticle(null)
                      setComposing(null)
                      setChronology(false)
                      setResult(null)
                    }}
                  >
                    <span className="skill-name">
                      {s.name}
                      {s.writes && (
                        <span className="badge" title="Can modify canon">
                          writes
                        </span>
                      )}
                    </span>
                    <span className="skill-desc">{s.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {chronology ? (
              <Chronology
                universe={view.id}
                onOpen={(item) => {
                  setChronology(false)
                  setArticle(item)
                }}
              />
            ) : importing ? (
              <ImportPanel
                universe={view.id}
                onDone={() => {
                  nav(view.id).then(setSections, () => undefined)
                  setImporting(false)
                }}
              />
            ) : saved ? (
              saved.phase === 'stubs' ? (
                <StubReview
                  universe={view.id}
                  itemId={saved.id}
                  itemName={saved.name}
                  onEmpty={() => setSaved({ ...saved, phase: 'canon' })}
                  onDone={() => {
                    nav(view.id).then(setSections, () => undefined)
                    setSaved({ ...saved, phase: 'canon' })
                  }}
                />
              ) : (
                <CanonCheck
                  universe={view.id}
                  itemId={saved.id}
                  itemName={saved.name}
                  onEmpty={() => {
                    setArticle({ id: saved.id, name: saved.name })
                    setSaved(null)
                  }}
                  onDone={() => {
                    setArticle({ id: saved.id, name: saved.name })
                    setSaved(null)
                  }}
                  onEdit={() => {
                    const section = sections.find((s) => s.items.some((i) => i.id === saved.id))
                    setSaved(null)
                    if (section) setComposing({ section, itemId: saved.id })
                  }}
                />
              )
            ) : composing ? (
              <ArticleForm
                universe={view.id}
                container={composing.section.key}
                label={composing.section.singular}
                itemId={composing.itemId}
                onCancel={() => setComposing(null)}
                onSaved={(item) => {
                  setComposing(null)
                  nav(view.id).then(setSections, () => undefined)
                  // Saving is what triggers the scan: the text is settled, and
                  // the author is already thinking about this article.
                  setSaved({ id: item.id, name: item.name, phase: 'stubs' })
                }}
              />
            ) : article ? (
              <Article
                universe={view.id}
                item={article}
                onNavigate={setArticle}
                onEdit={() => {
                  const section = sections.find((sec) => sec.items.some((i) => i.id === article.id))
                  if (section) setComposing({ section, itemId: article.id })
                }}
              />
            ) : (
              <section className="panel">
                {skill ? (
                  <>
                    <SkillForm skill={skill} busy={busy} onSubmit={submit} />
                    <ResultPanel result={result} busy={busy} />
                  </>
                ) : (
                  <p className="empty">Pick an article from the left, or a skill to run.</p>
                )}
              </section>
            )}
          </main>
        </>
      )}

    </div>
  )
}
