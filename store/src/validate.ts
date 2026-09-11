import type { Store } from './store.ts'
import { groupKey, type Item } from './types.ts'
import { yearOf } from './timelines.ts'
import { fieldsFor } from './fields.ts'

export interface Issue {
  severity: 'error' | 'warning'
  itemId?: string
  message: string
}

/**
 * Checks the invariants the store maintains but a hand-edit can break. The
 * files are plain JSON and meant to be readable and editable, so the cost of
 * that openness is that something has to check the edges afterwards.
 */
export async function validate(store: Store): Promise<Issue[]> {
  const items = await store.list()
  const index = new Map<string, Item>()
  const issues: Issue[] = []

  for (const item of items) {
    const clash = index.get(item.id)
    if (clash) {
      issues.push({
        severity: 'error',
        itemId: item.id,
        message: `Duplicate id "${item.id}": "${clash.name}" (${clash.container}) and "${item.name}" (${item.container})`,
      })
    }
    index.set(item.id, item)
  }

  for (const item of items) {
    for (const tag of item.tags) {
      const other = index.get(tag.relatedTo)
      if (!other) {
        issues.push({
          severity: 'error',
          itemId: item.id,
          message: `"${item.name}" is tagged to "${tag.relatedTo}", which does not exist in this universe`,
        })
        continue
      }
      if (tag.type !== other.container) {
        issues.push({
          severity: 'error',
          itemId: item.id,
          message: `"${item.name}" tags "${other.name}" as ${tag.type}, but it is a ${other.container}`,
        })
      }
      if (!other.tags.some((t) => t.relatedTo === item.id)) {
        issues.push({
          severity: 'error',
          itemId: item.id,
          message: `One-sided edge: "${item.name}" points at "${other.name}", which does not point back`,
        })
      }
    }

    for (const [type, record] of Object.entries(item.closure ?? {})) {
      // Closure keys on the target's group key, which is its kind when it has
      // one - so membership has to be resolved, not read off the tag's type.
      const hasMember = item.tags.some((t) => {
        const other = index.get(t.relatedTo)
        return !!other && groupKey(other) === type
      })
      if (record.state === 'closed' && !hasMember) {
        issues.push({
          severity: 'warning',
          itemId: item.id,
          message: `"${item.name}" declares a closed set of ${type} with no members - read as "it has none"`,
        })
      }
      if (record.state === 'closed' && !record.note) {
        issues.push({
          severity: 'warning',
          itemId: item.id,
          message: `"${item.name}" closes ${type} with no reason recorded - a later session cannot tell whether it may be reopened`,
        })
      }
    }
  }

  /*
   * Every event has to be readable as a point on its timeline.
   *
   * Two ways it can fail to be, and both are silent without this. A timeline
   * that has been removed by hand leaves its events filed nowhere; and a begin
   * date with no year in it - "midwinter", "the long winter" - reads as a date
   * to a person and as nothing to `yearOf`, so the event simply drops out of
   * every span its timeline reports without anything looking wrong.
   */
  const timelines = new Set((await store.timelines()).map((t) => t.id))
  for (const item of items) {
    if (item.timeline && !timelines.has(item.timeline)) {
      issues.push({
        severity: 'error',
        itemId: item.id,
        message: `"${item.name}" is filed under timeline "${item.timeline}", which does not exist in this universe`,
      })
    }
    if (item.timeline && yearOf(item.beginDate) === null) {
      issues.push({
        severity: 'warning',
        itemId: item.id,
        message:
          `"${item.name}" has no year that can be read out of its begin date ` +
          `(${item.beginDate ? `"${item.beginDate}"` : 'which is empty'}) - ` +
          `it will not count toward the span of any timeline`,
      })
    }
  }

  /*
   * Fill-rate overrides that point at nothing.
   *
   * A rate is a share on a field of a container, written by hand into a
   * manifest, and a typo in either name is silent: the override is simply never
   * consulted and the field keeps the spec's default. Nothing looks wrong, and
   * the world does not behave the way its author told it to.
   */
  const manifest = await store.manifest()
  for (const [container, rates] of Object.entries(manifest.fillRates ?? {})) {
    const spec = fieldsFor(container)
    if (!spec) {
      issues.push({
        severity: 'warning',
        message: `Fill rates are set for "${container}", which has no field spec - they do nothing`,
      })
      continue
    }
    for (const [key, rate] of Object.entries(rates)) {
      const field = spec.find((f) => f.key === key)
      if (!field) {
        issues.push({
          severity: 'warning',
          message: `Fill rate set for ${container}.${key}, which is not a field of ${container}`,
        })
        continue
      }
      if (typeof rate !== 'number' || !Number.isFinite(rate) || rate < 0 || rate > 1) {
        issues.push({
          severity: 'warning',
          message: `Fill rate for ${container}.${key} is ${JSON.stringify(rate)} - expected a share between 0 and 1`,
        })
      }
      if (field.required) {
        issues.push({
          severity: 'warning',
          message: `Fill rate set for ${container}.${key}, which is required and is always filled`,
        })
      }
    }
  }

  const seen = new Map<string, Item>()
  for (const item of items) {
    const key = `${item.container}:${item.name.toLowerCase()}`
    const clash = seen.get(key)
    if (clash) {
      issues.push({
        severity: 'warning',
        itemId: item.id,
        message: `Two ${item.container} items are both named "${item.name}" (${clash.id}, ${item.id})`,
      })
    }
    seen.set(key, item)
  }

  return issues
}
