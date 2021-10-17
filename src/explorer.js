const SwaggerClient = require('swagger-client');

let client; let indexer;
const ALGODEX_EXPLORER = process.env['ALGODEX_EXPLORER'] || 'https://testnet.algoexplorerapi.io';

/**
 *
 * @return {Promise<*>}
 */
async function getAPI() {
  if (typeof client === 'undefined') {
    client = await new SwaggerClient(`${ALGODEX_EXPLORER}/v2/swagger.json`);
    client.spec.host='testnet.algoexplorerapi.io';
  }
  return client.apis;
}

/**
 *
 * @return {Promise<*>}
 */
async function getIndexAPI() {
  if (typeof indexer === 'undefined') {
    indexer = await new SwaggerClient(`${ALGODEX_EXPLORER}/idx2/swagger.json`);
    indexer.spec.host='testnet.algoexplorerapi.io';
  }
  return indexer.apis;
}

/**
 *
 * @param {number} id Block ID
 * @return {Promise<*>}
 */
async function getGenesisBlock(id) {
  const api = await getIndexAPI();
  const {obj} = await api.lookup.lookupApplicationsByID({'application-id': id});
  return obj.application['created-at-round'];
}

/**
 *
 * @return {Promise<*>}
 */
async function getHealthCheck() {
  const api = await getIndexAPI();
  const {obj} = await api.common.makeHealthCheck();
  return obj;
}

/**
 *
 * @return {Promise<*>}
 */
async function getCurrentBlock() {
  const health = await getHealthCheck();
  const {round} = health;
  return round;
}

/**
 *
 * @param {number }round
 * @return {Promise<*>}
 */
async function getBlock({round}) {
  const api = await getAPI();
  const {obj} = await api.block.GetBlock({round}); // eslint-disable-line
  const {block} = obj;
  return block;
}

/**
 *
 * @param {number} round
 * @return {Promise<*>}
 */
async function waitForBlock({round}) {
  const api = await getAPI();
  // eslint-disable-next-line
  const {obj} = await api.block.WaitForBlock({round}); // eslint-disable-line
  return obj;
}

/**
 *
 * @param {Array<{id: number, genesis: number}>} apps
 * @return {Promise<number>}
 */
async function getAppsBlockStart(apps) {
  for (const app of apps) {
    app.genesis = await getGenesisBlock(app.id);
  }

  return Math.min(...apps.map((app)=>app.genesis));
}

/**
 *
 * @param {Array<{id: number, genesis: number}>} apps
 * @return {Promise<{current: *, start: number}>}
 */
async function getAppsBlockRange(apps) {
  return {
    start: await getAppsBlockStart(apps),
    current: await getCurrentBlock(),
  };
}

module.exports = {
  getAppsBlockRange,
  getBlock,
  waitForBlock,
};
