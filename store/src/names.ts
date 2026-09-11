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
 * Deliberately not culture-gated. There are people in England named Tanaka and
 * people in India named Paulo, and a generator that enforces a tidy mapping
 * from culture to name produces a world where everyone is from a monoculture.
 * The universe's own names are blended into the pool, which is register enough.
 */
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
  random?: Random
}

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

  for (let attempt = 0; attempt < 60; attempt++) {
    const source = pick(pool, random)
    let word = source

    const edits = random() < 0.18 ? 0 : random() < 0.75 ? 1 : 2
    for (let i = 0; i < edits; i++) {
      word = random() < 0.2 ? graftEnding(word, pool, random) : pick(MUTATIONS, random)(word, random)
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
