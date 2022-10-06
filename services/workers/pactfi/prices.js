/* 
 * Algodex Service 
 * Copyright (C) 2022 Algodex VASP (BVI) Corp.
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

const algosdk = require('algosdk');
const pactsdk = require('@pactfi/pactsdk');
// eslint-disable-next-line no-unused-vars
const ALGX = require('../../../src/algx-types');

// Algod SDK
const algod = new algosdk.Algodv2(
    process.env.ALGORAND_TOKEN,
    process.env.ALGORAND_ALGOD_SERVER,
    process.env.ALGORAND_ALGOD_PORT,
);

const options = process.env.ALGORAND_NETWORK === 'testnet' ?
  {pactApiUrl: 'https://api.testnet.pact.fi'} :
  undefined;

// PactFi SDK
const pact = new pactsdk.PactClient(algod, options);


const {PerformanceObserver, performance} = require('node:perf_hooks');


const isDevelopment = process.env.NODE_ENV === 'development';
// Watch for Performance
if (isDevelopment) {
  const obs = new PerformanceObserver(items => {
    console.log(items.getEntries()[0].duration);
    performance.clearMarks();
  });
  obs.observe({type: 'measure'});
}


/**
 * Adds PactFi Prices to the database
 *
 * @param {ALGX.PouchDB} db PouchDB Instance
 * @param {number} timestamp Unix Timestamp
 * @return {Promise<void>}
 */
module.exports = async (db, timestamp) => {
  if (isDevelopment) {
    performance.mark('Start');
  }
  // FIXME: does this work? Need to test. Remove ts-ignore if so
  // @ts-ignore
  const pools = await pact.listPools({limit: 1000});
  if (pools.results.length !== pools.count) {
    // Note: It doesn't seem like the next parameter is in use currently,
    // Bail just in case it becomes paginated
    throw new Error('Must implement pagination and next parameter');
  }

  // console.log(pools.results.map((pool)=>pool.pool_asset.price));
  await db.bulkDocs(pools.results.map(pool=>{
    return {
      ...pool,
      // @ts-ignore  FIXME - does this work below?  Remove ts-ignore if so
      'price': pool.pool_asset.price,
      'service': 'pactfi',
      'asset': {id: parseInt(pool.secondary_asset.algoid)},
      'type': 'price',
      'timestamp': timestamp,
    };
  }));

  if (isDevelopment) {
    performance.mark('Finish');
    performance.measure('Start to Finish', 'Start', 'Finish');
  }
};
