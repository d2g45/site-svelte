import { format, resolveConfig } from 'prettier'
import { expect, test } from 'vitest'

// golden tests for the prettier plugins; `prettier --check` can't catch a broken plugin, since the
// unsorted file becomes its own correct output
const unsorted = 'p-4 flex text-sm bg-red-500 items-center mt-2'
const sorted = 'mt-2 flex items-center bg-red-500 p-4 text-sm'

async function formatAs(filepath: string, source: string) {
  const config = await resolveConfig(filepath)
  return format(source, { ...config, filepath })
}

test('tailwind classes are sorted in .svelte markup', async () => {
  const out = await formatAs('src/x.svelte', `<div class="${unsorted}"></div>`)
  expect(out).toContain(`class="${sorted}"`)
})

// the tailwind plugin has to stay last in .prettierrc's plugins; a plugin after it takes over the
// ts printer, and cn() goes unsorted while markup still sorts
test('tailwind classes are sorted in cn() inside a script block', async () => {
  const out = await formatAs(
    'src/x.svelte',
    `<script lang="ts">\n  const c = cn('${unsorted}')\n</script>`,
  )
  expect(out).toContain(`cn('${sorted}')`)
})

test('tailwind classes are sorted in cn() inside a .ts module', async () => {
  const out = await formatAs('src/x.ts', `export const c = cn('${unsorted}')`)
  expect(out).toContain(`cn('${sorted}')`)
})

test('imports are sorted by importOrder in a .ts module', async () => {
  const out = await formatAs(
    'src/x.ts',
    "import b from './b'\nimport { x } from 'three'\nimport { onMount } from 'svelte'\nexport { b, x, onMount }",
  )
  expect(out).toMatch(
    /^import \{ onMount \} from 'svelte'\nimport \{ x \} from 'three'\nimport b from '\.\/b'\n/,
  )
})

test('imports are sorted by importOrder inside a script block', async () => {
  const out = await formatAs(
    'src/x.svelte',
    `<script lang="ts">\n  import b from './b'\n  import { onMount } from 'svelte'\n  b(onMount)\n</script>`,
  )
  expect(out).toContain("import { onMount } from 'svelte'\n  import b from './b'")
})
