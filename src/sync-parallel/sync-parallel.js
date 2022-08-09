require('dotenv').config();

const {createConsecutiveObject, cpuChunkArray} = require('../util');
// const getQueues = require('../src/queues');
const {waitForBlock} = require('../explorer');
const {Worker} = require('worker_threads');
const path = require('path');


const getDatabases = require('../db/get-databases');
const databases = getDatabases();
const blocksDB = databases.blocks;

const syncFromKnownRange = async startFrom => {
  const latestBlockData = await waitForBlock({
    round: 1,
  });
  const latestBlock = latestBlockData['last-round'];
  console.log(`Starting sync between ${startFrom} and ${latestBlock}`);
  const rounds = createConsecutiveObject(startFrom, latestBlock);
  await startSync(Object.keys(rounds)).then(res => console.log(res));
};

const startSync = async rounds => {
  const p = new Promise(function(resolve, reject) {
    // Chunk the keys for Multi-Threaded workers
    const chunks = cpuChunkArray(rounds.map(r=>parseInt(r)));

    const processSet = new Set();
    for (let i = 0; i < chunks.length; i++) {
      processSet.add(i);
      const worker = new Worker(path.resolve(__dirname, './sync-worker.js'),
          {workerData: {index: i, chunk: chunks[i]}});
      worker.once('message', result => {
        console.log(`Got message from worker ${result}`);
      });
      worker.on('error', error => {
        console.log(`worker ${i} error: `, error);
        processSet.delete(i);
        reject(new Error(`Error in worker ${i}`));
      });
      worker.on('exit', exitCode => {
        console.log(`Worker ${i} exited with code ${exitCode}`);
        processSet.delete(i);
        if (processSet.size === 0) {
          resolve('Finished parallel sync. All workers exited.');
        }
      });
    }
  });
  return p;
};
// Fetch the block and add it to the storage queue

const getMaxBlock = async () => {
  const maxBlock = await blocksDB.query('blocks/maxBlock',
      {reduce: true, group: true} );
  return maxBlock.rows[0].value;
};

const syncParallel = async () => {
  console.log(`Syncing in parallel`);
  const startBlock = await getMaxBlock();
  await syncFromKnownRange(startBlock);
};

module.exports = {syncParallel, getMaxBlock};

