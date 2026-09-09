import type { RunResult } from '../types'

export function ResultPanel({ result, busy }: { result: RunResult | null; busy: boolean }) {
  if (busy) return <p className="empty">Running…</p>
  if (!result) return null
  if (result.error) return <p className="error">{result.error}</p>

  return (
    <div className="result">
      <pre>{result.output}</pre>
      {result.diff && (
        <>
          {/* Canon changes are proposed, never applied silently — review before accepting. */}
          <h3>Proposed changes</h3>
          <pre className="diff">{result.diff}</pre>
        </>
      )}
    </div>
  )
}
