
const {getBlock} = require('../explorer');
const {parentPort, workerData} = require('worker_threads');


const queue = async function({index, chunk, blocksDB}) {
  console.log('Worker working');
  console.log(`Worker index is ${index}`);

  process.on('message', async function({chunk}) {
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
  });
  process.send('index');
};

const run = async () => {
  await queue({index: workerData.index,
    chunk: workerData.chunk, blocksDB: workerData.blocksDB});
  parentPort.postMessage(`finished from ${workerData.index}`);
};

run();
