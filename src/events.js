const Redis = require('ioredis');

let events;
const port = parseInt(process.env['REDIS_PORT'] || 6379);
const address = process.env['REDIS_ADDRESS'] || 'events';
/**
 * Get Events
 *
 * Return a singleton instance of Redis
 *
 * @example
 *   const getEvents = require('./src/events');
 *   const events = getEvents();
 * @return {Redis}
 */
module.exports = function() {
  if (typeof events === 'undefined') {
    // Define connection
    events = new Redis(port, address);
  }
  return events;
};
