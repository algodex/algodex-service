require('dotenv').config();
const algosdk = require('algosdk');
const process = require('process');

const {createConsecutiveObject} = require('../src/util');
const {getAppsBlockRange, getBlock} = require('../src/explorer');
const getQueues = require('../src/queues');

const url = process.env.ALGORAND_NETWORK === 'testnet' ?
  'https://algoindexer.testnet.algoexplorerapi.io' :
  'https://algoindexer.algoexplorerapi.io';

const indexer = new algosdk.Indexer('', url, 443);

const queues = getQueues();

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
  const {start/* current */} = await getAppsBlockRange(indexer, apps);
  const rounds = createConsecutiveObject(start, start+5000);

  for (const round of Object.keys(rounds)) {
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
};


// Run the Sync
(async () => {
  await compare();
})();
