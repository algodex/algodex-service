const SwaggerClient = require('swagger-client');
const {InvalidConfiguration} = require('./Errors');

let client; let indexer;

/**
 * Get the Algorand API URL
 * @return {string}
 */
function _getAlgorandURL() {
  if (
    typeof process.env['ALGORAND_EXPLORER'] === 'undefined'
  ) {
    throw new InvalidConfiguration('Algorand API not configured!');
  }

  return process.env['ALGORAND_EXPLORER'];
}

/**
 * Get the Algorand API
 * @return {Promise<*>}
 */
async function _getAPI() {
  const url = _getAlgorandURL();
  if (typeof client === 'undefined') {
    client = await new SwaggerClient(`${url}/v2/swagger.json`);
    client.spec.host = 'node.testnet.algoexplorerapi.io';
  }
  return client.apis;
}

/**
 * Get the Algorand Indexer API
 * @return {Promise<*>}
 */
async function _getIndexAPI() {
  const url = _getAlgorandURL();
  if (typeof indexer === 'undefined') {
    indexer = await new SwaggerClient(`${url}/idx2/swagger.json`);
    indexer.spec.host='algoindexer.testnet.algoexplorerapi.io';
    indexer.spec.basePath = '/';
  }
  return indexer.apis;
}

/**
 *
 * @param {number} id Block ID
 * @return {Promise<*>}
 */
async function _getGenesisBlock(id) {
  const api = await _getIndexAPI();
  const {obj} = await api.lookup.lookupApplicationsByID({'application-id': id});
  return obj.application['created-at-round'];
}

/**
 *
 * @return {Promise<*>}
 */
async function _getHealthCheck() {
  const api = await _getIndexAPI();
  const {obj} = await api.common.makeHealthCheck();
  return obj;
}

/**
 *
 * @return {Promise<*>}
 */
async function _getCurrentBlock() {
  const health = await _getHealthCheck();
  const {round} = health;
  return round;
}

/**
 *
 * @param {number }round
 * @return {Promise<*>}
 */
async function getBlock({round}) {
  const api = await _getIndexAPI();
  const {obj} = await api.lookup.lookupBlock({'round-number': round}); // eslint-disable-line
  const {block} = obj;
  return block;
}

/**
 *
 * @param {number} round
 * @return {Promise<*>}
 */
async function waitForBlock({round}) {
  const api = await _getAPI();
  // eslint-disable-next-line
  const {obj} = await api.block.WaitForBlock({round}); // eslint-disable-line
  return obj;
}

/**
 *
 * @param {Array<{id: number, genesis: number}>} apps
 * @return {Promise<number>}
 */
async function _getAppsBlockStart(apps) {
  for (const app of apps) {
    app.genesis = await _getGenesisBlock(app.id);
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
    start: await _getAppsBlockStart(apps),
    current: await _getCurrentBlock(),
  };
}

module.exports = {
  getAppsBlockRange,
  getBlock,
  waitForBlock,
};


// if(process.env.NODE_ENV === 'test'){
//   module.exports.test = {
//     _getAppsBlockStart,
//     _
//   }
// }
