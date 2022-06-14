const Redis = require('ioredis');
const Queue = require('bullmq').Queue;
const QueueScheduler = require('bullmq').QueueScheduler;
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
    connection.setMaxListeners(16);
  }

  if (typeof queues === 'undefined') {
    // Define Queues
    const defaultJobOptions = {
      attempts: 1000,
      backoff: {
        type: 'exponential',
        delay: 300,
      },
    };
    queues = {
      connection,
      blocks: new Queue('blocks', {
        defaultJobOptions: defaultJobOptions, connection: connection},
      ),
      assets: new Queue('assets',
          {defaultJobOptions: defaultJobOptions, connection: connection},
      ),
      orders: new Queue('orders',
          {defaultJobOptions: defaultJobOptions, connection: connection},
      ),
      tradeHistory: new Queue('tradeHistory',
          {defaultJobOptions: defaultJobOptions, connection: connection},
      ),
      formattedEscrows: new Queue('formattedEscrows',
          {defaultJobOptions: defaultJobOptions, connection: connection},
      ),
      blocksScheduler: new QueueScheduler('blocks', {connection: connection}),
      ordersScheduler: new QueueScheduler('orders', {connection: connection}),
      assetsScheduler: new QueueScheduler('assets', {connection: connection}),
      tradeHistoryScheduler: new QueueScheduler('tradeHistory',
          {connection: connection}),
      formattedEscrowsScheduler: new QueueScheduler('formattedEscrows',
          {connection: connection},
      ),
    };
  }
  return queues;
};
