export default {
  exclude:[
    '**/.pnpm/**',
    '**/__tests__/**',
    '**/docs/**',
    '**/coverage/**',
    '**/commands/**'
  ],
  alias: {
    'pouchdb': 'pouchdb-browser',
    'os': '@algodex/common/polyfills/os.js',
    'ioredis': '@algodex/common/polyfills/redis.js',
  },
  plugins: [
    '@snowpack/plugin-dotenv',
  ],
  packageOptions: {
    polyfillNode: true,
    knownEntrypoints: ['uuid'],
  },
};
