const {InvalidConfiguration} = require('../Errors');
const RedisMock = require('ioredis-mock');
require('../__mocks__/Redis');

test('event stream can be created', (done) => {
  const getEvents = require('../events');
  expect(getEvents).toThrowError(InvalidConfiguration);

  process.env.REDIS_ADDRESS = 'localhost';
  process.env.REDIS_PORT = 6379;
  const eventsSingleton = getEvents();
  expect(eventsSingleton).toBeInstanceOf(RedisMock);

  const events = getEvents();
  expect(events).toBe(eventsSingleton);
  done();
});
