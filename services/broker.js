const {getBlock, waitForBlock} = require('../src/explorer');

const getBlockFromDBOrNode = require('../src/get-block-from-db-or-node');
const hasAlgxChanges = require('./algx-balance-worker/hasAlgxChanges');
const {syncParallel} = require('../src/sync-parallel/sync-parallel');


const sleepWhileWaitingForQueues =
  require('../src/sleep-while-waiting-for-queues');
const convertQueueURL = require('../src/convert-queue-url');
const sleep = require('../src/sleep');

const getBlockPromises = (queues, block) => {
  const hasAlgxTransactions = hasAlgxChanges(block);
  const retarr = [
    queues.blocks.add('blocks', block, {removeOnComplete: true}),
  ];
  if (hasAlgxTransactions) {
    retarr.push(
        queues.algxBalance.add('algxBalance', block, {removeOnComplete: true}));
  }
  return retarr;
};

const waitForBlockToBeStored = async (blocksDB, blockNum) => {
  const blockStr = `${blockNum}`;
  let foundPrevBlock = false;
  do {
    try {
      await blocksDB.get(blockStr);
      foundPrevBlock = true;
    } catch (e) {
      console.log(`${blockStr} block not yet stored in DB!`);
      await sleep(10);
    }
  } while (!foundPrevBlock);
};

module.exports = ({queues, events, databases}) => {
  console.log({
    msg: 'Broker Starting',
    queues: Object.keys(queues).length,
  });

  /**
     * Store the result of WaitForBlocks
     *
     * Use genesis block as a flag for "fresh init"
     * @type {{"last-round": number}}
     */
  const round = {
    'last-round': 1,
  };

  /**
   * Run the Broker
   * @return {Promise<void>}
   */
  async function runWaitBlockSync() {
    console.log('in runWaitBlockSync!');
    const latestBlock = await waitForBlock({
      round: round['last-round'],
    });

    // Just in case the wait fails, skip if we are on the same block
    if (round['last-round'] === latestBlock['last-round']) {
      // eslint-disable-next-line max-len
      console.log(`Waiting.... known last round ${round['last-round']} latest block: ${latestBlock['last-round']}`);
    } else { // Submit the next round to the Queue and Publish event
      console.debug({
        msg: 'Processing Next Round',
        round: round['last-round'],
        next: latestBlock['last-round'],
      });
      console.debug( new Date(). getTime());

      await sleepWhileWaitingForQueues(['blocks']);

      await waitForBlockToBeStored(databases.blocks, round['last-round']);
      await events.publish(`blocks`, JSON.stringify(round['last-round']));

      let roundNumber = round['last-round'];
      roundNumber++;

      const block = await getBlock({round: roundNumber});
      if (!block.rnd) {
        // retry
        runWaitBlockSync();
        return;
      }

      await Promise.all(getBlockPromises(queues, block));

      console.log({
        msg: 'Published and Queued',
        round: roundNumber,
      });

      round['last-round'] = roundNumber;
      // Update last round cache
    }
    // Rerun forever
    runWaitBlockSync();
  }

  /**
     * Run the Broker
     * @return {Promise<void>}
     */
  async function runCatchUp() {
    const syncedBlocksDB = databases.synced_blocks;
    const blocksDB = databases.blocks;

    let lastSyncedRound;
    let maxSyncedRoundInTestMode;

    const latestBlock = await waitForBlock({
      round: round['last-round'],
    });
    const result = await syncedBlocksDB.query('synced_blocks/max_block',
        {reduce: true, group: true, keys: [1]});

    if (result.rows && result.rows.length > 0) {
      lastSyncedRound = parseInt(result.rows[0].value);
    } else {
      lastSyncedRound = parseInt(process.env.GENESIS_LAUNCH_BLOCK);
    }

    if (lastSyncedRound > 0 &&
      lastSyncedRound < latestBlock['last-round'] - 10 &&
      !process.env.INTEGRATION_TEST_MODE) {
      await syncParallel();
    }

    if (process.env.INTEGRATION_TEST_MODE &&
      process.env.ALGORAND_NETWORK !== 'testnet') {
      throw new Error('INTEGRATION_TEST_MODE is only allowed for testnet');
    }

    if (process.env.INTEGRATION_TEST_MODE) {
      lastSyncedRound = 16583454 - 1;
      maxSyncedRoundInTestMode = 16583654;
    }

    let hadFirstRound = false;
    do {
      await sleepWhileWaitingForQueues(['blocks']);
      if (hadFirstRound) {
        // Get block before this round and make sure it exists in the DB
        // Probably unnecessary now since concurrency is 1? FIXME
        await waitForBlockToBeStored(databases.blocks, lastSyncedRound);
      }
      events.publish(`blocks`, JSON.stringify(lastSyncedRound));

      if (process.env.INTEGRATION_TEST_MODE && maxSyncedRoundInTestMode &&
        lastSyncedRound >= maxSyncedRoundInTestMode) {
        console.log('last synced round found! exiting ',
            lastSyncedRound, maxSyncedRoundInTestMode);
        process.exit(0);
      }
      lastSyncedRound++;
      console.log('In catchup mode, getting block: ' + lastSyncedRound);
      const block = await getBlockFromDBOrNode(blocksDB, lastSyncedRound);
      if (block.rnd === undefined) {
        // retry
        lastSyncedRound--;
        continue;
      }
      await Promise.all(getBlockPromises(queues, block));

      console.log({
        msg: 'Published and Queued',
        round: lastSyncedRound,
      });
      hadFirstRound = true;
    } while (lastSyncedRound < latestBlock['last-round']);
    round['last-round'] = lastSyncedRound;

    runWaitBlockSync();
  }

  // Kick off the wrapper
  runCatchUp();
};
