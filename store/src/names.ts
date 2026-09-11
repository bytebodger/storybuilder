/**
 * Names, made without asking a model.
 *
 * Regenerating a given name took twelve to twenty seconds and cycled through a
 * shallow pool: Halvard, Elkirk, Halvard, Elkirk, Reboam, Halvard. Both
 * problems have the same cause. A model asked for "a name in this world" is
 * doing an expensive round trip to sample from a handful of high-probability
 * answers, and the harder you constrain it to a register the fewer of them
 * there are.
 *
 * A name does not need judgement. It needs a source and a mutation, and both
 * are arithmetic. This is instant, and its variety is unbounded because it is
 * generative rather than selective.
 *
 * The mutation is the interesting half. A name that is *almost* a name you know
 * reads as authentically foreign in a way an invented string does not - George
 * R. R. Martin's Helaena and Corlys against Helena and Corliss. Familiar in the
 * mouth, unfamiliar on the page. So the seeds are real names, drawn from as
 * many traditions as possible, and what comes out is one or two edits away from
 * one of them.
 *
 * Leaning, not gated. There are people in England named Tanaka and people in
 * India named Paulo, and a generator that enforces a tidy mapping from culture
 * to name produces a world where everyone is from a monoculture. But common
 * names are common for a reason: an English boy is likelier to be Robert than
 * Fabricio, and may still be Fabricio. So a person whose people has recorded
 * its common names draws from those most of the time and from anywhere the rest
 * of it - see `COMMON_SHARE`.
 *
 * The universe's own names are blended into the pool, which is register enough.
 */
import type { Item } from './types.ts'

/** A source of randomness, injectable so a name can be reproduced in a test. */
export type Random = () => number

const VOWELS = 'aeiouy'
const isVowel = (c: string) => VOWELS.includes(c.toLowerCase())

/**
 * Seeds, not a name database.
 *
 * Every one of these is a starting point for an edit rather than an answer, so
 * breadth matters more than depth: two hundred seeds across many traditions,
 * each with a dozen plausible mutations, is a space nobody exhausts.
 */
const GIVEN = `
Halvard Eirik Sigrid Astrid Bjorn Gunnar Ingrid Leif Torvald Solveig Ragna Sten
Alfred Edith Godwin Hilda Oswin Wilfred Cuthbert Mildred Aldith Kenric Wulfric
Brannagh Cormac Niamh Rhydderch Eilidh Maeve Bran Cerys Gwendolyn Aneurin Idris
Paulo Isabela Matteo Lucia Rafael Elena Tomas Ines Serafina Bartolo Ximena Duarte
Miroslav Zofia Dragan Vesna Bogdan Ludmila Radomir Katarzyna Vlasta Jarek Milena
Thessaly Nikephoros Xanthe Demos Kallias Phoebe Iphigenia Theron Melina Andronikos
Yusuf Layla Tamar Reuben Zahra Ezra Miriam Salim Nadira Yonatan Rasha Shulamit
Darius Roshan Parvaneh Kaveh Anahita Farrokh Soraya Bahram Nasrin Jamshid
Anand Devika Rohan Priya Kiran Vikram Meera Ishaan Lakshmi Arjun Saraswati Nikhil
Tanaka Haruki Mei Jian Sora Ryo Lian Kenji Yuna Takeshi Xiulan Hana Jin Minseo
Bayani Mahesa Intan Rangga Dewi Sitti Ardhi Melati
Kwame Amara Chidi Zola Thandi Sekou Nia Abeba Folasade Tendai Oyelaran Ifedayo
Batu Gulnara Timur Aigul Erdene Altan Saule Nurbek
Aino Eino Kalev Rasa Vaino Liisu Mikkel Taavi Ruta
Iker Amaia Garikoitz Nekane
Corr Aldric Thessa Marek Odile Calla Roswitha Emeric Sabinus Verity Ottoline
Percival Lysander Rowena Tobias Winifred Ambrose Clemence Hesper Barnaby Lettice
`
  .trim()
  .split(/\s+/)

const FAMILY = `
Vane Corle Draye Brack Ashkeeper Holloway Thorn Marsh Kettleby Ravensworth
Alderton Beckwith Coldwater Farrier Grimsby Harrow Larkin Netherby Oakes Pell
Quarry Ransome Sallow Tarrant Underhill Veyle Wexford Yarrow Ambleside Birkett
Tanaka Okonkwo Ferreira Novak Mikkelsen Abadi Rautio Balakrishnan Nurmagomedov
Delacroix Vasquez Kowalski Haraldsen Bergqvist Papadakis Ivanov Sorensen Lindqvist
Achterberg Bouchard Castellan Dumont Eriksen Fontaine Guerrero Halloran Iversen
Jansen Karpov Lombardi Marchetti Nakamura Ostrowski Pereira Quintero Rasmussen
Salazar Thibault Ueda Valdez Wojcik Yamamoto Zielinski Abernathy Blackwood
Cathcart Denholm Ellwood Fairweather Gathercole Hawksley Inchbald Kingsnorth
Lockridge Mortlake Norrington Pemberton Rookwood Shackleton Thistlewood Wraysbury
`
  .trim()
  .split(/\s+/)

export type NameKind = 'given' | 'family'

export interface NameOptions {
  kind?: NameKind
  /** Names this universe already uses. Blended in, so output stays in register. */
  canon?: string[]
  /** Names already taken. Never returned. */
  taken?: Iterable<string>
  /** Names the author has already turned down. Never returned. */
  avoid?: Iterable<string>
  /**
   * The names common among this person's own people.
   *
   * Favoured, not required. A share of draws start from these and the rest
   * start from anywhere, so a Kellish woman is usually named like one and can
   * still be named like somebody's grandmother from across the water.
   */
  common?: string[]
  random?: Random
}

/**
 * The most a name leans on the person's own people's common names: the share
 * of draws that start from that list, once the list is long enough to bear it.
 *
 * Not one, because a list of common names is not a list of the only names. An
 * English boy is likelier to be Robert or Matthew and may still be Fabricio.
 * The rest of the draws come from the whole pool, which holds every other
 * people's recorded names as well, so the exception usually reads as a
 * neighbour's name rather than a foreign one.
 */
export const COMMON_SHARE = 0.65

/**
 * The most any one recorded name carries, as a share of draws.
 *
 * A list is only as deep as the effort that went into it. An author who wrote
 * down "Robert, Edward" and nothing else has flavoured a people, not declared
 * that a third of its men are Robert - and trusted at the full share, those two
 * names would start two draws in three. So a list is leaned on in proportion to
 * its length: each name adds this much, up to `COMMON_SHARE`, which a list
 * reaches at about sixteen names.
 */
export const COMMON_PER_NAME = 0.04

/** How much of a person's naming a list of this many common names carries. */
export const commonShareFor = (size: number) =>
  Math.min(COMMON_SHARE, Math.max(0, size) * COMMON_PER_NAME)

/**
 * How often a common name is used exactly as recorded.
 *
 * Far higher than the 18% any other seed comes through unmutated, because a
 * common name is already an answer: a people that records Robert means Robert,
 * not Robbert. The rest get one edit, which stretches a list of ten into a
 * register without leaving it.
 */
const COMMON_KEPT = 0.7

const pick = <T,>(list: T[], random: Random): T => list[Math.floor(random() * list.length)]

// --- the mutations ---------------------------------------------------------

/** Positions in a word where an edit does not destroy the shape of it. */
const inner = (word: string) => {
  const out: number[] = []
  for (let i = 1; i < word.length - 1; i++) out.push(i)
  return out.length ? out : [Math.max(0, word.length - 1)]
}

/** Helena to Helaena, Corliss to Corlys. One vowel, opened out or narrowed. */
const VOWEL_SKEW: Record<string, string[]> = {
  a: ['ae', 'e', 'o'],
  e: ['ea', 'ei', 'a', 'i'],
  i: ['y', 'ie', 'e', 'ei'],
  o: ['oa', 'ou', 'u', 'a'],
  u: ['ou', 'o', 'a'],
  y: ['i', 'ie'],
}

/**
 * Consonants that stand in for one another without changing how a name sounds
 * in the mouth.
 *
 * No doubles here even though they are tempting substitutions. Doubling is its
 * own operator and checks that the letter has a vowel on each side; smuggling
 * `r -> rr` in as a swap skips that check and produces `Sigrrid`.
 */
const CONSONANT_SWAP: Record<string, string[]> = {
  b: ['p', 'v'],
  c: ['k', 'g'],
  d: ['t', 'th'],
  f: ['v', 'ph'],
  g: ['k', 'gh'],
  k: ['c', 'g'],
  l: ['r'],
  m: ['n'],
  n: ['m'],
  p: ['b'],
  r: ['l'],
  s: ['z', 'sh'],
  t: ['d', 'th'],
  v: ['f', 'w', 'n'],
  w: ['v'],
  z: ['s'],
}

/**
 * Put `piece` in at `at`, unless doing so repeats the letter already there.
 *
 * A two-letter substitution can collide with what follows it: swapping the s in
 * `Roshan` for `sh` gives `Roshhan`. Cheap to notice, and the alternative is a
 * rule in `sayable` trying to tell a deliberate double from an accidental one.
 */
function substitute(word: string, at: number, piece: string): string {
  if (piece[piece.length - 1].toLowerCase() === (word[at + 1] ?? '').toLowerCase()) return word
  return word.slice(0, at) + piece + word.slice(at + 1)
}

function skewVowel(word: string, random: Random): string {
  const spots = inner(word).filter((i) => VOWEL_SKEW[word[i].toLowerCase()])
  if (!spots.length) return word
  const at = pick(spots, random)
  return substitute(word, at, pick(VOWEL_SKEW[word[at].toLowerCase()], random))
}

function swapConsonant(word: string, random: Random): string {
  const spots = inner(word).filter((i) => CONSONANT_SWAP[word[i].toLowerCase()])
  if (!spots.length) return word
  const at = pick(spots, random)
  return substitute(word, at, pick(CONSONANT_SWAP[word[at].toLowerCase()], random))
}

/** Drop a letter. Halvard to Havard. */
function elide(word: string, random: Random): string {
  const spots = inner(word).filter((i) => !isVowel(word[i]) || isVowel(word[i - 1] ?? ''))
  if (!spots.length || word.length <= 4) return word
  const at = pick(spots, random)
  return word.slice(0, at) + word.slice(at + 1)
}

/** The index of each run of vowels in a word. */
function vowelRuns(word: string): number[] {
  const out: number[] = []
  for (let i = 0; i < word.length; i++) {
    if (isVowel(word[i]) && !isVowel(word[i - 1] ?? '')) out.push(i)
  }
  return out
}

/**
 * Take the tail off another seed. Halvard plus Elkirk gives Halvirk.
 *
 * Both cuts land on a vowel run rather than anywhere, and the head is taken
 * from near the front while the tail is taken from near the back. Cutting
 * wherever produced things like `Blackwoerton` - not unsayable, but visibly
 * two words stapled together rather than one name.
 */
function graftEnding(word: string, pool: string[], random: Random): string {
  const other = pick(pool, random)
  if (other.length < 4 || word.length < 4) return word

  const head = vowelRuns(word).filter((i) => i > 0)
  const tail = vowelRuns(other).filter((i) => i > 0 && i < other.length - 1)
  if (!head.length || !tail.length) return word

  // The first vowel run of the head, the last of the tail: one syllable of each
  // rather than most of both.
  return word.slice(0, head[0] + 1) + other.slice(tail[tail.length - 1])
}

/**
 * Double a consonant, or undo one that is already doubled.
 *
 * Never against another consonant, and never a letter that is doing digraph
 * work. Doubling the h in `Rasha` gives `Rashha`, which is three consonants and
 * a dare.
 */
const UNDOUBLEABLE = 'hwyqxcj'

function doubleOrSingle(word: string, random: Random): string {
  for (let i = 1; i < word.length - 1; i++) {
    if (word[i] === word[i + 1] && !isVowel(word[i])) return word.slice(0, i) + word.slice(i + 1)
  }
  const spots = inner(word).filter(
    (i) =>
      !isVowel(word[i]) &&
      word[i] !== word[i + 1] &&
      !UNDOUBLEABLE.includes(word[i].toLowerCase()) &&
      isVowel(word[i - 1] ?? '') &&
      isVowel(word[i + 1] ?? ''),
  )
  if (!spots.length) return word
  const at = pick(spots, random)
  return word.slice(0, at + 1) + word[at] + word.slice(at + 1)
}

const MUTATIONS = [skewVowel, skewVowel, swapConsonant, swapConsonant, elide, doubleOrSingle]

// --- quality ---------------------------------------------------------------

/**
 * Is this still a name?
 *
 * The mutations are blind, so something has to say no. These rules are about
 * whether a reader can get the word out of their mouth, not about whether it
 * belongs to a language.
 */
export function sayable(word: string): boolean {
  const w = word.toLowerCase()
  if (w.length < 3 || w.length > 14) return false
  if (!/[aeiouy]/.test(w)) return false
  if (/(.)\1\1/.test(w)) return false
  if (/[^aeiouy]{4,}/.test(w)) return false
  // Three vowels in a row is a graft that joined badly - `Haow`, `Kaood`. None
  // of the seeds has one, so nothing legitimate is lost by refusing it.
  if (/[aeiouy]{3,}/.test(w)) return false
  // A name that starts with a wall of consonants reads as a typo.
  if (/^[^aeiouy]{3,}/.test(w)) return false
  return true
}

const tidy = (word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()

const keyOf = (word: string) => word.trim().toLowerCase()

/**
 * One name.
 *
 * Some come through unmutated, because a world where no name is ordinary is as
 * uniform as one where every name is. Most are one edit from a seed, and a few
 * are two, which is where the genuinely unfamiliar ones come from.
 */
export function forgeName(options: NameOptions = {}): string {
  const { kind = 'given', canon = [], random = Math.random } = options
  const off = new Set([...(options.taken ?? []), ...(options.avoid ?? [])].map(keyOf))

  // The universe's own names count for more than the seeds, so a world that has
  // established a register keeps it - without being locked inside it.
  const seeds = kind === 'family' ? FAMILY : GIVEN
  const pool = [...seeds, ...canon, ...canon, ...canon].filter((n) => n && n.length > 2)
  // Each name once: a name recorded twice is not twice as common, and counting
  // it twice would lean on a short list harder than its length allows.
  const common = [
    ...new Map(
      (options.common ?? []).filter((n) => n && n.length > 2).map((n) => [keyOf(n), n] as const),
    ).values(),
  ]
  const share = commonShareFor(common.length)

  for (let attempt = 0; attempt < 60; attempt++) {
    // Only rolled when there is a list, so a person whose people has recorded
    // no names is named exactly as before.
    const fromCommon = common.length > 0 && random() < share
    // A graft takes its tail from wherever the name came from, so a common name
    // mutates into a cousin of the list rather than of the whole world.
    const donors = fromCommon ? common : pool
    const source = pick(donors, random)
    let word = source

    const edits = fromCommon
      ? random() < COMMON_KEPT ? 0 : 1
      : random() < 0.18 ? 0 : random() < 0.75 ? 1 : 2
    for (let i = 0; i < edits; i++) {
      word = random() < 0.2 ? graftEnding(word, donors, random) : pick(MUTATIONS, random)(word, random)
    }

    const candidate = tidy(word)
    if (!sayable(candidate)) continue
    // A mutation should be a cousin of its seed, not a compound of two names.
    if (candidate.length > source.length + 4) continue
    if (off.has(keyOf(candidate))) continue
    // An unmutated seed is fine; an unmutated seed offered twice is not, which
    // is what `avoid` is for. But a two-edit mutation that lands back on its own
    // source has done nothing, and that is worth rejecting outright.
    if (edits > 0 && keyOf(candidate) === keyOf(source)) continue
    return candidate
  }

  // Sixty failures means the world is small and heavily used. Say so rather
  // than returning a name that was already refused.
  return ''
}

/** A given name and a family name that do not collide with each other. */
export function forgeFullName(options: NameOptions = {}): { given: string; family: string } {
  const given = forgeName({ ...options, kind: 'given' })
  const family = forgeName({
    ...options,
    kind: 'family',
    taken: [...(options.taken ?? []), given],
  })
  return { given, family }
}

// --- where names come from --------------------------------------------------

/** The parts of a person that bear on what they are called. */
export interface NameBearer {
  ethnicity?: unknown
  sex?: unknown
  gender?: unknown
}

/**
 * Where a person's names come from, read off the store.
 *
 * `canon` is every name of this kind the universe has recorded that could be
 * this person's: the given or family names of the people already in it, and
 * every people's common names. `common` is the lists of this person's own
 * people, when the store holds that people and it has recorded any.
 *
 * Both are narrowed to the person's sex - the wider pool as well as their own
 * people's lists. With only the own list narrowed, the rest leaked back in as
 * canon: two of the first twenty-four people generated in Phonon came out a
 * woman named Hesker and a man named Morwen.
 */
export function nameSources(
  items: Item[],
  kind: NameKind,
  person: NameBearer = {},
): { canon: string[]; common: string[] } {
  const lean = kind === 'given' ? leaningOf(person) : null
  const lists =
    kind === 'family'
      ? ['familyNames']
      : lean
        ? [`${lean}Names`, 'unisexNames']
        : ['masculineNames', 'feminineNames', 'unisexNames']
  const listed = (item: Item) => lists.flatMap((key) => asNames(item.attributes?.[key]))

  // Someone recorded as the other sex lends no given name. Someone recorded
  // with none, or with a word this code does not read, lends theirs to anyone.
  const couldShare = (other: Item) => {
    const theirs = leaningOf(other.attributes ?? {})
    return !lean || !theirs || theirs === lean
  }

  const peoples = items.filter((i) => i.container === 'ethnicities')
  const recorded = items
    .filter((i) => i.container === 'people' && couldShare(i))
    .flatMap((i) => partOf(i, kind))

  const wanted = keyOf(String(person.ethnicity ?? ''))
  const own = wanted
    ? peoples.find((p) => [p.name, ...(p.aliases ?? [])].some((n) => keyOf(n) === wanted))
    : undefined

  return {
    canon: [...recorded, ...peoples.flatMap(listed)],
    common: own ? listed(own) : [],
  }
}

/**
 * Which way a person's given name leans, if that can be read.
 *
 * Gender before sex, since a name follows how someone is raised and known.
 * Anything unrecognised - unknown, or a category this world has and ours does
 * not - leans nowhere and gets every list, which is a wider register rather
 * than a wrong one.
 */
function leaningOf(person: NameBearer): 'masculine' | 'feminine' | null {
  const word = String(person.gender || person.sex || '').toLowerCase()
  if (/\b(female|feminine|woman|girl|f)\b/.test(word)) return 'feminine'
  if (/\b(male|masculine|man|boy|m)\b/.test(word)) return 'masculine'
  return null
}

/** A stored list of names, whether the form wrote it or someone typed it into the file. */
const asNames = (value: unknown): string[] =>
  (Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [])
    .map((v) => String(v).trim())
    .filter(Boolean)

/**
 * The given or the family part of a recorded person's name.
 *
 * Taken from the parts the form stores. A person written some other way has
 * only the joined name, and its first or last word is the best guess - better
 * than the whole string, which went into the pool with its space inside it and
 * could come back out as a given name with a surname in it.
 */
function partOf(person: Item, kind: NameKind): string[] {
  const stored = person.attributes?.[kind === 'family' ? 'familyName' : 'givenName']
  if (typeof stored === 'string' && stored.trim()) return [stored.trim()]
  const words = person.name.trim().split(/\s+/).filter(Boolean)
  if (kind === 'given') return words.slice(0, 1)
  return words.length > 1 ? [words[words.length - 1]] : []
}
