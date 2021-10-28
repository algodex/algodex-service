// import Redis from 'ioredis';
import {useRedis} from '@algodex/common';
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
export default function useEvents() {
  if (typeof events === 'undefined') {
    // Define connection
    events = useRedis().duplicate();
  }
  return events;
};
