const Redis = require('ioredis');
const Queue = require('bullmq').Queue;
const {InvalidConfiguration} = require('./Errors');

let queues; let connection;

/**
 * Get Queues
 *
 * Return a singleton instance of the available queues
 *
 * @return {{assets: Queue, blocks: Queue, connection: Redis, orders: Queue}}
 */
module.exports = function() {
  if (
    typeof process.env['REDIS_MQ_PORT'] === 'undefined' ||
    typeof process.env['REDIS_MQ_ADDRESS'] === 'undefined'
  ) {
    throw new InvalidConfiguration('Redis not configured!');
  }

  const port = parseInt(process.env['REDIS_MQ_PORT']);
  const address = process.env['REDIS_MQ_ADDRESS'];

  if (typeof connection === 'undefined') {
    // Define connection
    connection = new Redis(port, address);
  }

  if (typeof queues === 'undefined') {
    // Define Queues
    const defaultJobOptions = {
      attempts: 300,
      backoff: {
        type: 'fixed',
        delay: 5000,
      },
    };
    queues = {
      connection,
      blocks: new Queue('blocks', {connection,
        defaultJobOptions: defaultJobOptions,
      }),
      assets: new Queue('assets', {connection,
        defaultJobOptions: defaultJobOptions,
      }),
      orders: new Queue('orders', {connection,
        defaultJobOptions: defaultJobOptions,
      }),
    };
  }

  return queues;
};
