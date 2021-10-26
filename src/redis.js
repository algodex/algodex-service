import Redis from 'ioredis';
import {getEnvironment} from './index.js';

let redis;

/**
 * Get Redis Interface
 * @return {Redis}
 */
export default function getRedis() {
  if (typeof redis === 'undefined') {
    const addr = getEnvironment(
        'REDIS_ADDRESS',
        {throwError: false},
    ) || '127.0.0.1';
    const port = getEnvironment(
        'REDIS_PORT',
        {throwError: false},
    ) || '6379';

    redis = new Redis(port, addr);
  }
  return redis;
};
