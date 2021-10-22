import { URL, pathToFileURL } from 'url'; // in Browser, the URL in native accessible on window

// const __filename = new URL('', import.meta.url).pathname;
// Will contain trailing slash
const __dirname = new URL('.', `${import.meta.url}`).pathname;

  // GHCR_TARGET: process.env.GHCR_TARGET,
  // ALGORAND_DATA: process.env.ALGORAND_DATA,
  // ALGORAND_EXPLORER: process.env.ALGORAND_EXPLORER,
  // REDIS_ADDRESS: process.env.REDIS_ADDRESS,
  // REDIS_PORT: process.env.REDIS_PORT,
  // REDIS_MQ_ADDRESS: process.env.REDIS_MQ_ADDRESS,
  // REDIS_MQ_PORT: process.env.REDIS_MQ_PORT,
export const VIEWS_ROOT = new URL(pathToFileURL(`./views`));
export const  PROJECT_ROOT = __dirname;

