import {useLogger, waitForBlock, getBlock} from '@algodex/common';
const log = useLogger();

log.info({
  msg: '🎉 Broker Starting',
});

/**
 * Run the Broker
 *
 * Broker is responsible for watching blocks and publishing their results.
 * The Broker(Pub) is started with a list of MessageQueues, keyed by name.
 * Queues are used for publishing to subscribed Workers(Sub). An Events
 * stream Redis
 *
 * @param {Object} options Options for the Broker
 * @param {Object} options.queues Keyed list of Queues with connection
 * @param {Redis} options.events Events Connection
 * @param {number} options.round Round to start at
 * @param {boolean} [options.skip] Skip to the current block
 * @emits {NewBlockEvent} Sends block messages to subscribers
 * @emits {BlockQueueEvent} Sends block data to the Queue
 * @return {Promise<void>}
 */
export default async function broker(
    {
      queues,
      events,
      round,
      skip = false,
    },
) {
  log.debug({
    msg: `✨ starting loop, waiting for ${round}`,
  });
  /**
   * Store the result of WaitForBlocks
   *
   * Use genesis block as a flag for "fresh init"
   * @type {{"last-round": number}}
   */
  // Wait for the next block
  const {'last-round': current} = await waitForBlock({round});

  // log.info({
  //   msg: 'Found Block',
  //   round,
  //   current,
  //   skip,
  // })

  // Just in case the wait fails, skip if we are on the same block
  // if (round === current) {
  //   log.debug('Waiting....');
  // } else { // Submit the next round to the Queue and Publish event
  log.debug({
    msg: `🔨 processing next round ${round}`,
  });

  const block = await getBlock({round});
  await queues.blocks.add('blocks', block, {removeOnComplete: true});
  await events.publish(`blocks`, JSON.stringify(block.rnd));
  log.info({
    msg: `📢 published and queued ${block.rnd}`,
  });

  if (skip) {
    round = current;
  } else {
    // Update last round cache
    round++;
  }

  log.debug({
    msg: `🔁 running again with ${round}`,
  });
  // Rerun forever
  broker({queues, events, round});
  // }
};
