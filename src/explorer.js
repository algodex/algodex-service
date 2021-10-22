import SwaggerClient from 'swagger-client';
import {InvalidConfiguration} from './errors/index.js';

// const algosdk = require('algosdk');
// const SwaggerClient = require('swagger-client');
// const InvalidConfiguration = require('./errors/InvalidConfiguration');

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
 *
 * @return {string}
 * @private
 */
function _getAlgorandDaemonURL() {
  if (
    typeof process.env.ALGORAND_DAEMON === 'undefined' ||
    typeof process.env.ALGORAND_DAEMON_PORT === 'undefined'
  ) {
    throw new InvalidConfiguration('Algorand API not configured!');
  }

  return `${process.env.ALGORAND_DAEMON}:${process.env.ALGORAND_DAEMON_PORT}`;
}

/**
 *
 * @return {object}
 * @private
 */
function _getAlgorandConfig() {
  if (
    typeof process.env.ALGORAND_DAEMON === 'undefined' ||
    typeof process.env.ALGORAND_DAEMON_TOKEN === 'undefined' ||
    typeof process.env.ALGORAND_DAEMON_PORT === 'undefined'
  ) {
    throw new InvalidConfiguration('Algorand Daemon not configured!');
  }

  const auth = {
    requestInterceptor: (req) => {
      req.headers['X-Algo-API-Token'] = process.env.ALGORAND_DAEMON_TOKEN;
      return req;
    },
  };

  return {
    auth,
    server: process.env.ALGORAND_DAEMON,
    token: process.env.ALGORAND_DAEMON_TOKEN,
    client: process.env.ALGORAND_DAEMON_PORT,
  };
}

/**
 * Get the Algorand API
 * @return {Promise<*>}
 */
async function _getAPI() {
  const url = _getAlgorandDaemonURL();
  if (typeof client === 'undefined') {
    client = await new SwaggerClient(`${_getAlgorandURL()}/v2/swagger.json`);
    client.spec.host=url.replace('http://', '');
    client.spec.schemes = ['http'];
    client.spec.securityDefinitions = {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
      },
    };
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
    indexer.spec.host=url.replace('https://', '');
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
export async function getBlock({round}) {
// async function getBlock({round}) {
  const api = await _getAPI();
  const {auth} = _getAlgorandConfig();
  const {obj} = await api.block.GetBlock({round}, auth); // eslint-disable-line
  const {block} = obj;
  return block;
}

/**
 *
 * @param {number} round
 * @return {Promise<*>}
 */
export async function waitForBlock({round}) {
// async function waitForBlock({round}) {
  const api = await _getAPI();
  const {auth} = _getAlgorandConfig();
  // eslint-disable-next-line
  const {obj} = await api.block.WaitForBlock({round}, auth); // eslint-disable-line
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
export async function getAppsBlockRange(apps) {
// async function getAppsBlockRange(apps) {
  return {
    start: await _getAppsBlockStart(apps),
    current: await _getCurrentBlock(),
  };
}

// module.exports = {
//   getAppsBlockRange,
//   getBlock,
//   waitForBlock,
// };


// if(process.env.NODE_ENV === 'test'){
//   module.exports.test = {
//     _getAppsBlockStart,
//     _
//   }
// }
