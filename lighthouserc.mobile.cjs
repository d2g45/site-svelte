const { categoryAssertions, makeConfig } = require('./lighthouserc.base.cjs')

// Lighthouse's default profile (mobile viewport, simulated 4x CPU and slow 4G), so no preset
module.exports = makeConfig({
  outputDir: './lighthouse-report/mobile',
  settings: {},
  assertions: categoryAssertions(0.85),
})
