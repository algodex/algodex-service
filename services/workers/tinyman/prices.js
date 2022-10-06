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

const {PerformanceObserver, performance} = require('node:perf_hooks');
const fetchLink = require('cross-fetch');

// eslint-disable-next-line no-unused-vars
const ALGX = require('../../../src/algx-types');

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
 *
 * @param {ALGX.PouchDB} db Database instance to save to
 * @param {number} timestamp Timestamp for record keeping
 */
module.exports = function(db, timestamp) {
  if (isDevelopment) {
    performance.mark('Start');
  }

  const url = process.env.ALGORAND_NETWORK === 'testnet' ?
    'https://testnet.analytics.tinyman.org/api/v1/current-asset-prices/' :
    'https://mainnet.analytics.tinyman.org/api/v1/current-asset-prices/';
  // eslint-disable-next-line no-undef // FIXME: does this call work? Maybe refactor?
  fetch(url).then(async res=> {
    const prices = await res.json();
    await db.bulkDocs(Object.keys(prices).map(key => {
      const created =Date.now();
      // TODO: Better timestamps
      return {
        ...prices[key],
        'service': 'tinyman',
        'asset': {id: parseInt(key)},
        'type': 'price',
        'timestamp': timestamp,
        'metadata': {
          'created': created,
          'latency': created - timestamp,
        },

      };
    }));
    console.log(prices);
    if (isDevelopment) {
      performance.mark('Finish');
      performance.measure('Start to Finish', 'Start', 'Finish');
    }
  });
};
