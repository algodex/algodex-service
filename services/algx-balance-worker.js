
const { _ } = require('@algodex/algodex-sdk/lib/schema');
const bullmq = require('bullmq');
const Worker = bullmq.Worker;
// const algosdk = require('algosdk');
const initOrGetIndexer = require('../src/get-indexer');
const withSchemaCheck = require('../src/schema/with-db-schema-check');
const getDirtyAccounts = require('../src/get-dirty-accounts');

const addBalanceToDB = async (ownerBalanceDB, doc) => {
  try {
    await ownerBalanceDB.put(withSchemaCheck('algx_balance', doc));
  } catch (err) {
    if (err.error === 'conflict') {
      console.error(err);
    } else {
      throw err;
    }
  }
};

const checkInDB = async (algxBalanceDB, round) => {
  try {
    const isInDB = await algxBalanceDB.get(''+round);
    if (isInDB) {
      return true;
    }
  } catch (e) {
    if (e.error === 'not_found') {
      return false;
    } else {
      throw e;
    }
  }
  return false;
};

module.exports = ({queues, databases}) =>{
  if (!process.env.ALGX_ASSET_ID) {
    throw new Error('ALGX_ASSET_ID is not set!');
  }
  const algxBalanceDB = databases.algx_balance;

  const algxBalanceWorker = new Worker('algxBalance', async job => {
    const block = job.data;
    const round = job.data.rnd;
    console.log(`Got job! Round: ${round}`);
    // const isInDB = await checkInDB(algxBalanceDB, round);
    // if (isInDB) {
    //   // Nothing to do
    //   return;
    // }
    const dirtyAccounts = getDirtyAccounts(block);
    // await addTxnsToDB(ownerBalanceDB, doc);
  }, {connection: queues.connection, concurrency: 50});

  algxBalanceWorker.on('error', err => {
    console.error( {err} );
    throw err;
  });
};

