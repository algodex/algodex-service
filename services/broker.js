const {getBlock, waitForBlock} = require('../src/explorer');

const getBlockFromDBOrNode = async (blocksDB, round) => {
  try {
    const block = await blocksDB.get(round);
    console.log('Got ' + round + ' block from DB');
    return block;
  } catch (e) {
    if (e.error === 'not_found') {
      console.error('block not found in DB! Fetching from Algorand node');
    } else {
      throw e;
    }
  }
  // Not in couchdb, so get from Algorand node
  try {
    const block = await getBlock({round});
    console.log('Got ' + round + ' block from Algorand node');
    return block;
  } catch (e) {
    console.error('Could not get block from node!');
  }
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
  let round = {
    'last-round': 1,
  };

  /**
   * Run the Broker
   * @return {Promise<void>}
   */
  async function runWaitBlockSync() {
    const blocksDB = databases.blocks;

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

      const block = await getBlockFromDBOrNode(blocksDB, roundNumber);
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
  // let x = 0;

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

    lastSyncedRound = parseInt(result.rows[0].value);

    do {
      lastSyncedRound++;
      console.log('In catchup mode, getting block: ' + lastSyncedRound);
      const block = await getBlockFromDBOrNode(blocksDB, lastSyncedRound);
      await queues.blocks.add('blocks', block, {removeOnComplete: true});
      await events.publish(`blocks`, JSON.stringify(block.rnd));
      console.log({
        msg: 'Published and Queued',
        round: lastSyncedRound,
      });
      // if (x > 20) {
      //   break;
      // }
      // x++;
    } while (lastSyncedRound < latestBlock['last-round']);
    round['last-round'] = lastSyncedRound;
    runWaitBlockSync();
  }

  // Kick off the wrapper
  runCatchUp();
};
