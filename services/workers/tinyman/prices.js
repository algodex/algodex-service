const {PerformanceObserver, performance} = require('node:perf_hooks');
const fetch = require('cross-fetch');

/**
 * @typedef {import('ioredis').default} Redis
 */

/**
 * @typedef {import('PouchDB')} PouchDB
 */

const isDevelopment = process.env.NODE_ENV === 'development';
// Watch for Performance
if (isDevelopment) {
  const obs = new PerformanceObserver((items) => {
    console.log(items.getEntries()[0].duration);
    performance.clearMarks();
  });
  obs.observe({type: 'measure'});
}

/**
 *
 * @param {PouchDB} db Database instance to save to
 * @param {number} timestamp Timestamp for record keeping
 */
module.exports = function(db, timestamp) {
  if (isDevelopment) {
    performance.mark('Start');
  }

  const url = process.env.ALGORAND_NETWORK === 'testnet' ?
    'https://testnet.analytics.tinyman.org/api/v1/current-asset-prices/' :
    'https://mainnet.analytics.tinyman.org/api/v1/current-asset-prices/';
  fetch(url).then(async (res)=> {
    const prices = await res.json();
    await db.bulkDocs(Object.keys(prices).map((key) => {
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
