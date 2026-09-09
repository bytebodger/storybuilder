import type { Store } from './store.ts'
import { groupKey, type Item } from './types.ts'

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
