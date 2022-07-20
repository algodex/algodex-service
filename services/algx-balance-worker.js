
const bullmq = require('bullmq');
const Worker = bullmq.Worker;
const process = require('node:process');
// const algosdk = require('algosdk');
const getDirtyAccounts = require('../src/get-dirty-accounts');
const convertQueueURL = require('../src/convert-queue-url');
const addBalanceToDB = require('./algx-balance-worker/addBalanceToDB');
const checkInDB = require('./algx-balance-worker/checkInDB');
const getCurrentBalanceMap =
  require('./algx-balance-worker/getCurrentBalanceMap');
const getChangedAccountValues =
  require('./algx-balance-worker/getChangedAccountValues');
// const { _ } = require('@algodex/algodex-sdk/lib/schema');

module.exports = ({queues, databases}) => {
  if (!process.env.ALGX_ASSET_ID) {
    throw new Error('ALGX_ASSET_ID is not set!');
  }
  const algxBalanceDB = databases.algx_balance;

  const algxBalanceWorker =
    new Worker(convertQueueURL('algxBalance'), async job => {
      const block = job.data;
      const round = job.data.rnd;
      console.log(`Got job! Round: ${round}`);
      const isInDB = await checkInDB(algxBalanceDB, round);
      if (isInDB) {
        // Nothing to do
        return;
      }
      const dirtyAccounts = getDirtyAccounts(block);
      const ownerToLastBalance =
        await getCurrentBalanceMap(algxBalanceDB, dirtyAccounts);
      const changedAccountData =
        getChangedAccountValues(ownerToLastBalance, block);

      if (changedAccountData.length > 0) {
        console.log('has changes!');
        console.log('has changes!');
      }
      await addBalanceToDB(algxBalanceDB, {
        _id: round+'',
        changes: changedAccountData,
      });
    }, {connection: queues.connection, concurrency: 50});

  algxBalanceWorker.on('error', err => {
    console.error( {err} );
    throw err;
  });
};

