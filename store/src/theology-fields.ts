/**
 * The theology container's field spec.
 *
 * Religions and cults of any size, and also individual deities, doctrines and
 * dogmas. It shares most of its shape with
 * [institutions](institutions-fields.ts) on purpose - a faith with a hierarchy,
 * property and a founding year is an institution that also believes something -
 * and adds the six fields that are only about the believing.
 *
 * Two of those six need the roll more than anything else here. **Claimed
 * Powers** asks what adherents say their faith confers, and the help is
 * explicit that a claim is not an establishment: a world whose laws say there
 * is no magic still has priests who say otherwise, and the article should be
 * able to record the claim without the world acquiring a miracle. **Pantheon**
 * is rolled because this container holds single deities and bare doctrines as
 * well as faiths, and neither of those has one.
 */
import type { FieldSpec } from './field-spec.ts'
import { demonymsField } from './common-fields.ts'

export const THEOLOGY_FIELDS: FieldSpec[] = [
  {
    key: 'name',
    label: 'Name',
    kind: 'text',
    required: true,
    default: null,
    storeAs: 'name',
    group: 'Overview',
    help: 'What the faith, order or deity is called, as those outside it would say it.',
    examples: ['The Quiet Hand', 'the Salt Rite', 'Verrin of the Two Moons'],
  },
  demonymsField({ group: 'Overview', fillRate: 0.5 }),
  {
    key: 'description',
    label: 'Description',
    kind: 'longtext',
    required: false,
    default: null,
    storeAs: 'summary',
    group: 'Overview',
    help:
      'The opening paragraph: what is believed, by whom, and what that looks like from outside. Two ' +
      'to four sentences. Every other article shows this when the faith is mentioned in passing, so ' +
      'it has to stand alone.',
  },
  {
    key: 'foundingYear',
    label: 'Founding Year',
    kind: 'text',
    required: false,
    default: null,
    storeAs: 'beginDate',
    group: 'Overview',
    help:
      'When it began, in this universe’s calendar. Free text, but a year has to be in it. A faith ' +
      'that grew rather than being founded should say so and give the year it is first heard of - ' +
      'and what it says about its own beginning belongs in Origins.',
    examples: ['412', 'Year 198', 'first named in 604; older in the telling'],
  },
  {
    key: 'dissolutionYear',
    label: 'Dissolution Year',
    kind: 'text',
    required: false,
    default: null,
    fillRate: 0.2,
    storeAs: 'endDate',
    group: 'Overview',
    help:
      'When it ended, if it has. Blank covers a faith still kept and one whose end nobody recorded. ' +
      'Where it is known to be gone but the year is not, say that here rather than leaving it ' +
      'empty - an empty field is what lets a suppressed rite turn up intact in a later scene.',
    examples: ['812', 'Year 1104', 'unknown', 'suppressed some time in the long winter'],
  },
  {
    key: 'aliases',
    label: 'Aliases',
    kind: 'list',
    required: false,
    default: [],
    fillRate: 0.5,
    storeAs: 'aliases',
    group: 'Overview',
    help:
      'Every other name it goes by: an older name, a short name, what its enemies call it. These are ' +
      'stored as the item’s aliases, so a mention of any of them links to this article and never ' +
      'raises a stub.',
  },
  {
    key: 'members',
    label: 'Estimated Population/Members',
    kind: 'text',
    required: false,
    default: null,
    fillRate: 0.6,
    group: 'Overview',
    help:
      'How many hold to it, and when that was counted if the number moved. Free text, and "nobody ' +
      'has counted" is an answer. Where the faithful and the merely observant are different numbers, ' +
      'give both.',
    examples: ['most of the Reach', 'about 2,000 sworn', 'nine, and they will not say where'],
  },
  {
    key: 'founders',
    label: 'Founders',
    kind: 'list',
    required: false,
    default: [],
    fillRate: 0.45,
    group: 'Overview',
    help:
      'Who established it - people, families, other faiths. Name each as their article is titled. ' +
      'Many faiths have no founder anyone can name, and some name one nobody can find.',
  },
  {
    key: 'structure',
    label: 'Structure',
    kind: 'longtext',
    required: false,
    default: null,
    group: 'Inside',
    help:
      'How it is arranged: orders, houses, ranks, who answers to whom, and how someone rises. Where ' +
      'the chart and the real authority differ, say how.',
  },
  {
    key: 'culture',
    label: 'Culture',
    kind: 'longtext',
    required: false,
    default: null,
    group: 'Inside',
    help:
      'What it is like to be inside it: how the faithful speak to one another, what is worn, what is ' +
      'celebrated, what gets someone quietly shunned.',
  },
  {
    key: 'publicAgenda',
    label: 'Public Agenda',
    kind: 'longtext',
    required: false,
    default: null,
    group: 'Inside',
    help:
      'What it says it wants, in its own words - and, where they differ, what it acts as though it ' +
      'wants. The gap between the two is usually the article.',
  },
  {
    key: 'assets',
    label: 'Assets',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.5,
    group: 'Inside',
    help:
      'What it owns and lives on: temples, land, relics, tithes, endowments, debts. Where the money ' +
      'comes from tells a reader more than what it is worth.',
  },
  {
    key: 'history',
    label: 'History',
    kind: 'longtext',
    required: false,
    default: null,
    group: 'History',
    help:
      'What has happened to it, in order: schisms, revivals, persecutions, reforms, the year it took ' +
      'power or lost it. Events large enough to stand alone belong in their own History articles.',
  },
  {
    key: 'disbandment',
    label: 'Disbandment',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.2,
    group: 'History',
    help:
      'How it ended, if it did: who ended it, what became of the faithful and the property, and what ' +
      'survives of it in custom. Only for a faith that is actually gone.',
  },
  {
    key: 'controlledLocations',
    label: 'Owned/Controlled Locations',
    kind: 'list',
    required: false,
    default: [],
    fillRate: 0.5,
    group: 'Reach',
    help:
      'Places it holds outright or rules in practice: a temple, a quarter, an island, a whole ' +
      'province. Name each as its article is titled.',
  },
  {
    key: 'associatedLocations',
    label: 'Associated Locations',
    kind: 'list',
    required: false,
    default: [],
    fillRate: 0.6,
    group: 'Reach',
    help: 'Places it is kept, argued over, or bound up with without owning - including where it began.',
  },
  {
    key: 'associatedEthnicities',
    label: 'Associated Ethnicities',
    kind: 'list',
    required: false,
    default: [],
    fillRate: 0.5,
    group: 'Reach',
    help:
      'The peoples who keep it, were converted to it, or are excluded from it. Where the association ' +
      'is resented or disputed, that belongs in the prose above.',
  },
  {
    key: 'associatedInstitutions',
    label: 'Associated Institutions',
    kind: 'list',
    required: false,
    default: [],
    fillRate: 0.5,
    group: 'Reach',
    help:
      'Orders, guilds, houses and offices it funds, is funded by, quarrels with, or shares members ' +
      'with.',
  },
  {
    key: 'laws',
    label: 'Laws & Covenants',
    kind: 'longtext',
    required: false,
    default: null,
    group: 'Rule',
    help:
      'What it binds the faithful to, the oaths they swear, and what it can do to someone who breaks ' +
      'them. Where a rule is widely ignored, say so - that is a fact about the faith.',
  },
  {
    key: 'governance',
    label: 'Governance',
    kind: 'longtext',
    required: false,
    default: null,
    group: 'Rule',
    help:
      'How it governs itself: how leaders are chosen and unseated, how doctrine is settled, and how ' +
      'disputes between the faithful are judged. Say what happens when the process fails - a schism ' +
      'is a governance failure with a theology attached.',
  },
  {
    key: 'legends',
    label: 'Legends & Mythology',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.4,
    group: 'Belief',
    help:
      'The stories it tells - creation, judgement, the end of things - and the ones told about it by ' +
      'everyone else. Where a legend has its own article, name it as that article is titled.',
  },
  {
    key: 'origins',
    label: 'Origins',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.6,
    group: 'Belief',
    help:
      'The account of how it began, which is not the founding year: the revelation, the vision, the ' +
      'first convert. Where the story it tells and the record disagree, give both and say which is ' +
      'which.',
  },
  {
    key: 'ethics',
    label: 'Ethics',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.5,
    group: 'Belief',
    help:
      'What it holds to be right and wrong, and what it forbids even where the law allows it. Where ' +
      'it has broken its own code, say when.',
  },
  {
    key: 'tenets',
    label: 'Tenets of Faith',
    kind: 'longtext',
    required: false,
    default: null,
    group: 'Faith',
    help:
      'What must be believed, as plainly as it can be put - and what may be argued about. A faith is ' +
      'defined as much by the question it leaves open as by the answer it insists on.',
  },
  {
    key: 'worship',
    label: 'Worship Practices',
    kind: 'longtext',
    required: false,
    default: null,
    group: 'Faith',
    help:
      'What the faithful actually do: when, where, how often, alone or together, and what is said or ' +
      'burned or eaten. What an outsider would notice first.',
  },
  {
    key: 'priesthood',
    label: 'Priesthood',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.7,
    group: 'Faith',
    help:
      'Who leads the rites, how they are chosen and trained, what they are forbidden, and how they ' +
      'live. Plenty of faiths have no clergy at all - the household keeps its own rites - and that ' +
      'is worth saying where it is true.',
  },
  {
    key: 'claimedPowers',
    label: 'Claimed Powers',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.4,
    group: 'Faith',
    help:
      'What adherents say their faith confers - healing, prophecy, protection, a good passage - and ' +
      'who is said to have shown it. A claim is not an establishment: where the universe’s laws say ' +
      'nothing of the kind happens, record the claim and say that it is one.',
  },
  {
    key: 'pantheon',
    label: 'Pantheon',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.7,
    group: 'Faith',
    help:
      'The divine beings it recognises and what each is held to govern: gods, demigods, saints, ' +
      'adversaries. Name any that have articles of their own as those are titled. A faith with one ' +
      'god, or none, says so here.',
  },
  {
    key: 'sects',
    label: 'Sects',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.3,
    group: 'Faith',
    help:
      'Factions and splinters within it: what divides them, how openly, and whether any has broken ' +
      'away entirely. Most faiths have none worth recording; the ones that do are rarely quiet about ' +
      'it.',
  },
]
