/* 
 * Algodex Service 
 * Copyright (C) 2022 Algodex VASP (BVI) Corp.
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/* eslint-disable require-jsdoc */
const {getBlock, waitForBlock} = require('../src/explorer');
const getBlockFromDBOrNode = require('../src/get-block-from-db-or-node');
const hasAlgxChanges = require('./algx-balance-worker/hasAlgxChanges');
const {syncParallel} = require('../src/sync-parallel/sync-parallel');
const withSchemaCheck = require('../src/schema/with-db-schema-check');
const {getRoundsWithNoDataSets,
  addMetadata} = require('../services/block-worker/orderMetadata');
const sleepWhileWaitingForQueues = require('../src/sleep-while-waiting-for-queues');
const sleep = require('../src/sleep');
const {waitForViewBuilding} = require('./waitForViewBuilding');
const getBlockPromises = (queues, block,
    skipOrderPromises = false, syncedBlocksDB = null, fastSyncMode=false) => {
  const hasAlgxTransactions = hasAlgxChanges(block);
  const retarr = [];
  block.fastSyncMode = fastSyncMode;
  if (!skipOrderPromises) {
    retarr.push(queues.blocks.add('blocks', block, {removeOnComplete: true}));
  } else {
    const syncedBlockPromise =
    syncedBlocksDB.post(withSchemaCheck('synced_blocks', {_id: `${block.rnd}`}))
        .then(function() { }).catch(function(err) {
          if (err.error === 'conflict') {
            console.error('Block was already synced! Not supposed to happen');
          } else {
            throw err;
          }
        });
    retarr.push(syncedBlockPromise);
  }
  if (hasAlgxTransactions) {
    retarr.push(queues.algxBalance.add('algxBalance', block, {removeOnComplete: true}));
  }
  addMetadata(block.rnd, 'algx_balance', hasAlgxTransactions);
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
      // console.log(`${blockStr} block not yet stored in DB!`);
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

      console.debug(new Date().getTime());
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

  const queueTradeHistoryInTestMode = async round => {
    if (process.env.INTEGRATION_TEST_MODE) {
      // In INTEGRATION_TEST_MODE, because we don't have
      // all the blocks, and don't know all accounts that are orders,
      // we need to create a trade history job so that it wont be missed.
      await queues.tradeHistory.add('tradeHistory',
          {block: `${round}`}, {removeOnComplete: true}).then(function() {
      }).catch(function(err) {
        console.error('error adding to trade history queue:', {err});
        throw err;
      });
    }
  };

  /**
       * Run the Broker
       * @return {Promise<void>}
       */
  async function runCatchUp() {
    const syncedBlocksDB = databases.synced_blocks;
    const blocksDB = databases.blocks;
    await waitForViewBuilding(blocksDB);
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
    await waitForViewBuilding(blocksDB);
    if (process.env.INTEGRATION_TEST_MODE &&
            process.env.ALGORAND_NETWORK !== 'testnet') {
      throw new Error('INTEGRATION_TEST_MODE is only allowed for testnet');
    }
    if (process.env.INTEGRATION_TEST_MODE) {
      lastSyncedRound = 16583454 - 1;
      maxSyncedRoundInTestMode = 16583654;
    }

    let noOrderDataMap = new Map();
    let maxMetadataBlock = lastSyncedRound;
    let blockIdsToSaveAsSynced = [];

    do {
      if (maxMetadataBlock <= lastSyncedRound) {
        // This is an optimization to improve resync speed
        console.log('getting noOrderDataSet between ' + maxMetadataBlock +
                    ' and ' + (maxMetadataBlock + 5000));
        noOrderDataMap =
          await getRoundsWithNoDataSets(maxMetadataBlock, maxMetadataBlock + 5000);
        maxMetadataBlock += 5000;
      }

      if (process.env.INTEGRATION_TEST_MODE && maxSyncedRoundInTestMode &&
                lastSyncedRound >= maxSyncedRoundInTestMode) {
        console.log('last synced round found! exiting ',
            lastSyncedRound, maxSyncedRoundInTestMode);
        process.exit(0);
      }
      lastSyncedRound++;
      const shouldSkipForOrderData = noOrderDataMap.has(lastSyncedRound) &&
                noOrderDataMap.get(lastSyncedRound).has('order');
      const shouldSkipForAlgxData = noOrderDataMap.has(lastSyncedRound) &&
                noOrderDataMap.get(lastSyncedRound).has('algx_balance');
      if (shouldSkipForOrderData && shouldSkipForAlgxData) {
        // eslint-disable-next-line max-len
        console.log(`Skipping block ${lastSyncedRound} entirely due to no order and algx data!`);
        queueTradeHistoryInTestMode(lastSyncedRound);
        blockIdsToSaveAsSynced.push(lastSyncedRound);
        continue;
      }
      if (blockIdsToSaveAsSynced.length > 0) {
        syncedBlocksDB.bulkDocs(blockIdsToSaveAsSynced.map(round => {
          return {_id: `${round}`};
        }));
        blockIdsToSaveAsSynced = [];
      }
      await sleepWhileWaitingForQueues(['blocks']);
      console.log('In catchup mode, getting block: ' + lastSyncedRound);
      // await waitForViewBuildingSimple();
      const block = await getBlockFromDBOrNode(blocksDB, lastSyncedRound);
      if (block.rnd === undefined) {
        // retry
        lastSyncedRound--;
        continue;
      }
      if (shouldSkipForOrderData) {
        console.log(`Skipping processing orders for ${lastSyncedRound}!`);
        await queueTradeHistoryInTestMode(lastSyncedRound);
      }
      await Promise.all(getBlockPromises(queues, block,
          shouldSkipForOrderData, syncedBlocksDB, true));
      console.log({
        msg: 'Published and Queued',
        round: lastSyncedRound,
      });
    } while (lastSyncedRound < latestBlock['last-round']);
    round['last-round'] = lastSyncedRound;
    runWaitBlockSync();
  }

  // Kick off the catch up
  runCatchUp();
};
