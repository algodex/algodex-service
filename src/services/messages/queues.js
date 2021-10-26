// import Redis from 'ioredis';
import {getRedis} from '../../index.js';
const isWindows = process.platform === 'win32';

let queues; let connection;

/**
 * Get Queues
 *
 * Return a singleton instance of the available queues
 *
 * @return {{assets: Queue, blocks: Queue, connection: Redis, orders: Queue}}
 */
export default async function getQueues() {
// module.exports = function getQueues() {
  const Queue = isWindows ?
    (await import('bull')).default :
    (await import('bullmq')).Queue;

  if (typeof connection === 'undefined') {
    // Define connection
    connection = getRedis();
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
