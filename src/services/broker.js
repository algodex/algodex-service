import {getLogger, explorer} from '../index.js';
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
export default async function run(
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
  const {'last-round': current} = await explorer.waitForBlock({round});

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

  const block = await explorer.getBlock({round});
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
  run({queues, events, round});
  // }
};