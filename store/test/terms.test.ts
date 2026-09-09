import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { matchTerm, normalizeTerm, singularize, termExists } from '../src/terms.ts'
import type { Item } from '../src/types.ts'

const item = (name: string, aliases?: string[]): Item => ({
  id: name.toLowerCase().replace(/\W/g, ''),
  container: 'fauna',
  name,
  aliases,
  tags: [],
  createdAt: '',
  updatedAt: '',
})

describe('normalising a term', () => {
  it('collapses the spellings of one name', () => {
    for (const spelling of ['Thorinflies', 'thorinfly', 'The Thorinflies', "Thorinfly's", 'THORINFLIES']) {
      assert.equal(normalizeTerm(spelling), 'thorinfly', spelling)
    }
  })

  it('singularises only the head noun', () => {
    // "Dawn Reavers" and "Dawn Reaver" are the same group.
    assert.equal(normalizeTerm('Dawn Reavers'), normalizeTerm('Dawn Reaver'))
    // But an inner plural is part of the name and must survive.
    assert.equal(normalizeTerm('Isles of the Dawn'), 'isles of the dawn')
  })

  it('handles the plural endings worth handling', () => {
    assert.equal(singularize('flies'), 'fly')
    assert.equal(singularize('wolves'), 'wolf')
    assert.equal(singularize('marshes'), 'marsh')
    assert.equal(singularize('boxes'), 'box')
    assert.equal(singularize('reavers'), 'reaver')
    // Words that only look plural are left alone.
    assert.equal(singularize('moss'), 'moss')
    assert.equal(singularize('Parth'), 'Parth')
  })

  it('is empty for punctuation and whitespace', () => {
    assert.equal(normalizeTerm('   '), '')
    assert.equal(normalizeTerm('---'), '')
  })
})

describe('matching a term against the store', () => {
  const items = [item('Thorinflies'), item('Parth'), item('Casterway', ['The Casterfolk'])]

  it('recognises a plural as the article that already exists', () => {
    const [match] = matchTerm('thorinfly', items)
    assert.equal(match.item.name, 'Thorinflies')
    assert.equal(match.via, 'name')
    assert.equal(match.exact, false)
  })

  it('recognises an exact hit as exact', () => {
    assert.equal(matchTerm('Parth', items)[0].exact, true)
  })

  it('matches an alias, so a renamed thing is not stubbed twice', () => {
    const [match] = matchTerm('the casterfolk', items)
    assert.equal(match.item.name, 'Casterway')
    assert.equal(match.via, 'alias')
  })

  it('reports a genuinely new term as new', () => {
    assert.deepEqual(matchTerm('Boundless Plain', items), [])
    assert.equal(termExists('Boundless Plain', items), false)
    assert.equal(termExists('Thorinfly', items), true)
  })
})
