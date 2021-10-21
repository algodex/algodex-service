#!/usr/bin/env node

require('dotenv').config();

(async ()=>{
  const {DexError} = require('../src/errors');
  const getMessage = require('../src/message');

  const {RedisMemoryServer} = require('redis-memory-server');
  const redisServer = new RedisMemoryServer({
    instance: {
      port: 6379,
    },
  });
  try {
    await redisServer.getHost();
    await redisServer.getPort();
  } catch (data) {
    throw new DexError(getMessage({
      name: 'RedisError',
      description: 'Make sure port 6379 is open before starting!',
      data,
    }));
  }
})();
