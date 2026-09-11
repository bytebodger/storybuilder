# Forging names

A name does not need judgement. It needs a source and a mutation, and both are arithmetic.

The code is [store/src/names.ts](../store/src/names.ts). No model is involved, which is the whole
point: a name now costs **~125ms instead of 12–20 seconds**, and the supply is unbounded rather than a
shortlist.

## What was wrong

Regenerating a given name went: *Halvard, Elkirk, Halvard, Elkirk, Reboam, Halvard.*

Two problems with one cause. A model asked for "a name in this world" is making an expensive round
trip to sample from a handful of high-probability answers — and the harder you constrain it to a
register, the fewer of those there are. Ask again and you get the same short list back.

## The mutation is the interesting half

A name that is *almost* a name you know reads as authentically foreign in a way an invented string
does not. George R. R. Martin's **Helaena** and **Corlys** against Helena and Corliss: familiar in the
mouth, unfamiliar on the page. So the seeds are real names and the output is one or two edits away
from one of them.

| Operator | Does | Example |
| --- | --- | --- |
| Vowel skew | opens or narrows one vowel | Helena → Hel**ae**na |
| Consonant swap | substitutes a consonant that sounds nearby | Hal**v**ard → Hal**n**ard |
| Elide | drops a letter | Halvard → Ha**·**vard |
| Double / undouble | doubles a consonant between two vowels, or undoes one | Reuben → Reu**bb**en |
| Graft | one syllable of one seed, the last of another | Halvard + Elkirk → Halv**irk** |

About 18% come through unmutated, because a world where no name is ordinary is as uniform as one where
every name is. Most get one edit; a few get two, which is where the genuinely unfamiliar ones come
from.

```
Duarde · Kemji · Torvard · Miira · Tais · Molek · Couthbert · Devica · Xiila
Phoepe · Xiuran · Clemece · Maose · Mildread · Idrys · Serefina · Ottolie · Veshma
```

**2,639 distinct names in 5,000 draws.**

## Leaning, not gated

There are people in England named Tanaka and people in India named Paulo. A generator that enforces a
tidy mapping from culture to name produces a world where every region is a monoculture — which is
less true to life, not more.

So the seeds span as many traditions as could be gathered, and the universe's own names are blended
into the pool at triple weight: the given and family names of the people already recorded, and every
people's [common names](fields-ethnicities.md). A world that has established a register keeps it
without being locked inside it.

### A person's own people

But common names are common for a reason. An English boy is likelier to be Robert or Matthew than
Fabricio — and he may still be Fabricio. So when a person's people has recorded its common names, the
name leans on them — masculine or feminine to match the person, plus unisex.

A list of common names is **not a list of the only names**, and two limits keep it from becoming one.

**Never more than two draws in three.** The rest start from anywhere: the seeds, the people already
recorded, and every other people's names. Because those lists are in the pool too, the exception
usually reads as a neighbour's name rather than a foreign one. *Anywhere* still means the right sex: a
woman is not seeded from any people's men's names, nor from a man already in the canon.

**Never more than 4% of draws per name recorded.** A list is only as deep as the effort that went into
it. An author who writes down *Robert, Edward* and nothing else has flavoured a people, not declared
that a third of its men are Robert — and trusted at the full share, those two names would start two
draws in three. So each name carries 4%, and a list reaches the full share at about sixteen. A name
recorded twice counts once.

Measured over 40,000 names each:

| Names recorded | Names that start from the list | Each name, exactly as recorded |
| --- | --- | --- |
| 2 | 9% | 3.3% |
| 8 | 35% | 3.3% |
| 16 | 67% | 3.2% |
| 40 | 68% | 1.3% |

A little over the nominal 8%, 32% and 64%, because a draw whose mutation is refused is drawn again,
and draws from the wider pool are refused more often. From *Robert, Edward* alone, a thousand people
included 34 Roberts and 29 Edwards. Across 5,000 people rolled in Phonon — whose Kellish lists hold
twelve men's names, twelve women's and four unisex — no given name reached 4% of its sex.

A common name is used exactly as recorded 70% of the time, against 18% for any other seed, because a
people that records Robert means Robert, not Robbert. The rest get one edit, which stretches a list of
ten into a register without leaving it.

Which given-name lists apply goes by **gender before sex**, since a name follows how someone is raised
and known. A word the code does not recognise — unknown, or a category this world has and ours does
not — gets every list, which is a wider register rather than a wrong one.

This is why the [rolled skeleton](rolled-skeleton.md) rolls ethnicity and sex *before* the name. And
Regenerate on a name sends the form's current ethnicity, sex and gender, so a name regenerated after
any of them was changed leans the new way.

## Saying no

The mutations are blind, so something has to refuse their worst output. `sayable` asks whether a
reader can get the word out of their mouth, not whether it belongs to a language:

- 3–14 letters, and at least one vowel
- no letter three times in a row — `Annna`
- no run of four consonants — `Kalvstrd`
- no run of three vowels — `Kaood`, which is a graft that joined badly
- no wall of consonants at the front

Two operator-level guards fix the rest at source. A substitution never repeats the letter that follows
it (`s → sh` before an `h` gives `Roshhan`), and doubling only applies to a consonant with a vowel on
each side and never to `h w y q x c j`. Doubles are deliberately *not* in the consonant-swap table:
smuggling `r → rr` in as a swap skips the context check and produces `Sigrrid`.

A candidate is also rejected if it is already an article in this universe, if the author has turned it
down, or if it is more than four letters longer than its own seed — that last one catches grafts that
read as two names stapled together.

If sixty attempts all fail, it returns an empty string. Offering a name the author already refused is
worse than saying nothing.

## Where it is used

**The [rolled skeleton](rolled-skeleton.md)** forges a given and a family name along with the trade,
birthplace and lifespan — so a person arrives named before a word of prose is written:

```
Emereyc Fontaine       advocate    Kell
Altaar Maan            midwife     Kell
Xiuran Nurmagometov    beadle      Kell
Kerev Naov             beggar      Dol
Eddyth Soemsen         dockhand    Dol
```

**The Regenerate button**, via `FieldSpec.generator` — a field that declares one is filled in code and
never enters a generation request. `people` sets it on Given Name and Family Name. Ten clicks,
measured in the browser:

```
Roer · Stan · Katharzyna · Jin · Mier · Nihil · Rasha · Veena · Kenji · Ainno
~125ms each
```

Rejected values accumulate exactly as they do for a generated field, so twenty clicks cost twenty
different names rather than a loop of two.

## Adding a generator

`generator?: 'given-name' | 'family-name'` on a [field spec](containers.md#fields). The type is a
closed union on purpose — a field that claims code can make it has to name code that exists.
