const bullmq = require('bullmq');
const Worker = bullmq.Worker;
// const algosdk = require('algosdk');
const initOrGetIndexer = require('../src/get-indexer');
const withSchemaCheck = require('../src/schema/with-db-schema-check');
const convertQueueURL = require('../src/convert-queue-url');
const getAlgxBalance = require('./owner-balance-worker/getAlgxBalance');

const checkInDB = async (ownerBalanceDB, ownerAddr, round) => {
  try {
    const isInDB = await ownerBalanceDB.get(ownerAddr+'-'+round);
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

const addBalanceToDB = async (ownerBalanceDB, doc) => {
  try {
    await ownerBalanceDB.put(withSchemaCheck('owner_balance', doc));
  } catch (err) {
    if (err.error === 'conflict') {
      console.error(err);
    } else {
      throw err;
    }
  }
};

module.exports = ({queues, databases}) =>{
  if (!process.env.ALGX_ASSET_ID) {
    throw new Error('ALGX_ASSET_ID is not set!');
  }
  const ownerBalanceDB = databases.owner_balance;
  const indexerClient = initOrGetIndexer();

  const ownerBalanceWorker = new Worker(convertQueueURL('ownerBalance'), async job=>{
    const ownerAddr = job.data.ownerAddr;
    const round = job.data.roundStr;
    console.log(`Got job! Round: ${round} OwnerAddr: ${ownerAddr}`);
    const isInDB = await checkInDB(ownerBalanceDB, ownerAddr, round);
    if (isInDB) {
      // Nothing to do
      return;
    }

    let accountInfo;
    try {
      accountInfo = await indexerClient.lookupAccountByID(ownerAddr)
          .round(round).includeAll(true).do();
    } catch (e) {
      if (e.status === 500 &&
        (e.message.includes('not currently supported') ||
        e.message.includes('is not supported'))) {
        const doc = {
          _id: ownerAddr+'-'+round,
          noAccountInfo: true,
        };
        await addBalanceToDB(ownerBalanceDB, doc);
      } else {
        throw e;
      }
    }
    const algxBalance = getAlgxBalance(accountInfo);
    const doc = {
      _id: ownerAddr+'-'+round,
      assetId: process.env.ALGX_ASSET_ID,
      balance: algxBalance,
    };
    // eslint-disable-next-line max-len
    console.log(`Adding owner balance to DB! Round: ${round} OwnerAddr: ${ownerAddr}`);
    await addBalanceToDB(ownerBalanceDB, doc);
  }, {connection: queues.connection, concurrency: 50});

  ownerBalanceWorker.on('error', err => {
    console.error( {err} );
    throw err;
  });
};

