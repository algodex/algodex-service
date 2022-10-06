/*
 * Algodex Service
 * Copyright (C) 2022 Algodex VASP (BVI) Corp.
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

const Redis = require('ioredis');
const convertQueueURL = require('./convert-queue-url');
const Queue = require('bullmq').Queue;
const QueueScheduler = require('bullmq').QueueScheduler;
const {InvalidConfiguration} = require('./Errors');

let queues; let connection;

/**
 * Get Queues
 *
 * Return a singleton instance of the available queues
 *
 * @return {{assets: Queue, blocks: Queue,
 *  connection: Redis, orders: Queue, tradeHistory: Queue,
 *  formattedEscrows: Queue, algxBalance: Queue}}
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
    const queueNames = [
      'blocks',
      'assets',
      'orders',
      'tradeHistory',
      'formattedEscrows',
      'ownerBalance',
      'algxBalance',
    ];
    const mapIntegrationTestName = name => convertQueueURL(name);
    const getOriginalName = name => {
      return name.replace('integration_test__', '');
    };

    const queuesObjs = queueNames
        .map(name => mapIntegrationTestName(name))
        .map(name => {
          const obj = {};
          obj[name] = new Queue(name,
              {defaultJobOptions: defaultJobOptions, connection: connection},
          );
          return obj;
        });
    const schedulers = queueNames
        .map(name => mapIntegrationTestName(name))
        .map(name => {
          const obj = {};
          obj[name+'Scheduler'] =
            new QueueScheduler(name, {connection: connection});
          return obj;
        });
    const tempObjs = [...queuesObjs, ...schedulers];
    const finalObjs = tempObjs.reduce((finalObj, obj) => {
      const key = Object.keys(obj)[0];
      finalObj[getOriginalName(key)] = obj[key];
      return finalObj;
    }, {});
    queues = {connection, ...finalObjs, queueNames: queueNames};
    // queues = {
    //   connection,
    //   blocks: new Queue('blocks', {
    //     defaultJobOptions: defaultJobOptions, connection: connection},
    //   ),
    //   assets: new Queue('assets',
    //       {defaultJobOptions: defaultJobOptions, connection: connection},
    //   ),
    //   orders: new Queue('orders',
    //       {defaultJobOptions: defaultJobOptions, connection: connection},
    //   ),
    //   tradeHistory: new Queue('tradeHistory',
    //       {defaultJobOptions: defaultJobOptions, connection: connection},
    //   ),
    //   formattedEscrows: new Queue('formattedEscrows',
    //       {defaultJobOptions: defaultJobOptions, connection: connection},
    //   ),
    //   ownerBalance: new Queue('ownerBalance',
    //       {defaultJobOptions: defaultJobOptions, connection: connection},
    //   ),
    //   algxBalance: new Queue('algxBalance',
    //       {defaultJobOptions: defaultJobOptions, connection: connection},
    //   ),
    //   blocksScheduler: new QueueScheduler('blocks', {connection: connection}),
    //   ordersScheduler: new QueueScheduler('orders', {connection: connection}),
    //   algxBalanceScheduler: new QueueScheduler('algxBalance',
    //       {connection: connection}),
    //   assetsScheduler: new QueueScheduler('assets', {connection: connection}),
    //   tradeHistoryScheduler: new QueueScheduler('tradeHistory',
    //       {connection: connection}),
    //   formattedEscrowsScheduler: new QueueScheduler('formattedEscrows',
    //       {connection: connection}),
    //   ownerBalanceScheduler: new QueueScheduler('ownerBalance',
    //       {connection: connection}),
    // };
  }
  return queues;
};
