import { existsSync, readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

// every package.json `imports` target has to exist; a missing one only shows up as a knip hint, and
// nothing fails until something imports it
const { imports } = JSON.parse(readFileSync('package.json', 'utf8')) as {
  imports: Record<string, string>
}

test.each(Object.entries(imports))('import map %s points at an existing path', (_, target) => {
  // for a `#x/*` entry, check the directory the wildcard expands into
  expect(existsSync(target.replace(/\*$/, ''))).toBe(true)
})
