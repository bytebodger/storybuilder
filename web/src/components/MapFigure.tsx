import { useEffect, useState } from 'react'

/**
 * An article's window onto the universe's map.
 *
 * Small on the page, because an article is text and the map is context; full
 * screen on demand, because the detail is the reason the map is vector in the
 * first place and none of it is legible at thumbnail size.
 */
export function MapFigure({ universe, itemId, name }: { universe: string; itemId: string; name: string }) {
  const [open, setOpen] = useState(false)
  const [failed, setFailed] = useState(false)
  const src = `/api/map?universe=${encodeURIComponent(universe)}&id=${encodeURIComponent(itemId)}`

  // Escape closes it, as it does everywhere else a thing opens over a page.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    // The page behind must not scroll while the map is over it.
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [open])

  if (failed) return null

  return (
    <>
      <figure className="map-figure">
        <button type="button" className="map-thumb" onClick={() => setOpen(true)} title={`${name} — click to enlarge`}>
          <img src={src} alt={`Map of ${name}`} onError={() => setFailed(true)} />
        </button>
        <figcaption>{name} on the map — click to enlarge</figcaption>
      </figure>

      {open && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`Map of ${name}`}
          onClick={() => setOpen(false)}
        >
          <div className="lightbox-bar">
            <span>{name}</span>
            <button type="button" className="icon" onClick={() => setOpen(false)}>
              Close (Esc)
            </button>
          </div>
          {/* Stops a click on the map itself from closing what it opened. */}
          <img src={src} alt={`Map of ${name}`} onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  )
}
