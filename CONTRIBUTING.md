# Contributing

## Dependency updates

Dependencies are updated in one PR per run, on a `chore/YYYY-MM-package-updates` branch: patch and minor versions in one commit, each major in its own commit, then `npm audit fix`. Nothing runs these checks automatically. The repo has no CI workflow and no git hooks, so every gate below is run by hand.

### Read first

- `.npmrc` sets `min-release-age=7`. That is intentional: npm won't install a version, direct or transitive, until it is 7 days old. `npm ci` from a complete lockfile ignores it.
- Every manifest entry is a caret range. There are no exact pins.
- The holds and package sets under [ncu flags](#ncu-flags).

### ncu flags

Use a global `ncu` (`npm i -g npm-check-updates`) or `npx npm-check-updates`. Never `npx ncu`: that resolves a different package named `ncu`. Pin any other CLI run through npx to a version, such as `npx sv@1.1.1`.

List what's outdated with:

```sh
ncu --peer --format group --reject typescript
```

- **Hold: TypeScript 7.** typescript-eslint 8 declares `typescript >=4.8.4 <6.1.0`. Leave `--reject typescript` in until its range includes 7. TypeScript 6 patches still come through the patch and minor pass.
- **Exact-peer set: Vitest.** `vitest` and `@vitest/browser-playwright` (through `@vitest/browser`) require each other's exact version. A plain install of one fails with ERESOLVE, and `npm audit fix` can't move them. Uninstall and reinstall the set in one command, along with `vitest-browser-svelte` on a Vitest major:

  ```sh
  npm uninstall vitest @vitest/browser-playwright vitest-browser-svelte
  npm install -D 'vitest@^5.0.5' '@vitest/browser-playwright@^5.0.5' 'vitest-browser-svelte@^3.1.0'
  ```

- **Follows by hand: `tailwindcss`.** `@tailwindcss/vite` depends on an exact `tailwindcss` version as a regular dependency, so `--peer` never flags a mismatch. Keep the root `tailwindcss` at the same version as `@tailwindcss/vite`.
- **Known audit finding: `postcss-selector-parser` 6.0.10** (GHSA-rj75-hqrm-r3gf). `@tailwindcss/typography` 0.5.20 pins it exactly. It is only used at build time, and the fix npm offers is a downgrade to typography 0.5.4. It stays until typography releases with a newer version.

### Gates per stage

```sh
npm run lint    # prettier --check . && eslint .
npm run check   # svelte-kit sync && svelte-check
npm test        # vitest run (server + browser projects), then playwright test
```

- Prettier reads `.gitignore` but not your global git ignore file. If you keep `.claude/settings.local.json` ignored globally, lint fails on it. Run `npx prettier --check . '!.claude/**' && npx eslint .` instead.
- `check` should report 0 errors. The one warning, `globalThis.onpointermove` in `src/lib/components/3d/daniel.svelte`, is known.
- The Vitest `client` project runs in Chromium through Playwright, and `test:e2e` runs `npm run build && npm run preview` on port 4173. Install browsers once per Playwright version with `npx playwright install chromium`, after checking `~/Library/Caches/ms-playwright`.
- No services are needed.

### HEAD worktree setup

```sh
git worktree add ../site-svelte-head main
cd ../site-svelte-head && npm ci && npm run check && npm test
```

`.env` holds only `PUBLIC_UMAMI_ID`, which is optional: `src/env.ts` defaults it to an empty string. When comparing builds, build both trees the same way, either both without `.env` or both with the same one, or `_app/env.js` differs.

### Clean-tree CI replay

With no CI to replay, run the gates and the build in a fresh worktree of the branch with no `.env`:

```sh
git worktree add --detach ../site-svelte-ci HEAD
cd ../site-svelte-ci && npm ci && npm run lint && npm run check && npm run build && npm test
```

The build warns that some chunks are over 500 kB. That is the three.js chunk, and main shows the same warning.

### After bumping X

- **Build-path packages** (`@sveltejs/kit`, `vite`, `@sveltejs/vite-plugin-svelte`, `svelte`, `tailwindcss`, `three`, `@threlte/*`): build main and the branch and compare the output with content hashes masked. Explain every file that differs.
  - Since three r186, the build includes about 1.9 MB of Draco and Basis decoder files that the site never requests. The model isn't Draco-compressed, and `useDraco` points at the gstatic CDN.
- **`@sveltejs/package`:** compare `dist/` from `npm run prepack` on both trees.
- **SvelteKit migrations:** `npx sv@<version> migrate <name>` runs `prettier --write` over the whole repo. Review the full diff, not only the files the migration targets.
- **Vitest and other dev servers:** check GitHub advisories before taking a recent major. Vitest 5.0.0 to 5.0.4 served `.env` from the Browser Mode server (GHSA-p458-7748-mcp3), and this repo's `test.projects` setup exposed it. Outside a terminal, `vitest` runs once and exits, so use `vitest watch` for anything that needs the server to stay up.
- **Prettier plugins:** `.prettierrc` loads `prettier-plugin-svelte`, `prettier-plugin-tailwindcss` and `@ianvs/prettier-plugin-sort-imports`, in that order. After a bump to any of them, run `npm run format` and check that the diff only reorders imports or classes.
- **Playwright:** a new version needs its own browser build. Installing it can remove an older one, so finish any comparison against main that runs a browser before bumping Playwright.

### Per-commit steps

None beyond `npm ci`. There are no hooks.

### Manual checks

- Load the home page with `npm run preview` and confirm the 3D scene renders and the model loads. Specs can't check WebGL output.
- With a real `.env`, run `npm run build && npm run preview` and confirm the page requests `https://cloud.umami.is/script.js`. The layout adds the tag in the browser, outside dev only, so it isn't in the built `index.html`.

### Installs

- `npm ci` on a cold cache can take minutes. To see progress, run long installs with `--loglevel=http` and a log file instead of piping through `tail`.
- If the registry stalls, retry with `--fetch-timeout=30000 --fetch-retries=5`. npm's defaults are a 300-second timeout with 2 retries.
- Make each change with one resolve: edit `package.json` once, then run one `npm install`. To move a package between `dependencies` and `devDependencies`, use `npm pkg delete dependencies.<name>` and `npm pkg set devDependencies.<name>=<range>`, then `npm install --package-lock-only`.

### Setup

The release-age gate is in `.npmrc`. There is no Dependabot config. If one is added, give it a matching `cooldown`.
