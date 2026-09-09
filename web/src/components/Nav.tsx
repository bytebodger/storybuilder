import { useState } from 'react'
import type { NavItem, NavSection } from '../types'

interface Props {
  sections: NavSection[]
  onSelect: (item: NavItem) => void
  onCreate: (section: NavSection) => void
  selectedId?: string
}

/**
 * Every container, whether or not it holds anything. An empty section is not
 * clutter — it is the list of things this universe has yet to say anything
 * about, which is exactly what an author building a world needs to see.
 */
export function Nav({ sections, onSelect, onCreate, selectedId }: Props) {
  const [open, setOpen] = useState<Set<string>>(new Set())

  return (
    <nav className="nav">
      {sections.map((section) => {
        const isOpen = open.has(section.key)
        return (
          <div key={section.key} className={section.items.length ? 'nav-section' : 'nav-section empty-section'}>
            <button
              type="button"
              className="nav-head"
              aria-expanded={isOpen}
              title={section.description}
              onClick={() =>
                setOpen((prev) => {
                  const next = new Set(prev)
                  if (!next.delete(section.key)) next.add(section.key)
                  return next
                })
              }
            >
              <span className="nav-caret">{isOpen ? '▾' : '▸'}</span>
              <span className="nav-label">{section.label}</span>
              <span className="nav-count">{section.items.length}</span>
            </button>

            {isOpen && (
              <div className="nav-items">
                <button type="button" className="nav-new" onClick={() => onCreate(section)}>
                  + New {section.singular}
                </button>
                {section.items.length === 0 ? (
                  <p className="nav-blank">Nothing recorded yet.</p>
                ) : (
                  section.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={item.id === selectedId ? 'nav-item selected' : 'nav-item'}
                      onClick={() => onSelect(item)}
                    >
                      {item.name}
                      {item.kind && <span className="nav-kind">{item.kind}</span>}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}
