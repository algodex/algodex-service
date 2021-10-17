const Redis = require('ioredis');
const Queue = require('bullmq').Queue;

let queues; let connection;
const port = parseInt(process.env['REDIS_MQ_PORT'] || 6379);
const address = process.env['REDIS_MQ_ADDRESS'] || 'queues';

/**
 * Get Queues
 *
 * Return a singleton instance of the available queues
 *
 * @return {{assets: Queue, blocks: Queue, connection: Redis, orders: Queue}}
 */
module.exports = function() {
  if (typeof connection === 'undefined') {
    // Define connection
    connection = new Redis(port, address);
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
