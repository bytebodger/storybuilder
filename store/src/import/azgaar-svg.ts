/**
 * Reading the labels an author added to an Azgaar map by hand.
 *
 * These exist only in the SVG. Azgaar's data model has no notion of a mountain
 * range or a strait, so a label naming one is annotation *around* the tool - and
 * its "Full" JSON export, for all 75MB of it, does not contain a single one.
 *
 * They are also the most valuable names in the export. A generator produced
 * every country and settlement; a person decided these were worth naming.
 */

export interface AddedLabel {
  name: string
  /** Midpoint of the curve the text is set on, in canvas coordinates. */
  x: number
  y: number
}

/**
 * Custom labels arc across the map, so each is bound to a path in `#textPaths`
 * rather than carrying its own x/y. The midpoint of that curve is where the
 * text sits - which is close to, but not the same as, the centre of whatever it
 * names. Good enough to suggest a parent; not good enough to assert an extent.
 */
export function readAddedLabels(svg: string): AddedLabel[] {
  const group = /<g id="labels-added"[\s\S]*?<\/g>/.exec(svg)
  if (!group) return []

  const paths = new Map<string, string>()
  for (const m of svg.matchAll(/<path id="(textPath_addedLabel\d+)"[^>]*d="([^"]+)"/g)) {
    paths.set(m[1], m[2])
  }

  const labels: AddedLabel[] = []
  const entry =
    /<text id="addedLabel\d+"([^>]*)>[\s\S]*?xlink:href="#(textPath_addedLabel\d+)"[^>]*>([\s\S]*?)<\/textPath>/g

  for (const match of group[0].matchAll(entry)) {
    const [, attrs, ref, raw] = match
    const name = raw.replace(/<[^>]+>/g, '').trim()
    const d = paths.get(ref)
    if (!name || !d) continue

    const nums = (d.match(/-?\d+\.?\d*/g) ?? []).map(Number)
    if (nums.length < 2) continue
    const xs = nums.filter((_, i) => i % 2 === 0)
    const ys = nums.filter((_, i) => i % 2 === 1)

    let x = xs.reduce((a, b) => a + b, 0) / xs.length
    let y = ys.reduce((a, b) => a + b, 0) / ys.length

    // The <text> may nudge the label off its path; the nudge is part of where
    // the reader sees it, so it is part of the position.
    const shift = /transform="translate\(\s*(-?[\d.]+)\s*,?\s*(-?[\d.]+)?\s*\)"/.exec(attrs)
    if (shift) {
      x += Number(shift[1])
      y += Number(shift[2] ?? 0)
    }
    labels.push({ name, x, y })
  }
  return labels
}

/**
 * A guess at what kind of feature a hand-written label names, from the words in
 * it. Only ever a suggestion - the author picks the container in review.
 */
export function guessGeographyKind(name: string): string | undefined {
  const n = name.toLowerCase()
  const rules: [RegExp, string][] = [
    [/\b(range|mountains?|peaks?|massif)\b/, 'mountain-range'],
    [/\b(strait|channel|narrows)\b/, 'strait'],
    // 'sea' as a whole word or a suffix: Sontersea is a sea, and reads as one.
    [/\b(sea|ocean)\b|sea$/, 'sea'],
    [/\b(bay|gulf|sound|firth)\b/, 'bay'],
    [/\b(isles?|islands?|archipelago)\b/, 'island'],
    [/\b(forest|wood|woods|jungle)\b/, 'forest'],
    [/\b(desert|wastes?|sands)\b/, 'desert'],
    [/\b(river|creek)\b/, 'river'],
    [/\b(lake|mere|loch)\b/, 'lake'],
    [/\b(vale|valley|glen)\b/, 'valley'],
    [/\b(plains?|steppe|downs)\b/, 'plain'],
  ]
  for (const [pattern, kind] of rules) if (pattern.test(n)) return kind
  return undefined
}
