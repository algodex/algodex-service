const {getBlock, waitForBlock} = require('../src/explorer');

const getBlockFromDBOrNode = require('../src/get-block-from-db-or-node');
const sleepWhileWaitingForQueues =
  require('../src/sleep-while-waiting-for-queues');
const convertQueueURL = require('../src/convert-queue-url');

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
  let round = {
    'last-round': 1,
  };

  /**
   * Run the Broker
   * @return {Promise<void>}
   */
  async function runWaitBlockSync() {
    // Just in case the wait fails, skip if we are on the same block
    const latestBlock = await waitForBlock({
      round: round['last-round'],
    });

    if (round['last-round'] === latestBlock['last-round']) {
      console.log('Waiting....');
    } else { // Submit the next round to the Queue and Publish event
      console.debug({
        msg: 'Processing Next Round',
        round: round['last-round'],
        next: latestBlock['last-round'],
      });

      let roundNumber = round['last-round'];
      roundNumber++;

      const block = await getBlock({round: roundNumber});
      await queues.blocks.add('blocks', block, {removeOnComplete: true});
      await events.publish(`blocks`, JSON.stringify(block.rnd));
      console.log({
        msg: 'Published and Queued',
        round: roundNumber,
      });

      // Update last round cache
      round = latestBlock;

      // Rerun forever
      runWaitBlockSync();
    }
  }

  /**
     * Run the Broker
     * @return {Promise<void>}
     */
  async function runCatchUp() {
    const syncedBlocksDB = databases.synced_blocks;
    const blocksDB = databases.blocks;

    let lastSyncedRound;

    const latestBlock = await waitForBlock({
      round: round['last-round'],
    });
    const result = await syncedBlocksDB.query('synced_blocks/max_block',
        {reduce: true, group: true, keys: [1]});

    if (result.rows && result.rows.length > 0) {
      lastSyncedRound = parseInt(result.rows[0].value);
    } else {
      throw new Error('Please run sync_sequential script first!');
    }

    do {
      await sleepWhileWaitingForQueues(['blocks']);

      lastSyncedRound++;
      console.log('In catchup mode, getting block: ' + lastSyncedRound);
      const block = await getBlockFromDBOrNode(blocksDB, lastSyncedRound);
      await queues.blocks.add('blocks', block, {removeOnComplete: true});
      await events.publish(`blocks`, JSON.stringify(block.rnd));
      console.log({
        msg: 'Published and Queued',
        round: lastSyncedRound,
      });
    } while (lastSyncedRound < latestBlock['last-round']);
    round['last-round'] = lastSyncedRound;
    runWaitBlockSync();
  }

  // Kick off the wrapper
  runCatchUp();
};
