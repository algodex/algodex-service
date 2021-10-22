import Redis from 'ioredis';
import {InvalidConfiguration} from '../../src/errors/index.js';

// const Redis = require('ioredis');
// const {InvalidConfiguration} = require('./errors');
let events;

/**
 * Get Events
 *
 * Return a singleton instance of Redis.
 *
 * @example
 *   const getEvents = require('./src/events');
 *   const events = getEvents();
 *
 * @return {Redis}
 */
export default function getEvents() {
// module.exports = function() {
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
