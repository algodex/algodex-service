// Snowpack Configuration File
// See all supported options: https://www.snowpack.dev/reference/configuration
import dotenv from 'dotenv';
dotenv.config();
/** @type {import("snowpack").SnowpackUserConfig } */
export default {
  exclude: [
    '**/bin/**/*',
    '**/views/**/*',
    '**/services/**/*',
  ],
  alias: {
    pouchdb: 'pouchdb-browser',
    '@exports': './src/',
  },
  mount: {
    /* ... */
  },
  plugins: [
    /* ... */
  ],
  packageOptions: {
    polyfillNode: true,
  },
  devOptions: {
    /* ... */
  },
  buildOptions: {
    /* ... */
  }
};
