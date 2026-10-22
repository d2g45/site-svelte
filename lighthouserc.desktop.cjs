const { categoryAssertions, makeConfig } = require('./lighthouserc.base.cjs')

// the desktop preset: desktop viewport and a light throttling profile
module.exports = makeConfig({
  outputDir: './lighthouse-report/desktop',
  settings: { preset: 'desktop' },
  assertions: categoryAssertions(0.95),
})
