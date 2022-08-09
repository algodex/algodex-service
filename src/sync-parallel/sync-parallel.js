require('dotenv').config();

const {createConsecutiveObject, cpuChunkArray} = require('../util');
// const getQueues = require('../src/queues');
const {waitForBlock} = require('../explorer');
const {Worker} = require('worker_threads');


// const queues = getQueues();
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
  startSync(Object.keys(rounds));
};

const startSync = rounds => {
  // Chunk the keys for Multi-Threaded workers
  const chunks = cpuChunkArray(rounds.map(r=>parseInt(r)));


  // Chunk Process into Forks
  for (let i = 0; i < chunks.length; i++) {
    const worker = new Worker('./sync-worker.js',
        {workerData: {index: i, chunk: chunks[i], blocksDB}});
    worker.once('message', result => {
      console.log(`Got message from worker ${result}`);
    });
    worker.on('error', error => {
      console.log(`worker ${i} error: `, error);
    });
    worker.on('exit', exitCode => {
      console.log(`Worker ${i} exited with code ${exitCode}`);
    });
  }
};
// Fetch the block and add it to the storage queue

const getStartBlock = async () => {
  const maxBlock = await blocksDB.query('blocks/maxBlock',
      {reduce: true, group: true} );
  return maxBlock.rows[0].value;
};

const syncParallel = async () => {
  console.log(`Syncing in parallel`);
  const startBlock = await getStartBlock();

  // if (!args.startFrom) {
  //   await compare();
  // } {
  syncFromKnownRange(startBlock);
};

module.exports = syncParallel;

