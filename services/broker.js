const {getBlock, waitForBlock} = require('../src/explorer');
const getLogger = require('../src/logger');
const log = getLogger();

log.info({
  msg: '🎉 Broker Starting',
});

/**
 *
 * @param {object} queues
 * @param {object} events
 * @param {number|string} round
 * @return {Promise<void>}
 */
module.exports = async function run(
    {
      queues,
      events,
      round,
      skip = false,
    },
) {
  /**
   * Store the result of WaitForBlocks
   *
   * Use genesis block as a flag for "fresh init"
   * @type {{"last-round": number}}
   */
  // Wait for the next block
  const {'last-round': current} = await waitForBlock({round});

  // Just in case the wait fails, skip if we are on the same block
  if (round === current) {
    log.debug('Waiting....');
  } else { // Submit the next round to the Queue and Publish event
    log.info({
      msg: 'Processing Next Round',
      round,
      current,
    });

    const block = await getBlock({round});
    await queues.blocks.add('blocks', block, {removeOnComplete: true});
    await events.publish(`blocks`, JSON.stringify(block.rnd));
    log.info({
      msg: 'Published and Queued',
      round,
    });

    if (skip) {
      round = current;
    } else {
      // Update last round cache
      round++;
    }


    // Rerun forever
    run({queues, events, round});
  }
};
