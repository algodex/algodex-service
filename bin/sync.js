require('dotenv').config();
const algosdk = require('algosdk');
const cluster = require('cluster');
const process = require('process');

const {createConsecutiveObject, cpuChunkArray} = require('../src/util');
const {getAppsBlockRange, getBlock} = require('../src/explorer');
const getQueues = require('../src/queues');
const getDatabase = require('../src/db');

const url = process.env.ALGORAND_NETWORK === 'testnet' ?
  'https://algoindexer.testnet.algoexplorerapi.io' :
  'https://algoindexer.algoexplorerapi.io';

const indexer = new algosdk.Indexer('', url, 443);

const queues = getQueues();
const db = getDatabase('http://admin:dex@localhost:5984/blocks');

const compare = async function() {
  const apps = [
    {
      id: process.env.ALGORAND_NETWORK === 'testnet' ? 22045503 : 354073718,
      genesis: undefined,
    },
    {
      id: process.env.ALGORAND_NETWORK === 'testnet' ? 22045522: 354073834,
      genesis: undefined,
    },
  ];
  // Get a range of blocks for a list of applications
  const {start, current} = await getAppsBlockRange(indexer, apps);
  // Create an Object keyed by blocks in the range
  //const rounds = createConsecutiveObject(start, current);
  const rounds = createConsecutiveObject(start, start+5000);
  const allDocs = await db.allDocs();
  const blockDocs = allDocs.rows.filter((doc)=>!isNaN(doc.id));
  // Look in the database for existing blocks and remove them from rounds
  const existingBlocks = blockDocs.map((doc)=>parseInt(doc.id));
  existingBlocks.forEach((block)=>{
    delete rounds[block];
  });

  // Chunk the keys for Multi-Threaded workers
  const chunks = cpuChunkArray(Object.keys(rounds).map((r)=>parseInt(r)));
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
  process.on('message', async function({index, chunks}) {
    for (const round of chunks[index]) {
      console.log('Queue Round', round);
      let gotBlock = false;

      do {
        try {
          const block = await getBlock({round});
          gotBlock = true;
          await queues.blocks.add('blocks', block, {removeOnComplete: true});
          console.log('Queue Round Sent', round);
        } catch (e) {
          console.log('could not fetch block', {e});
        }
      } while (gotBlock === false);

    }
  });
  process.send('index');
};


// Run the Sync
(async () => {
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
})();
