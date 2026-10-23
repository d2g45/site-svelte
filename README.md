# Daniel De Guzman's site

The source for [danieldeguzman.com](https://danieldeguzman.com): one page with links to email, GitHub and LinkedIn, over a wireframe 3D model that follows the pointer. Built with SvelteKit, Tailwind v4 and [Threlte](https://threlte.xyz) (three.js for Svelte).

## Developing

Use the Node version in `.nvmrc` and check that `npm -v` prints 11.x. npm 10 ignores the release-age gate in `.npmrc` without a warning.

```sh
nvm use
npm install
npm run dev
```

`.env` is optional. It holds only `PUBLIC_UMAMI_ID`, and without it the site builds and runs with analytics off.

| Command           | Does                                                 |
| ----------------- | ---------------------------------------------------- |
| `npm run dev`     | Dev server                                           |
| `npm run build`   | Static build in `build/`                             |
| `npm run preview` | Serves the last build on port 4173                   |
| `npm run lint`    | Prettier check and ESLint                            |
| `npm run check`   | svelte-check                                         |
| `npm test`        | Vitest (Node and Chromium projects), then Playwright |
| `npm run knip`    | Unused files, exports and dependencies               |

[CONTRIBUTING.md](CONTRIBUTING.md) covers commits, the git hooks, CI and dependency updates. [AGENTS.md](AGENTS.md) has the same essentials for coding agents.

## How it's built

- SvelteKit with `adapter-static` and `fallback: 'index.html'`. `src/routes/+layout.ts` turns off SSR and prerendering, so the page renders in the browser. The Svelte config is inline in `vite.config.ts`.
- `src/routes/+page.svelte` is the only page. It holds the links, the meta tags and the JSON-LD.
- Icons come from [unplugin-icons](https://github.com/unplugin/unplugin-icons) and are compiled into the page as inline SVGs. Each one is imported from `~icons/<set>/<name>`, and the icon sets are `@iconify-json/*` devDependencies.
- `src/routes/+layout.svelte` adds the Umami script in production builds when `PUBLIC_UMAMI_ID` is set.

## The 3D scene

`+page.svelte` loads the scene with a dynamic `import('#lib/components/3d/home-scene.svelte')`. three.js ends up in its own chunk (the one the build warns is over 500 kB), and the links render without waiting for it. `#lib/*` is an import map entry in `package.json` that points at `src/lib/*`.

The components are in `src/lib/components/3d/`:

- **`home-scene.svelte`** sets up the Threlte `<Canvas>` and puts `daniel` and `rig` inside it. The scene uses Threlte's default camera, a perspective camera at `z = 5`, and has no lights, because the normal material doesn't use them.
- **`daniel.svelte`** loads the model with three's `GLTFLoader` through Threlte's `useLoader`, and draws the `Daniel_Whole` mesh as a wireframe with a normal material, scaled to 0.1 and rotated 90° on the x axis. Nothing renders until the model has loaded.
- **`rig.svelte`** moves the camera. A window `pointermove` listener maps the pointer to a point in front of the model, and on phones (`svelte-device-info`) `deviceorientation` does the same from the tilt angles. Each frame the camera eases 5% of the way toward that point and looks back at the origin. iPhones don't tilt, because the page never calls `DeviceOrientationEvent.requestPermission()`. That's accepted.

The model files are in `static/three/`: `daniel-whole.min.gltf` and the `daniel-whole.bin` buffer it references.

The scene draws into WebGL, so the tests can't check its output. Check it in a browser after changes, as described under Manual checks in CONTRIBUTING.
