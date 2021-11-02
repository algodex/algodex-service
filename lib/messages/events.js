// import Redis from 'ioredis';
import {useRedis} from '@algodex/common';
let events;

/**
 * Get Events
 *
 * Return a singleton instance of Redis.
 *
 * @example
 *   import useEvents from '@algodex/service/lib/messages/events.js';
 *   const events = useEvents();
 *   events.publish('channel', data)
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
