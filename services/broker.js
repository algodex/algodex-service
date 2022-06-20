const {getBlock, waitForBlock} = require('../src/explorer');

module.exports = ({queues, events}) => {
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
  async function run() {
    // Wait for the next block
    const latestBlock = await waitForBlock({
      round: round['last-round'],
    });

    // Just in case the wait fails, skip if we are on the same block
    if (round['last-round'] === latestBlock['last-round']) {
      console.log('Waiting....');
    } else { // Submit the next round to the Queue and Publish event
      console.debug({
        msg: 'Processing Next Round',
        round: round['last-round'],
        next: latestBlock['last-round'],
      });

      let roundNumber = round['last-round'];
      if (round['last-round'] !== 1) {
        // Bump the last round, after WaitForBlock is complete
        roundNumber++;
      } else {
        // Use the WaitForBlock round number if we don't have one stored
        roundNumber = latestBlock['last-round'];
      }
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
      run();
    }
  }

  // Kick off the wrapper
  run();
};
