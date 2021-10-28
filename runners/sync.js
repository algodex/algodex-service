#!/usr/bin/env node

import dotenv from 'dotenv';
dotenv.config();

import useQueues from '../messages/queues.js';

import {
  getBlock,
  getAppsBlockRange,
  useDatabase,
  getCPUChunkArray,
  getConsecutiveObject,
} from '@algodex/common';

import cluster from 'cluster';

const compare = async function() {
  const db = await useDatabase();
  const apps = [
    {
      id: 22045503,
      genesis: undefined,
    },
    {
      id: 22045522,
      genesis: undefined,
    },
  ];
  // Get a range of blocks for a list of applications
  const {start, current} = await getAppsBlockRange(apps);
  // Create an Object keyed by blocks in the range
  const rounds = getConsecutiveObject(start, current);

  // Look in the database for existing blocks and remove them from rounds
  const existingBlocks = (await db.allDocs()).rows.map((doc)=>parseInt(doc.id));
  existingBlocks.forEach((block)=>{
    delete rounds[block];
  });
  console.log(`Crushing ${rounds.length}`);
  // Chunk the keys for Multi-Threaded workers
  const chunks = getCPUChunkArray(Object.keys(rounds).map((r)=>parseInt(r)));
  console.log(start, current);
  // Chunk Process into Forks
  for (let i = 0; i < chunks.length; i++) {
    const worker = cluster.fork();
    worker.index = i;
    worker.on('message', function(msg) {
      if (msg === 'index') {
        worker.send({index: worker.index, chunks});
      }
    });
  }
};

// Fetch the block and add it to the storage queue
const queue = async function() {
  console.log('Worker working');
  const queues = await useQueues();
  process.on('message', async function({index, chunks}) {
    for (const round of chunks[index]) {
      console.log('Queue Round', round);
      const block = await getBlock({round});
      await queues.blocks.add('blocks', block, {removeOnComplete: true});
      console.log('Queue Round Sent', round);
    }
  });
  process.send('index');
};


/**
 * Run Sync
 * @return {Promise<void>}
 */
export default async function run() {
  if (!cluster.isWorker) {
    console.log(`Primary ${process.pid} is running`);
    await compare();
    cluster.on('exit', (worker, code, signal) => {
      console.log({
        msg: 'Worker Died',
        pid: worker.process.pid,
        code,
        signal,
      });
    });
  }
  if (cluster.isWorker) {
    await queue();
  }
}

if (process.env.NODE_ENV !== 'test') {
  run();
}

