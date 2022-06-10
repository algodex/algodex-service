const addPrices = require('./pactfi/prices');

/**
 * PactFi Worker
 *
 * By default it only watches for prices
 *
 * @param {Redis} events Redis Instance
 * @param {PouchDB} db PouchDB Instance
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

