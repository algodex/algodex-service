const {InvalidConfiguration} = require('../Errors');
const RedisMock = require('ioredis-mock');
require('../__mocks__/Redis');
const getEvents = require('../events');

describe('Events Suite', ()=>{
  test('can be created', () => {
    process.env.REDIS_ADDRESS = 'localhost';
    process.env.REDIS_PORT = 6379;
    const eventsSingleton = getEvents();
    expect(eventsSingleton).toBeInstanceOf(RedisMock);
  });
  test('should be singleton', () => {
    process.env.REDIS_ADDRESS = 'localhost';
    process.env.REDIS_PORT = 6379;
    const eventsSingleton = getEvents();
    expect(eventsSingleton).toBeInstanceOf(RedisMock);

    const events = getEvents();
    expect(events).toBe(eventsSingleton);
  });
  test('fails on missing address', () => {
    delete process.env.REDIS_ADDRESS;
    process.env.REDIS_PORT = 6379;
    const getEvents = require('../events');
    expect(getEvents).toThrowError(InvalidConfiguration);
  });
  test('fails on missing port', () => {
    process.env.REDIS_ADDRESS = 'localhost';
    delete process.env.REDIS_PORT;
    const getEvents = require('../events');
    expect(getEvents).toThrowError(InvalidConfiguration);
  });
});
