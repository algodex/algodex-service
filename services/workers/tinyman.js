// eslint-disable-next-line no-unused-vars
const ALGX = require('../../src/algx-types');

/**
 * Add Prices
 * @type {function}
 */
const addPrices = require('./tinyman/prices');

/**
 * @param {{events: ALGX.Redis, databases: ALGX.PouchDB}} moduleInput
 */
module.exports = ({events, databases}) =>{
  const db = databases.prices;
  console.log('Starting');
  events.subscribe('blocks', (err, count) => {
    console.log('Subscribed to Blocks');
  });

  events.on('message', (channel, message)=>{
    addPrices(db, Date.now());
  });
};

