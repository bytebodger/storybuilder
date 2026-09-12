/**
 * Deciding whether a term already exists in a universe.
 *
 * This is the whole difficulty of stub detection. A model reading an article can
 * spot that "thorinfly" is an unexplained term, but asking it to also remember
 * that an article called "Thorinflies" exists is asking it to hold the corpus in
 * mind - exactly the thing this tool is built because nobody can do.
 *
 * So the model proposes candidates and the store decides which are new. Same
 * division as the form locks: the judgement that needs the world in front of it
 * is made mechanically, against the world.
 */
import type { Item } from './types.ts'

/** Endings handled by the singulariser, longest first so 'ches' beats 's'. */
const PLURAL_RULES: [RegExp, string][] = [
  [/ies$/, 'y'],
  [/([^aeiou])ves$/, '$1f'],
  [/(ch|sh|ss|x|z|s)es$/, '$1'],
  [/([^s])s$/, '$1'],
]

/** A heuristic, and only English. Wrong on 'axes' and 'geese'; right on the rest. */
export function singularize(word: string): string {
  for (const [pattern, replacement] of PLURAL_RULES) {
    if (pattern.test(word)) return word.replace(pattern, replacement)
  }
  return word
}

/**
 * Reduce a term to what it has in common with other spellings of itself:
 * case, leading article, possessive, punctuation, and plurality all removed.
 *
 * "The Thorinflies'" and "thorinfly" both become "thorinfly".
 */
export function normalizeTerm(term: string): string {
  const cleaned = term
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[‘’']s\b/g, '')
    .replace(/[‘’']/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(the|a|an)\s+/, '')

  // Hyphens survive the cleaning pass because they belong inside names, which
  // means a run of them can survive it too. A term with no letters is not a term.
  if (!/[a-z0-9]/.test(cleaned)) return ''

  const words = cleaned.split(' ').filter(Boolean)
  if (words.length === 0) return ''
  // Only the head noun is singularised: "Isles of the Dawn" must not become
  // "isle of the dawn", but "Dawn Reavers" should match "Dawn Reaver".
  words[words.length - 1] = singularize(words[words.length - 1])
  return words.join(' ')
}

export interface TermMatch {
  item: Item
  /**
   * 'name' when it matched the item's title, 'alias' when one of its aliases,
   * 'demonym' when it is what this thing's people are called.
   */
  via: 'name' | 'alias' | 'demonym'
  /** True when the spellings were identical before normalising. */
  exact: boolean
}

/**
 * Every item a term could already be referring to. Empty means the term is new
 * to this universe and is a candidate for a stub.
 */
export function matchTerm(term: string, items: Item[]): TermMatch[] {
  const needle = normalizeTerm(term)
  if (!needle) return []

  // Titles first, whatever order the items arrive in: "Kellish" is the people
  // of Kell and usually an article of its own, and the thing actually called
  // that is the more useful answer to report.
  const titled: TermMatch[] = []
  const peoples: TermMatch[] = []

  for (const item of items) {
    if (normalizeTerm(item.name) === needle) {
      titled.push({ item, via: 'name', exact: item.name.toLowerCase() === term.toLowerCase() })
      continue
    }
    const alias = (item.aliases ?? []).find((a) => normalizeTerm(a) === needle)
    if (alias) {
      titled.push({ item, via: 'alias', exact: alias.toLowerCase() === term.toLowerCase() })
      continue
    }
    // A demonym is still a match - which is what stops a stub being proposed
    // for "Dutch" when the Netherlands is already recorded.
    const demonym = (item.demonyms ?? []).find((d) => normalizeTerm(d) === needle)
    if (demonym) {
      peoples.push({ item, via: 'demonym', exact: demonym.toLowerCase() === term.toLowerCase() })
    }
  }
  return [...titled, ...peoples]
}

export const termExists = (term: string, items: Item[]): boolean => matchTerm(term, items).length > 0
