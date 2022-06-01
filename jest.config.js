module.exports = {
  'coverageThreshold': {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  'collectCoverageFrom': [
    '**/*.{js,jsx}',
    '!.*.js',
    '!**config.js',
    '!**/docs/**',
    '!**/coverage/**',
    '!**/node_modules/**',
    '!**/vendor/**',
  ],
};
