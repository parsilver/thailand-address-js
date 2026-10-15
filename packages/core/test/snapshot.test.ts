import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { SNAPSHOT } from '../src'

describe('the pinned snapshot', () => {
  it('is the one schema.json and the fixtures come from', () => {
    const schema = JSON.parse(readFileSync(join(import.meta.dirname, '../schema/schema.json'), 'utf8'))
    expect(schema.$id).toBe(`https://data.farzai.com/thailand-address/v1/${SNAPSHOT}/schema.json`)
    const fixture = JSON.parse(readFileSync(join(import.meta.dirname, 'fixtures/snapshot/provinces.json'), 'utf8'))
    expect(fixture.snapshot).toBe(SNAPSHOT)
  })
})
