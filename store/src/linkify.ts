/**
 * Finding the articles a passage refers to.
 *
 * The same question `stub-forge` asks - does this term name something the
 * universe has? - answered against running prose instead of a candidate list,
 * and reusing the same normaliser, so "the thorinfly" reaches **Thorinflies**
 * here for exactly the reason it is not proposed as a stub there.
 *
 * Returns segments rather than markup. Nothing downstream has to parse or
 * sanitise a string that came out of an author's text, and the renderer decides
 * what a link looks like.
 */
import { normalizeTerm } from './terms.ts'
import type { Item } from './types.ts'

export interface LinkTarget {
  id: string
  name: string
  container: string
  /** Marked so the reader can see they are following a name with nothing behind it. */
  stub?: boolean
}

export interface Segment {
  text: string
  target?: LinkTarget
}

export interface LinkifyOptions {
  /** The article being read. It does not link to itself. */
  excludeId?: string
  /** Link only the first mention of each article, as a wiki would. Default true. */
  once?: boolean
}

/**
 * Words never linked on their own, however an article is titled.
 *
 * Short: the world's own vocabulary is often lowercase and ordinary-looking -
 * `muddwood`, `casterway` - and excluding too much would defeat the feature.
 * These are words that would produce a link in nearly every sentence.
 */
const NEVER_LINK = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'from', 'had', 'has', 'have',
  'he', 'her', 'his', 'in', 'is', 'it', 'its', 'not', 'of', 'on', 'or', 'she', 'that', 'the',
  'their', 'them', 'they', 'this', 'to', 'was', 'were', 'which', 'who', 'with', 'you',
  'one', 'two', 'three', 'first', 'second', 'third', 'year', 'years', 'time', 'people', 'place',
])

/** Never begins a link, so "the Thorinflies" links the name and not the article. */
const LEADING_ARTICLES = new Set(['the', 'a', 'an'])

const TOKEN = /[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu

interface Token {
  text: string
  start: number
  end: number
}

function tokenize(text: string): Token[] {
  const tokens: Token[] = []
  for (const match of text.matchAll(TOKEN)) {
    tokens.push({ text: match[0], start: match.index, end: match.index + match[0].length })
  }
  return tokens
}

interface Index {
  byTerm: Map<string, Item>
  maxWords: number
}

/**
 * Every name, alias and demonym in the universe, keyed by normalised form.
 *
 * A written article wins a collision over a stub: if two items answer to the
 * same name, the one with something behind it is the more useful destination.
 *
 * Demonyms are indexed in a second pass, so a title always beats one. "Kellish"
 * is both the people of Kell and, very often, an article of its own - and a
 * reader who follows it wants the people, not the port.
 */
export function buildIndex(items: Item[]): Index {
  const byTerm = new Map<string, Item>()
  let maxWords = 1

  const add = (item: Item, surface: string, demonym: boolean) => {
    const key = normalizeTerm(surface)
    if (!key || key.length < 3 || NEVER_LINK.has(key)) return

    const held = byTerm.get(key)
    // A demonym never displaces what is already there; anything else displaces
    // a stub.
    if (!held || (!demonym && held.stub && !item.stub)) byTerm.set(key, item)
    maxWords = Math.max(maxWords, key.split(' ').length)
  }

  for (const item of items) {
    for (const surface of [item.name, ...(item.aliases ?? [])]) add(item, surface, false)
  }
  for (const item of items) {
    for (const surface of item.demonyms ?? []) add(item, surface, true)
  }
  return { byTerm, maxWords }
}

/**
 * Split text into plain and linked runs.
 *
 * Longest match wins, so "Dawn Reaver" is one link rather than a link on "Dawn"
 * followed by a stray word, and a matched span is never re-entered.
 */
export function linkify(text: string, items: Item[], options: LinkifyOptions = {}): Segment[] {
  const { excludeId, once = true } = options
  const index = buildIndex(items)
  const tokens = tokenize(text)
  const segments: Segment[] = []
  const linked = new Set<string>()

  let cursor = 0
  let i = 0

  while (i < tokens.length) {
    if (LEADING_ARTICLES.has(tokens[i].text.toLowerCase())) {
      i++
      continue
    }

    let hit: { item: Item; end: number } | null = null
    for (let span = Math.min(index.maxWords, tokens.length - i); span >= 1; span--) {
      const start = tokens[i].start
      const end = tokens[i + span - 1].end
      const item = index.byTerm.get(normalizeTerm(text.slice(start, end)))
      if (!item) continue
      if (item.id === excludeId) break
      if (once && linked.has(item.id)) break
      hit = { item, end }
      break
    }

    if (!hit) {
      i++
      continue
    }

    const start = tokens[i].start
    if (start > cursor) segments.push({ text: text.slice(cursor, start) })
    segments.push({
      text: text.slice(start, hit.end),
      target: {
        id: hit.item.id,
        name: hit.item.name,
        container: hit.item.container,
        stub: hit.item.stub,
      },
    })
    linked.add(hit.item.id)
    cursor = hit.end

    while (i < tokens.length && tokens[i].start < hit.end) i++
  }

  if (cursor < text.length) segments.push({ text: text.slice(cursor) })
  return segments
}
