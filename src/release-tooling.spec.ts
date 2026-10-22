import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { expect, test } from 'vitest'

// behavioral tests for commitlint and the release-it changelog; an upgrade of either can leave the
// two resolving different conventional-changelog-conventionalcommits majors, and the release body
// comes out empty or the release fails with `headerPartial is not a function`
type NpmLsDep = { version: string; dependencies?: Record<string, NpmLsDep> }

const root = resolve('.')
const bin = (name: string) => join(root, 'node_modules', '.bin', name)

function commitlint(message: string) {
  return spawnSync(bin('commitlint'), { cwd: root, input: message, encoding: 'utf8' })
}

test('commitlint accepts a conventional commit message', () => {
  const result = commitlint('feat: add a thing')
  expect(result.status, result.stdout + result.stderr).toBe(0)
})

test('commitlint rejects a message without a type', () => {
  const result = commitlint('bad message')
  expect(result.status).not.toBe(0)
  expect(result.stdout).toContain('type may not be empty')
})

// commitlint's config-conventional and the release-it plugin each depend on the preset; package.json
// overrides pins it, and has to move with any @release-it/conventional-changelog major
test('conventional-changelog-conventionalcommits resolves to one version', () => {
  const tree = JSON.parse(
    execFileSync('npm', ['ls', 'conventional-changelog-conventionalcommits', '--all', '--json'], {
      cwd: root,
      encoding: 'utf8',
    }),
  )
  const versions = new Set<string>()
  const walk = (deps: Record<string, NpmLsDep> = {}) => {
    for (const [name, dep] of Object.entries(deps)) {
      if (name === 'conventional-changelog-conventionalcommits') versions.add(dep.version)
      walk(dep.dependencies)
    }
  }
  walk(tree.dependencies)
  expect([...versions]).toHaveLength(1)
})

test('release-it renders feat and fix commits into the changelog', { timeout: 30_000 }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'site-svelte-changelog-'))
  try {
    const remote = join(dir, 'remote.git')
    const repo = join(dir, 'repo')
    // ignore hooks and other global git config, since this runs inside the developer's environment
    const git = (cwd: string, ...args: string[]) =>
      execFileSync('git', ['-c', 'core.hooksPath=/dev/null', ...args], {
        cwd,
        env: { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' },
        encoding: 'utf8',
      })
    const commit = (message: string) =>
      git(
        repo,
        '-c',
        'user.name=test',
        '-c',
        'user.email=test@example.com',
        'commit',
        '-q',
        '--allow-empty',
        '-m',
        message,
      )

    git(dir, 'init', '-q', '--bare', remote)
    git(dir, 'init', '-q', '-b', 'main', repo)

    // the repo's own config, minus the test hook, the logging and the github release, which needs a token
    const config = JSON.parse(readFileSync(join(root, '.release-it.json'), 'utf8'))
    delete config.hooks
    delete config.verbose
    config.github.release = false
    writeFileSync(join(repo, '.release-it.json'), JSON.stringify(config))
    writeFileSync(join(repo, 'package.json'), '{"name":"fixture","version":"1.0.0","private":true}')
    writeFileSync(join(repo, '.gitignore'), 'node_modules\n')
    symlinkSync(join(root, 'node_modules'), join(repo, 'node_modules'))

    git(repo, 'add', '.')
    commit('chore: init')
    git(repo, 'tag', '1.0.0')
    commit('feat: add a thing')
    commit('fix: repair a thing')
    git(repo, 'remote', 'add', 'origin', `file://${remote}`)
    git(repo, 'push', '-q', '-u', 'origin', 'main', '--tags')

    const out = execFileSync(bin('release-it'), ['--changelog'], { cwd: repo, encoding: 'utf8' })
    expect(out).toMatch(/### Features\n\n\* add a thing/)
    expect(out).toMatch(/### Bug Fixes\n\n\* repair a thing/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
