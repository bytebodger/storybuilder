import { useState } from 'react'
import { commitImport, planImport } from '../api'
import type { GroupedPlan } from '../types'
import { ImportReview } from './ImportReview'

const TIERS = [
  { tier: 1, label: 'The spine', note: 'Countries, capitals, peoples, faiths, roads, events.' },
  { tier: 2, label: 'Navigable', note: 'Adds ports and settlements above a population threshold.' },
  { tier: 3, label: 'Everything', note: 'Adds every remaining settlement, river and lake.' },
]

/**
 * Planning an import, then reviewing it.
 *
 * Files are named by path rather than uploaded: the bridge runs on the author's
 * own machine, and a Full export runs to 75MB.
 */
export function ImportPanel({ universe, onDone }: { universe: string; onDone: () => void }) {
  const [svgPath, setSvgPath] = useState('')
  const [jsonPath, setJsonPath] = useState('')
  const [tier, setTier] = useState(1)
  const [withProvinces, setWithProvinces] = useState(false)
  const [withMarkers, setWithMarkers] = useState(false)
  const [plan, setPlan] = useState<GroupedPlan | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  const ready = svgPath.trim() && jsonPath.trim()

  async function makePlan() {
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      setPlan(await planImport({ universe, svgPath, jsonPath, tier, withProvinces, withMarkers }))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  async function commit(chosen: GroupedPlan['groups'][number]['candidates']) {
    setBusy(true)
    setError(null)
    try {
      const res = await commitImport(universe, chosen)
      setResult(`Created ${res.created} article(s); ${res.linked} linked to a parent.`)
      setPlan(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="panel">
      <div className="form-head">
        <h2>Import a map</h2>
        <button type="button" className="icon" onClick={onDone}>
          Done
        </button>
      </div>

      {error && <p className="error">{error}</p>}
      {result && <p className="note">{result}</p>}

      {!plan && (
        <>
          <p className="help">
            An Azgaar export is two files, and both are needed. The JSON holds everything the
            generator made; the SVG holds the labels you placed by hand, which appear nowhere else and
            are imported whichever tier you pick.
          </p>

          <div className="fields">
            <label>
              SVG export
              <input value={svgPath} placeholder="C:\...\Watia.svg" onChange={(e) => setSvgPath(e.target.value)} />
            </label>
            <label>
              Full JSON export
              <input value={jsonPath} placeholder="C:\...\Watia Full.json" onChange={(e) => setJsonPath(e.target.value)} />
            </label>

            <div className="tiers">
              {TIERS.map((t) => (
                <label key={t.tier} className={tier === t.tier ? 'tier selected' : 'tier'}>
                  <input type="radio" checked={tier === t.tier} onChange={() => setTier(t.tier)} />
                  <span className="tier-label">{t.label}</span>
                  <span className="help">{t.note}</span>
                </label>
              ))}
            </div>

            <label className="inline-check">
              <input type="checkbox" checked={withProvinces} onChange={(e) => setWithProvinces(e.target.checked)} />
              Include provinces — an administrative layer the generator makes whether or not you
              wanted one
            </label>
            <label className="inline-check">
              <input type="checkbox" checked={withMarkers} onChange={(e) => setWithMarkers(e.target.checked)} />
              Include map markers — prompts for a game master rather than facts about a world
            </label>
          </div>

          <button type="button" className="primary" disabled={!ready || busy} onClick={makePlan}>
            {busy ? 'Reading the export…' : 'Plan the import'}
          </button>
          <p className="help">Nothing is written until you review what it found.</p>
        </>
      )}

      {plan && <ImportReview plan={plan} busy={busy} onCancel={() => setPlan(null)} onImport={commit} />}
    </section>
  )
}
