const Redis = require('ioredis');
const {InvalidConfiguration} = require('./errors');
const {isWindows} = require('nodemon/lib/utils');

let queues; let connection;

module.exports.spec = `{
  "title": "Queues",
  "type": "object",
  "properties": {
    "connection":
      "type": "object",
      "description": "The Redis Connection Object"
    "blocks":
      "type": "object",
      "description": "The Blocks Queue"
    "assets":
      "type": "object",
      "description": "The Assets Queue"
    "orders":
      "type": "object",
      "description": "The Orders Queue"
  },
  "required": ["connection", "blocks", "assets", "orders"]
}`;

/**
 * Get Queues
 *
 * Return a singleton instance of the available queues
 *
 * @return {{assets: Queue, blocks: Queue, connection: Redis, orders: Queue}}
 */
module.exports = function getQueues() {
  const Queue = isWindows ? require('bull') : require('bullmq').Queue;

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
    queues = {
      connection,
      blocks: new Queue('blocks', {connection}),
      assets: new Queue('assets', {connection}),
      orders: new Queue('orders', {connection}),
    };
  }

  return queues;
};
