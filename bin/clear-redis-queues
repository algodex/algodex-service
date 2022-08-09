#!/usr/bin/env node
require('dotenv').config();

const getQueues = require('../src/queues');
const sleep = require('../src/sleep');


const clearQueues = async () => {
  const queues = getQueues();
  while (queues.connection.status === 'connecting') {
    await sleep(100);
  }
  await queues.connection.flushall();
  console.log('Redis cleared');
  process.exit(0);
};

clearQueues();
