const algosdk = require('algosdk');
const pactsdk = require('@pactfi/pactsdk');
const {PerformanceObserver, performance} = require('node:perf_hooks');

// Algod SDK
const algod = new algosdk.Algodv2(
    '11e4dcfb445a8c7e8380848747f18afcd5d84ccb395e003e5b72127ca5e9a259',
    'http://ec2-18-216-194-132.us-east-2.compute.amazonaws.com',
    '8080',
);
// PactFi SDK
const pact = new pactsdk.PactClient(algod, {pactApiUrl: 'https://api.testnet.pact.fi'});

// Observe Performance
const obs = new PerformanceObserver((items) => {
  console.log(items.getEntries()[0].duration);
  performance.clearMarks();
});
obs.observe({type: 'measure'});
// performance.measure('Latency');


// TODO: Allow for switching networks
const fetchPactFiPrices = async (db) => {
  performance.mark('Start');
  const pools = await pact.listPools({limit: 1000});
  if (pools.results.length !== pools.count) {
    // Note: It doesn't seem like the next parameter is in use currently,
    // Bail just in case it becomes paginated
    throw new Error('Must implement pagination and next parameter');
  }


  db.post(pools.results.map((pool)=>{
    return {
      ...pool,
      'service': 'pactfi',
      'asset': {id: parseInt(pool.secondary_asset.algoid)},
      'type': 'price',
      'timestamp': Date.now(),
    };
  }));
  console.log(pools.results.length, pools.count);

  performance.mark('Finish');
  performance.measure('Start to Finish', 'Start', 'Finish');
};

fetchPactFiPrices();
