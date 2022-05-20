const {PerformanceObserver, performance} = require('node:perf_hooks');

const obs = new PerformanceObserver((items) => {
  console.log(items.getEntries()[0].duration);
  performance.clearMarks();
});
obs.observe({type: 'measure'});
performance.measure('Latency');

const fetch = require('cross-fetch');
module.exports = ({events, db}) =>{
  console.log('Starting');
  events.subscribe('blocks', (err, count) => {
    console.log('Subscribed to Blocks');
  });

  events.on('message', (channel, message)=>{
    performance.mark('Start');
    console.log('Message!', channel, message);
    // TODO: Allow for switching networks
    fetch('https://testnet.analytics.tinyman.org/api/v1/current-asset-prices/').then(async (res)=>{
      const prices = await res.json();
      await db.bulkDocs(Object.keys(prices).map((key)=>{
        // TODO: Better timestamps
        return {
          ...prices[key],
          'service': 'tinyman',
          'asset': {id: parseInt(key)},
          'type': 'price',
          'timestamp': Date.now(),
        };
      }));
      console.log(prices);

      performance.mark('Finish');
      performance.measure('Start to Finish', 'Start', 'Finish');
    });
  });
};

