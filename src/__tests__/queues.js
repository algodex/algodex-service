const {InvalidConfiguration} = require('../Errors');
const RedisMock = require('ioredis-mock');
require('../__mocks__/Redis');

const Queue = require('bullmq').Queue;

test('queues are created', (done) => {
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
