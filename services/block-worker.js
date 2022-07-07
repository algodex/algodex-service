const bullmq = require('bullmq');
const Worker = bullmq.Worker;
const verifyContracts = require('../src/verify-contracts');

const getDirtyAccounts = require('../src/get-dirty-accounts');
const withSchemaCheck = require('../src/schema/with-db-schema-check');
const sleepWhileWaitingForQueues =
  require('../src/sleep-while-waiting-for-queues');

const getAssetQueuePromise = (assetQueue, assetId) => {
  const assetAddJob = {assetId: assetId};
  const promise = assetQueue.add('assets', assetAddJob,
      {removeOnComplete: true}).then(function() {
    //console.log('added asset: ' + assetId);
  }).catch(function(err) {
    console.error('error adding to assets queue:', {err} );
    throw err;
  });
  return promise;
};

module.exports = ({queues, databases}) =>{
  const syncedBlocksDB = databases.synced_blocks;
  const blocksDB = databases.blocks;

  const blocks = new Worker('blocks', async job=>{
    console.debug({
      msg: 'Received block',
      round: job.data.rnd,
    });

    await sleepWhileWaitingForQueues(['tradeHistory', 'assets', 'orders']);

    const roundStr = `${job.data.rnd}`;
    try {
      const syncedBlock = await syncedBlocksDB.get(roundStr);
      if (syncedBlock) {
        return; // Already synced, nothing left to do
      }
    } catch (e) {
      if (e.error !== 'not_found') {
        throw e;
      }
    }

    try {
      await blocksDB.get(`${job.data.rnd}`);
    } catch (e) {
      if (e.error === 'not_found') {
        try {
          await blocksDB.post(withSchemaCheck('blocks', {_id: `${job.data.rnd}`,
            type: 'block', ...job.data}));
          console.debug({
            msg: `Block stored`,
            ...response,
          });
        } catch (err) {
          if (err.error === 'conflict') {
            console.error('already added! Still not supposed to happen');
          } else {
            throw err;
          }
        }
      }
    }

    // eslint-disable-next-line max-len
    const dirtyAccounts = getDirtyAccounts(job.data).map( account => [account] );

    return Promise.all( [blocksDB.query('blocks/orders',
        {reduce: true, group: true, keys: dirtyAccounts})
        .then(async function(res) {
          if (!res?.rows?.length) {
            return;
          }
          const assetIdSet = {};
          const validRows = await verifyContracts(res.rows,
              databases.verified_account);

          const assetsAndOrdersPromises =
            validRows.reduce( (allPromises, row) => {
            // add job

              const key = row.key;
              //console.log('got account', {key});

              const assetId = row.value.assetId;
              if (!('assetId:assetIds' in assetIdSet)) {
                assetIdSet[assetId] = 1;
                const assetAddPromise = getAssetQueuePromise(
                    queues.assets,
                    assetId,
                );
                allPromises.push(assetAddPromise);
              }

              const account = row.key[0];

              const ordersJob = {account: account,
                blockData: job.data, reducedOrder: row};
              console.log('queuing order: ' + ordersJob.account
                + ' ' + ordersJob.blockData.rnd);
              const promise = queues.orders.add('orders', ordersJob,
                  {removeOnComplete: true}).then(function() {
              }).catch(function(err) {
                console.error('error adding to orders queue:', {err} );
                throw err;
              });
              allPromises.push(promise);
              return allPromises;
              // //console.log('adding to orders');
            }, []);
          return Promise.all(assetsAndOrdersPromises);
        }).catch(function(err) {
          if (err.error === 'not_found') {
            // //console.log('not found');
            throw err;
          } else {
            //console.log('reducer error!!!');
            //console.log(err);
            throw err;
          }
        }),
    // The trade history is always from orders that previously existed
    // in other blocks, so we can queue it in parallel
    // to adding them to orders
    queues.tradeHistory.add('tradeHistory', {block: `${job.data.rnd}`},
        {removeOnComplete: true}).then(function() {
    }).catch(function(err) {
      console.error('error adding to orders queue:', {err} );
      throw err;
    }),

    // eslint-disable-next-line max-len
    syncedBlocksDB.post(withSchemaCheck('synced_blocks', {_id: `${job.data.rnd}`}))
        .then(function() { }).catch(function(err) {
          if (err.error === 'conflict') {
            console.error('Block was already synced! Not supposed to happen');
          } else {
            throw err;
          }
        }),

    ]);
  }, {connection: queues.connection, concurrency: 50});

  blocks.on('error', err => {
    console.error( {err} );
  });
};

