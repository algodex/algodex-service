// eslint-disable-next-line no-unused-vars
const algosdk = require('algosdk');
const SwaggerClient = require('swagger-client');

let client;

/**
 * Get the Algorand API
 * @return {Promise<*>}
 */
async function _getAPI() {
  if (typeof client === 'undefined') {
    client = await new SwaggerClient({
      spec: require('./explorer.json'),
      authorizations: {
        api_key: process.env.ALGORAND_TOKEN,
      },
    });
    // eslint-disable-next-line max-len
    const hostname = process.env.ALGORAND_ALGOD_SERVER.replace(/(https:\/\/|http:\/\/)/, '');
    const portPath = typeof process.env.ALGORAND_ALGOD_PORT !== 'undefined' ?
      `:${process.env.ALGORAND_ALGOD_PORT}` :
      '';
    console.log(`${hostname}${portPath}`);
    client.spec = {
      ...client.spec,
      'schemes': [
        'http',
      ],
      'host': `${hostname}${portPath}`,
      'securityDefinitions': {
        'api_key': {
          'type': 'apiKey',
          'name': 'X-Algo-API-Token',
          'in': 'header',
        },
      },
      'security': [
        {
          'api_key': [],
        },
      ],
    };
  }
  return client.apis;
}

/**
 *
 * @param {algosdk.Indexer} indexer Algorand Indexer
 * @param {number} id Block ID
 * @return {Promise<*>}
 */
async function _getGenesisBlock(indexer, id) {
  const res = await indexer.lookupApplications( id).do();
  return res.application['created-at-round'];
}

/**
 * @param {algosdk.Indexer} indexer Algorand Indexer
 * @return {Promise<*>}
 */
async function _getHealthCheck(indexer) {
  return await indexer.makeHealthCheck().do();
}

/**
 * @param {algosdk.Indexer} indexer Algorand Indexer
 * @return {Promise<*>}
 */
async function _getCurrentBlock(indexer) {
  const health = await _getHealthCheck(indexer);
  const {round} = health;
  return round;
}

/**
 *
 * @param {{round: number}} roundObj
 * @return {Promise<*>}
 */
async function getBlock({round}) {
  const api = await _getAPI();
  const {obj} = await api.block.GetBlock({round}); // eslint-disable-line
  const {block} = obj;
  return block;
}


/**
 *
 * @param {{round: number}} roundObj
 * @return {Promise<*>}
 */
async function waitForBlock({round}) {
  const api = await _getAPI();
  // eslint-disable-next-line
  const {obj} = await api.block.WaitForBlock({round}); // eslint-disable-line
  return obj;
}

/**
 * @param {algosdk.Indexer} indexer Algorand Indexer
 * @param {Array<{id: number, genesis: number}>} apps
 * @return {Promise<number>}
 */
async function _getAppsBlockStart(indexer, apps) {
  for (const app of apps) {
    app.genesis = await _getGenesisBlock(indexer, app.id);
    console.log(`printing genesis ${app.genesis} ${app.id}`);
  }
  return Math.min(...apps.map(app=>app.genesis));
}

/**
 * @param {algosdk.Indexer} indexer Algorand Indexer
 * @param {Array<{id: number, genesis: number}>} apps
 * @return {Promise<{current: *, start: number}>}
 */
async function getAppsBlockRange(indexer, apps) {
  return {
    start: await _getAppsBlockStart(indexer, apps),
    current: await _getCurrentBlock(indexer),
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
