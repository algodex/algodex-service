const algosdk = require('algosdk');
const pactsdk = require('@pactfi/pactsdk');

// Algod SDK
const algod = new algosdk.Algodv2(
    '11e4dcfb445a8c7e8380848747f18afcd5d84ccb395e003e5b72127ca5e9a259',
    'http://ec2-18-216-194-132.us-east-2.compute.amazonaws.com',
    '8080',
);
// PactFi SDK
const pact = new pactsdk.PactClient(algod, {pactApiUrl: 'https://api.testnet.pact.fi'});


const {PerformanceObserver, performance} = require('node:perf_hooks');


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
 * Adds PactFi Prices to the database
 *
 * @param {PouchDB} db PouchDB Instance
 * @param {number} timestamp Unix Timestamp
 * @return {Promise<void>}
 */
module.exports = async (db, timestamp) => {
  if (isDevelopment) {
    performance.mark('Start');
  }
  const pools = await pact.listPools({limit: 1000});
  if (pools.results.length !== pools.count) {
    // Note: It doesn't seem like the next parameter is in use currently,
    // Bail just in case it becomes paginated
    throw new Error('Must implement pagination and next parameter');
  }

  // console.log(pools.results.map((pool)=>pool.pool_asset.price));
  await db.bulkDocs(pools.results.map((pool)=>{
    return {
      ...pool,
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
