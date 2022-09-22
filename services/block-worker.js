const bullmq = require('bullmq');
const withQueueSchemaCheck = require('../src/schema/with-queue-schema-check');


const Worker = bullmq.Worker;
const convertQueueURL = require('../src/convert-queue-url');
const getDirtyAccounts = require('../src/get-dirty-accounts');
const sleepWhileWaitingForQueues =
  require('../src/sleep-while-waiting-for-queues');
const checkBlockNotSynced = require('./block-worker/checkBlockNotSynced');
const addBlockToDB = require('./block-worker/addBlockToDB');
const getOrdersPromise = require('./block-worker/getOrdersPromise');
const withSchemaCheck = require('../src/schema/with-db-schema-check');
// eslint-disable-next-line no-unused-vars
const ALGX = require('../src/algx-types');
const {waitForViewBuildingSimple} = require('./waitForViewBuilding');

const state = {};

/**
 *
 *
 * @param {ALGX.BlockJob} job
 * @return {Promise}
 */
const performJob = async job=>{
  withQueueSchemaCheck('blocks', job.data);
  const {databases, queues} = state;
  const syncedBlocksDB = databases.synced_blocks;
  const blocksDB = databases.blocks;
  console.debug({
    msg: 'Received block',
    round: job.data.rnd,
  });

  console.log('here1');
  await waitForViewBuildingSimple();
  console.log('here2');

  await sleepWhileWaitingForQueues(['tradeHistory', 'assets',
    'orders', 'algxBalance']);

  await checkBlockNotSynced(blocksDB, job.data.rnd);
  if (!job.data.fastSyncMode) {
    console.log('here3');

    await addBlockToDB(blocksDB, job.data.rnd, job.data);
  } else {
    console.log('here4');

    console.log('in fast sync mode, not adding block to DB');
  }
  delete job.data.fastSyncMode;
  console.log('here5');

  // eslint-disable-next-line max-len
  const dirtyAccounts = getDirtyAccounts(job.data).map( account => [account] );

  return Promise.all( [getOrdersPromise({databases, queues,
    dirtyAccounts, blockData: job.data}),
  // The trade history is always from orders that previously existed
  // in other blocks, so we can queue it in parallel
  // to adding them to orders

  queues.tradeHistory.add('tradeHistory', {block: `${job.data.rnd}`},
      {removeOnComplete: true}).then(function() {
  }).catch(function(err) {
    console.error('error adding to trade history queue:', {err} );
    throw err;
  }),
  // queues.algxBalance.add('algxBalance', {...job.data},
  //     {removeOnComplete: true}).then(function() {
  // }).catch(function(err) {
  //   console.error('error adding to ALGX balance queue:', {err} );
  //   throw err;
  // }),
  // eslint-disable-next-line max-len
  syncedBlocksDB.post(withSchemaCheck('synced_blocks', {_id: `${job.data.rnd}`}))
      .then(function() { }).catch(function(err) {
        if (err.error === 'conflict') {
          console.log('Block was already synced!');
        } else {
          throw err;
        }
      }),

  ]);
};

module.exports = ({queues, databases}) =>{
  const blocks = new Worker(convertQueueURL('blocks'), performJob,
      {connection: queues.connection, concurrency: 250});
  state.queues = queues;
  state.databases = databases;
  blocks.on('error', err => {
    console.error( {err} );
  });
};

