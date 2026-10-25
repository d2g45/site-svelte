# Contributing

## Commits

- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/). commitlint (`commitlint.config.mjs`) checks them in husky's `commit-msg` hook. `feat`, `fix` and `perf` commits go into the release notes.
- Put `#` names that aren't issue or PR numbers in backticks, like `` `#lib/*` ``. The changelog reads a bare `#lib` anywhere in a commit message as an issue reference and adds "references #lib" to the release notes. The squash message includes every commit message in the PR, so this goes for each commit as well as the PR title.
- `pre-commit` runs `npm run lint` and `pre-push` runs `npm run check`, which adds about 4 seconds to each commit and 4.5 to each push. `npm install` sets the hooks up through the `prepare` script.
- CI (`.github/workflows/pr-validation.yml`) runs lint, check and the full test suite on every PR and every push to `main`.
- PRs are squash-merged, so split a PR into commits for review and don't worry about tidying them afterwards.
- `npm run knip` lists unused files, exports and dependencies. `npm run lighthouse` builds the site and audits `/` on desktop and mobile; the score floors are in `lighthouserc.*.cjs`. Neither runs in CI.

## Releasing

Release from an up-to-date `main`. release-it needs a GitHub token in `GITHUB_TOKEN` to create the GitHub release:

```sh
GITHUB_TOKEN="$(gh auth token)" npm run release
```

It runs `npm test`, picks the version from the commits since the last tag, bumps `package.json` and the lockfile, commits `chore(release): <version>`, tags it, pushes, and creates the GitHub release. To choose the version yourself, pass it: `npm run release -- 1.2.0`. To try it from a branch without changing anything, run `npx release-it --dry-run --ci --no-git.requireBranch --no-git.requireCleanWorkingDir`.

## Dependency updates

Dependencies are updated in one PR per run, on a `chore/YYYY-MM-package-updates` branch: patch and minor versions in one commit, each major in its own commit, then `npm audit fix`. CI runs lint, check and test, and the hooks run lint and check. Everything else below is run by hand.

### Read first

- `.npmrc` sets `min-release-age=7`. That is intentional: npm won't install a version, direct or transitive, until it is 7 days old. `npm ci` from a complete lockfile ignores it.
- Only npm 11 honors `min-release-age`. npm 10 (Node 22) ignores it without a warning, and `npm config get min-release-age` still prints 7. Run npm under the Node 24 in `.nvmrc` and check `npm -v` first.
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
- **Known audit finding: `basic-ftp` <=6.2.0** (GHSA-c475-qrg2-pj4r), shown as six entries. It comes from `release-it` through `proxy-agent`, `pac-proxy-agent` and `get-uri`, and every `get-uri` requires `basic-ftp@^5.3.1`, while the fix is 6.2.1. It is only reachable when release-it fetches a proxy PAC file over `ftp://`. It stays until `get-uri` allows the fixed version.
- **Pinned together: the changelog preset.** `overrides` pins `conventional-changelog-conventionalcommits`. Bump it in the same commit as any `@release-it/conventional-changelog` major: v12 needs `^10`, v11 needs `^9`. commitlint's `config-conventional` also depends on the preset, and the changelog engine loads it by bare name, so two copies or a stale override leave the GitHub release body empty or fail with `headerPartial is not a function`. See [After bumping X](#after-bumping-x).

### Gates per stage

```sh
npm run lint    # prettier --check . and eslint . (both run; either failing fails)
npm run check   # svelte-kit sync && svelte-check
npm test        # vitest run (client and server projects), then playwright test
```

- Prettier reads `.gitignore` but not your global git ignore file, so `.prettierignore` lists `.claude/settings.local.json`. Add any other locally ignored file there if lint trips on it.
- `check` should report 0 errors and 0 warnings.
- The Vitest `client` project runs in Chromium through Playwright, and `test:e2e` runs `npm run build && npm run preview` on port 4173. Install browsers once per Playwright version with `npx playwright install chromium`, after checking `~/Library/Caches/ms-playwright`.
- No services are needed.

### HEAD worktree setup

```sh
git worktree add ../site-svelte-head main
cd ../site-svelte-head && npm ci && npm run check && npm test
```

`.env` holds only `PUBLIC_UMAMI_ID`, which is optional: `src/env.ts` defaults it to an empty string. When comparing builds, build both trees the same way, either both without `.env` or both with the same one, or `_app/env.js` differs.

### Clean-tree CI replay

CI runs on a fresh checkout with no `.env`. To replay that locally before pushing, run the gates and the build in a fresh worktree of the branch:

```sh
git worktree add --detach ../site-svelte-ci HEAD
cd ../site-svelte-ci && npm ci && npm run lint && npm run check && npm run build && npm test
```

The build warns that some chunks are over 500 kB. That is the three.js chunk, and main shows the same warning.

### After bumping X

- **Build-path packages** (`@sveltejs/kit`, `vite`, `@sveltejs/vite-plugin-svelte`, `svelte`, `tailwindcss`, `three`, `@threlte/*`): build main and the branch and compare the output with content hashes masked. Explain every file that differs.
  - To compare the two builds in a browser, run `npm run build && npm run preview -- --port 4174` in the [HEAD worktree](#head-worktree-setup) and `npm run build && npm run preview` on the branch, then open both. `npm run preview` only serves the last build of the tree it runs in, from `.svelte-kit/output`, and ignores `--outDir`, so it can't serve a copied `build/` folder.
- **SvelteKit migrations:** `npx sv@<version> migrate <name>` runs `prettier --write` over the whole repo. Review the full diff, not only the files the migration targets.
- **Vitest and other dev servers:** check GitHub advisories before taking a recent major. Vitest 5.0.0 to 5.0.4 served `.env` from the Browser Mode server (GHSA-p458-7748-mcp3), and this repo's `test.projects` setup exposed it. Outside a terminal, `vitest` runs once and exits, so use `vitest watch` for anything that needs the server to stay up.
- **Prettier plugins:** `.prettierrc` loads `prettier-plugin-svelte`, `@ianvs/prettier-plugin-sort-imports` and `prettier-plugin-tailwindcss`, in that order. The Tailwind plugin has to stay last. It wraps the other plugins' printers, so a plugin listed after it takes over the ts printer: classes in `cn()` go unsorted in `<script>` blocks and `.ts` files while markup still sorts, and `prettier --check` stays green. After a bump to any of them, run `npx vitest run src/prettier-plugins.spec.ts`, which covers both the class and the import sorting, then `npm run format` and check that the diff only reorders imports or classes.
- **commitlint and release-it:** run `npx vitest run src/release-tooling.spec.ts`. It checks that a valid message passes and a bad one fails, that the changelog preset resolves to one version, and runs the real `release-it --changelog` in a temp repo. To dry-run a release, see [Releasing](#releasing).
- **Playwright:** a new version needs its own browser build. Installing it can remove an older one, so finish any comparison against main that runs a browser before bumping Playwright.

### Per-commit steps

The [hooks](#commits) run lint on every commit and check on every push. If a hook fails, fix the cause; don't skip it with `--no-verify`.

### Manual checks

- Load the home page with `npm run preview` and confirm the 3D scene renders and the model loads. Specs can't check WebGL output.
- With a real `.env`, run `npm run build && npm run preview` and confirm the page requests `https://cloud.umami.is/script.js`. The layout adds the tag in the browser, outside dev only, so it isn't in the built `index.html`.
- On a phone, confirm the scene tilts with the device, on the production build. `npm run dev` pre-bundles dependencies differently from `vite build`, so a dev check doesn't cover the built bundle. Chrome sends orientation events only to secure pages, so `http://<LAN address>` never tilts. Either forward the port (`adb reverse tcp:4173 tcp:4173`, or Port forwarding in `chrome://inspect`) and open `localhost:4173`, or serve with `npm run preview -- --host` and add the address to `chrome://flags/#unsafely-treat-insecure-origin-as-secure` on the phone, then turn the flag off afterwards. iPhones don't tilt (see [The 3D scene](README.md#the-3d-scene)), so skip the check there.

### Installs

- `npm ci` on a cold cache can take minutes. To see progress, run long installs with `--loglevel=http` and a log file instead of piping through `tail`.
- If the registry stalls, retry with `--fetch-timeout=30000 --fetch-retries=5`. npm's defaults are a 300-second timeout with 2 retries.
- Make each change with one resolve: edit `package.json` once, then run one `npm install`. To move a package between `dependencies` and `devDependencies`, use `npm pkg delete dependencies.<name>` and `npm pkg set devDependencies.<name>=<range>`, then `npm install --package-lock-only`.

### Setup

The release-age gate is in `.npmrc`. Dependabot (`.github/dependabot.yml`) only updates GitHub Actions, monthly and grouped, with a 7-day `cooldown` to match. npm dependencies are updated by hand as described here.
