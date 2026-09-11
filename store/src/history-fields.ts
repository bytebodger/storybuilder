/**
 * The history container's field spec.
 *
 * An event, not a period. That distinction is the whole design of this spec,
 * and it is enforced by what the form asks for rather than by a rule: an event
 * has a begin date and a **duration in days**, and no end date at all.
 *
 * Asking for an end date invites "The Reign of King Arnold, 1139 to 1150" - and
 * a thing that spans eleven years is not an event, it is a timeline. Asking how
 * many days it took makes the same entry read as the mistake it is. Nothing
 * stops an author typing 4,309; the field is a nudge and not a fence, and a
 * flood that ran for nine days is exactly what it is for.
 *
 * Most events last a day because that is how events are remembered. The signing
 * of the Declaration of Independence did not take a day, and it is still the
 * fourth of July.
 */
import { ROOT_TIMELINE_ID } from './types.ts'
import type { FieldSpec } from './field-spec.ts'

export const HISTORY_FIELDS: FieldSpec[] = [
  {
    key: 'name',
    label: 'Name',
    kind: 'text',
    required: true,
    default: null,
    storeAs: 'name',
    help:
      'What the event is called, as it would be referred to afterwards. Name it the way the people ' +
      'who remember it would, which is rarely the way it was described at the time.',
    examples: ['The Burning of the Ash Seat', 'The Third Crossing', 'The Night of Bells'],
  },
  {
    key: 'beginDate',
    label: 'Begin Date',
    kind: 'text',
    required: true,
    default: null,
    storeAs: 'beginDate',
    help:
      'When it started, in this universe’s calendar. Free text, so a world that counts in ages or ' +
      'reigns can say so — but a year has to be somewhere in it, since that is what places the ' +
      'event on its timeline.',
    examples: ['412', 'Year 431', '4th of Hallowing, 431', 'Third Age, 2941'],
  },
  {
    key: 'durationDays',
    label: 'Duration (in Days)',
    kind: 'number',
    required: true,
    default: 0,
    help:
      'How many days it took. Zero for something over in minutes, one for the ordinary case of a ' +
      'thing remembered as happening on a day, more for a siege or a flood. If the answer runs to ' +
      'years, what is being described is a period rather than an event, and it wants a timeline of ' +
      'its own with the events of it filed underneath.',
    examples: ['0', '1', '9', '104'],
  },
  {
    key: 'timeline',
    label: 'Timeline',
    kind: 'timeline',
    required: true,
    default: ROOT_TIMELINE_ID,
    storeAs: 'timeline',
    help:
      'Which stretch of history this belongs to. Everything is under the Universal History unless ' +
      'it is filed somewhere narrower, and filing it narrower does not take it out of the wider ' +
      'one: a battle under the War of the Stewards is still part of the reign the war was fought in.',
  },
  {
    key: 'description',
    label: 'Description',
    kind: 'longtext',
    required: false,
    default: null,
    storeAs: 'summary',
    help:
      'What happened, in two to four sentences. This is what every other article shows when the ' +
      'event is mentioned in passing, so it has to stand on its own. What it *meant* goes below.',
  },
  {
    key: 'longTermConsequences',
    label: 'Long-Term Consequences',
    kind: 'longtext',
    required: false,
    default: null,
    fillRate: 0.6,
    help:
      'What the world was like afterwards that it was not before: what it ended, what it started, ' +
      'what is still argued about. An event with nothing here is decoration; an event with ' +
      'something here is why the canon has a shape.',
  },
  {
    key: 'relatedEthnicities',
    label: 'Related Ethnicities',
    kind: 'list',
    required: false,
    default: [],
    fillRate: 0.4,
    help:
      'The peoples it happened to, or was done by. Name each as its article is titled and the ' +
      'reference will link itself.',
  },
  {
    key: 'relatedLocations',
    label: 'Related Locations',
    kind: 'list',
    required: false,
    default: [],
    help: 'Where it happened, and anywhere else it reached.',
  },
  {
    key: 'relatedPeople',
    label: 'Related People',
    kind: 'list',
    required: false,
    default: [],
    help:
      'Who was there and who was responsible, which are often different lists. Include the people ' +
      'it was done to.',
  },
  {
    key: 'relatedInstitutions',
    label: 'Related Institutions',
    kind: 'list',
    required: false,
    default: [],
    fillRate: 0.5,
    help: 'The orders, guilds, houses and offices that acted in it or were changed by it.',
  },
]
