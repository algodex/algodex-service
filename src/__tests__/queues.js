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

const {InvalidConfiguration} = require('../Errors');
// const RedisMock = require('ioredis-mock');
require('../__mocks__/Redis');

// const Queue = require('bullmq').Queue;

test('queues are created', done => {
  const getQueues = require('../queues');
  expect(getQueues).toThrowError(InvalidConfiguration);

  // process.env.REDIS_MQ_ADDRESS = 'localhost';
  // process.env.REDIS_MQ_PORT = 6379;

  // const queuesSingleton = getQueues();
  // const {connection, blocks, assets, orders} = queuesSingleton;

  // expect(connection).toBeInstanceOf(RedisMock);
  // expect(blocks).toBeInstanceOf(Queue);
  // expect(assets).toBeInstanceOf(Queue);
  // expect(orders).toBeInstanceOf(Queue);

  // const queues = getQueues();
  // expect(queues).toBe(queuesSingleton);
  done();
});
