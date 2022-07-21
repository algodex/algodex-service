const addPrices = require('./pactfi/prices');
// eslint-disable-next-line no-unused-vars
const ALGX = require('../../src/algx-types');

/**
 * PactFi Worker
 *
 * By default it only watches for prices
 *
 * @param {{events: ALGX.Redis, databases: ALGX.PouchDB}} moduleInput
 */
module.exports = ({events, databases}) =>{
  const db = databases.prices;

  console.log(`⚙ Starting ${__filename}`);
  events.subscribe('blocks', (err, count) => {
    console.log('🔊 Subscribed to Blocks');
  });

  events.on('message', (channel, message)=>{
    console.log(`🔨 Processing block ${message}`);
    addPrices(db, Date.now());
  });
};

