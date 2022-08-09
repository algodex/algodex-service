require('dotenv').config();

const syncParallel = require('../src/sync-parallel/sync-parallel');

syncParallel();
// const algosdk = require('algosdk');
// const cluster = require('cluster');
// const process = require('process');

// const {createConsecutiveObject, cpuChunkArray} = require('../src/util');
// const {getAppsBlockRange, getBlock} = require('../src/explorer');
// // const getQueues = require('../src/queues');
// const args = require('minimist')(process.argv.slice(2));
// const {waitForBlock} = require('../src/explorer');

// const url = process.env.ALGORAND_NETWORK === 'testnet' ?
//   'https://algoindexer.testnet.algoexplorerapi.io' :
//   'https://algoindexer.algoexplorerapi.io';

// const indexer = new algosdk.Indexer('', url, 443);

// // const queues = getQueues();
// const getDatabases = require('../src/db/get-databases');


// const databases = getDatabases();
// const blocksDB = databases.blocks;

// const syncFromKnownRange = async startFrom => {
//   const latestBlockData = await waitForBlock({
//     round: 1,
//   });
//   const latestBlock = latestBlockData['last-round'];
//   console.log(`Starting sync between ${startFrom} and ${latestBlock}`);
//   const rounds = createConsecutiveObject(startFrom, latestBlock);
//   startSync(Object.keys(rounds));
// };

// const startSync = rounds => {
//   // Chunk the keys for Multi-Threaded workers
//   const chunks = cpuChunkArray(rounds.map(r=>parseInt(r)));

//   // Chunk Process into Forks
//   for (let i = 0; i < chunks.length; i++) {
//     const worker = cluster.fork();
//     worker.index = i;
//     worker.on('message', function(msg) {
//       if (msg === 'index') {
//         worker.send({index: worker.index, chunks});
//       }
//     });
//   }
// };
// // Fetch the block and add it to the storage queue


// const queue = async function() {
//   console.log('Worker working');
//   process.on('message', async function({index, chunks}) {
//     for (const round of chunks[index]) {
//       console.log('Adding Round', round);
//       let gotBlock = false;

//       do {
//         try {
//           const block = await getBlock({round});
//           if (!block.rnd) {
//             continue;
//           }
//           gotBlock = true;
//           try {
//             await blocksDB.post({_id: `${block.rnd}`, type: 'block', ...block});
//           } catch (e) {
//             if (e.error === 'conflict') {
//               console.log('the block ['+block.rnd+']was already added!');
//               continue;
//             }
//             console.error('could not save block: ' +
//               block.rnd + ' to db: ' + e.error + ' ' + e);
//           }
//         } catch (e) {
//           console.log('could not fetch block', {e});
//         }
//       } while (gotBlock === false);
//     }
//   });
//   process.send('index');
// };

// const getStartBlock = async () => {
//   const maxBlock = await blocksDB.query('blocks/maxBlock',
//       {reduce: true, group: true} );
//   return maxBlock.rows[0].value;
// };

// // Run the Sync
// (async () => {
//   if (!cluster.isWorker) {
//     console.log(`Primary ${process.pid} is running`);
//     const startBlock = await getStartBlock();

//     // if (!args.startFrom) {
//     //   await compare();
//     // } {
//     syncFromKnownRange(startBlock);
//     // }
//     cluster.on('exit', (worker, code, signal) => {
//       console.log({
//         msg: 'Worker Died',
//         pid: worker.process.pid,
//         code,
//         signal,
//       });
//     });
//   }
//   if (cluster.isWorker) {
//     await queue();
//   }
// })();
