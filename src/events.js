const Redis = require('ioredis');
const {InvalidConfiguration} = require('./Errors');

let events;

/**
 * Get Events
 *
 * Return a singleton instance of Redis. Optionally
 * pass in an instance to use as the singleton.
 * Passing in redis is useful for testing.
 *
 * @example
 *   const getEvents = require('./src/events');
 *   const events = getEvents();
 *
 * @return {Redis}
 */
module.exports = function() {
  if (
    typeof process.env['REDIS_PORT'] === 'undefined' ||
    typeof process.env['REDIS_ADDRESS'] === 'undefined'
  ) {
    throw new InvalidConfiguration('Redis not configured!');
  }

  const port = parseInt(process.env['REDIS_PORT']);
  const address = process.env['REDIS_ADDRESS'];

  if (typeof events === 'undefined') {
    // Define connection
    events = new Redis(port, address);
  }
  return events;
};
