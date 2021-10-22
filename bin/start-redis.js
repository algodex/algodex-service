#!/usr/bin/env node
import dotenv from 'dotenv';
dotenv.config();

(async ()=>{
  const {DexError} = await import('../src/errors/index.js');
  const getMessage = await import('../src/message.js');

  const {RedisMemoryServer} = await import('redis-memory-server');
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
