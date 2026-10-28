# Agent Instructions

## Setup & Commands

- **npm**, Node 24 (`.nvmrc`). `nvm use && npm install`, then `npm run dev`.
- Run npm under Node 24 and check `npm -v` is 11.x first. npm 10 ignores `.npmrc`'s `min-release-age=7` without a warning (`npm config get` still prints 7).
- `.env` holds only `PUBLIC_UMAMI_ID`, which is optional (`src/env.ts` defaults it to an empty string). Never print its value or copy the file.
- Dependency updates follow [Dependency updates in CONTRIBUTING.md](CONTRIBUTING.md#dependency-updates). Read it before running `ncu` or `npm install`.

## File-Scoped Commands

| Task      | Command                                           |
| --------- | ------------------------------------------------- |
| Lint      | `npx eslint path/to/file`                         |
| Format    | `npx prettier --write path/to/file`               |
| Unit test | `npx vitest run path/to/file.spec.ts`             |
| Typecheck | `npm run check` (svelte-check; project-wide only) |
| E2E       | `npm run test:e2e`                                |

Project-wide: `npm run lint` (prettier `--check` + eslint), `npm run format`, `npm test` (vitest, then playwright), `npm run knip`, `npm run lighthouse`.

## Commits & PRs

- Conventional Commits, enforced by commitlint in husky's `commit-msg` hook. Keep messages short.
- `pre-commit` runs `npm run lint`, `pre-push` runs `npm run check`. Fix what they report; don't skip them with `--no-verify`.
- Open PRs as drafts. PRs are squash-merged, so split commits are for review.

## Architecture

- SvelteKit with adapter-static (`fallback: 'index.html'`). The Svelte config is inline in `vite.config.ts`; there is no `svelte.config.js`.
- One page, `src/routes/+page.svelte`. It lazy-loads the Threlte/three.js scene from `src/lib/components/3d/` through the `#lib/*` import map. The model, `daniel-whole.min.gltf` and its `.bin`, is in `static/three/`.
- Env vars are declared in `src/env.ts`.

## Conventions

- TypeScript, no `any`. Tailwind v4 for styling.
- Two-space indent, single quotes, no semicolons, trailing commas (`.prettierrc`).
- Icons via `unplugin-icons`: import each one from `~icons/<set>/<name>`. Icon sets are `@iconify-json/*` devDependencies, and `autoInstall` is off.

## Tooling Notes

- Keep `prettier-plugin-tailwindcss` **last** in `.prettierrc`'s `plugins`, and run `npx vitest run src/prettier-plugins.spec.ts` after bumping any Prettier plugin. [Prettier plugins in CONTRIBUTING.md](CONTRIBUTING.md#after-bumping-x) says why.
- Bump the `conventional-changelog-conventionalcommits` entry in `overrides` in the same commit as any `@release-it/conventional-changelog` major, then run `npx vitest run src/release-tooling.spec.ts`. The versions and the reason are under [ncu flags in CONTRIBUTING.md](CONTRIBUTING.md#ncu-flags).
- Releasing follows [Releasing in CONTRIBUTING.md](CONTRIBUTING.md#releasing). Read it before running `npm run release`.
- The known audit findings (basic-ftp and undici through release-it, deepmerge through vite-plugin-svelte) are explained under [ncu flags in CONTRIBUTING.md](CONTRIBUTING.md#ncu-flags). Each stays until the upstream release named there comes out.
- Lighthouse runs through a pinned `npx --yes @lhci/cli@<version>` in `package.json`, not as a devDependency, which would add a dozen audit findings.
