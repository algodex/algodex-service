// import Redis from 'ioredis';
import {useRedis} from '@algodex/common';
const isWindows = process.platform === 'win32';

let queues; let connection;

/**
 * @typedef {Object} Queues
 * @property {Queue} blocks Blocks Message Queue
 * @property {Queue} assets Assets Message Queue
 * @property {Queue} orders Orders Message Queue
 * @property {Redis} connection Redis connection
 */

/**
 * Get Queues
 *
 * Return a singleton instance of the available queues
 *
 * @return {Queues}
 */
export default async function useQueues() {
  const Queue = isWindows ?
    (await import('bull')).default :
    (await import('bullmq')).Queue;

  if (typeof connection === 'undefined') {
    // Define connection
    connection = useRedis();
  }

  if (typeof queues === 'undefined') {
    // Define Queues
    queues = {
      connection,
      blocks: new Queue('blocks', {connection}),
      assets: new Queue('assets', {connection}),
      orders: new Queue('orders', {connection}),
    };
  }

  return queues;
};
