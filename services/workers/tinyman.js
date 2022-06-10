/**
 * @typedef {import('ioredis').default} Redis
 */

/**
 * @typedef {import('PouchDB')} PouchDB
 */

/**
 * Add Prices
 * @type {function}
 */
const addPrices = require('./tinyman/prices');

/**
 *
 * @param {Redis} events
 * @param {PouchDB} db
 */
module.exports = ({events, databases}) =>{
  const db = databases.dex;
  console.log('Starting');
  events.subscribe('blocks', (err, count) => {
    console.log('Subscribed to Blocks');
  });

  events.on('message', (channel, message)=>{
    addPrices(db, Date.now());
  });
};

