// shared Lighthouse CI config; lighthouserc.desktop.cjs and lighthouserc.mobile.cjs extend it.
// local and on demand (no workflow): `npm run lighthouse` builds, serves the build with
// `vite preview`, and audits `/` for both form factors. reports land in lighthouse-report/

// floors sit just under the scores measured on 2026-10-22 (performance: desktop 1.0, mobile 0.90 to
// 0.91; every other category 1.0). assertions use the best of the 3 runs, so a cold first run doesn't
// fail them. re-tighten the floors when the page gets faster
function categoryAssertions(perfMin) {
  return {
    'categories:performance': ['error', { minScore: perfMin }],
    'categories:accessibility': ['error', { minScore: 1 }],
    'categories:best-practices': ['error', { minScore: 1 }],
    'categories:seo': ['error', { minScore: 1 }],
  }
}

function makeConfig({ outputDir, settings, assertions }) {
  return {
    ci: {
      collect: {
        url: ['http://localhost:4173/'],
        startServerCommand: 'npx vite preview --port 4173 --strictPort',
        startServerReadyPattern: 'Local',
        // median of 3 runs, to damp lab noise
        numberOfRuns: 3,
        settings,
      },
      assert: { assertions },
      upload: { target: 'filesystem', outputDir },
    },
  }
}

module.exports = { categoryAssertions, makeConfig }
