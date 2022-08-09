
const {getBlock} = require('../explorer');
const {parentPort, workerData} = require('worker_threads');
const getDatabases = require('../db/get-databases');

const databases = getDatabases();
const blocksDB = databases.blocks;

const getAndAddBlocksFromChunk = async function({index, chunk}) {
  console.log('Worker working');
  console.log(`Worker index is ${index}`);

  for (const round of chunk) {
    console.log('Adding Round', round);
    let gotBlock = false;

    do {
      try {
        const block = await getBlock({round});
        if (!block.rnd) {
          continue;
        }
        gotBlock = true;
        try {
          await blocksDB.post({_id: `${block.rnd}`, type: 'block', ...block});
        } catch (e) {
          if (e.error === 'conflict') {
            console.log('the block ['+block.rnd+']was already added!');
            continue;
          }
          console.error('could not save block: ' +
              block.rnd + ' to db: ' + e.error + ' ' + e);
        }
      } catch (e) {
        console.log('could not fetch block', {e});
      }
    } while (gotBlock === false);
  }
};

const run = async () => {
  await getAndAddBlocksFromChunk({
    index: workerData.index,
    chunk: workerData.chunk,
  });
  parentPort.postMessage(`finished from worker index ${workerData.index}`);
};

run();
