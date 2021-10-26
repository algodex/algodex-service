// import Redis from 'ioredis';
import {getRedis} from '../../index.js';
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
  if (typeof events === 'undefined') {
    // Define connection
    events = getRedis().duplicate();
  }
  return events;
};
