const bullmq = require('bullmq');
const Worker = bullmq.Worker;
// const algosdk = require('algosdk');
const initOrGetIndexer = require('../src/get-indexer');

const getFormattedOrderQueuePromise = (formattedEscrowsQueue, order) => {
  const promise = formattedEscrowsQueue.add('formattedEscrows', order,
      {removeOnComplete: true}).then(function() {
  }).catch(function(err) {
    console.error('error adding to formattedEscrows queue:', {err} );
    throw err;
  });
  return promise;
};


const reduceIndexerInfo = (indexerInfo) => {
  const asaAmount = indexerInfo.account.assets !== undefined ?
    indexerInfo.account.assets[0].amount : 0;
  return {
    address: indexerInfo.account.address,
    algoAmount: indexerInfo.account.amount,
    round: indexerInfo['current-round'],
    asaAmount: asaAmount,
  };
};

const addDocToIndexedEscrowDB = async (indexedEscrowDB, doc) => {
  try {
    await indexedEscrowDB.put(doc);
  } catch (err) {
    if (err.error === 'conflict') {
      console.log('conflict');
    } else {
      throw err;
    }
  }
};

const getApproximateBalance = async (blockDB, account, round) => {
  const startKey = [account, 1];
  const endKey = [account, parseInt(round)];

  const balanceDiffRes = await blockDB.query('blocks/approxBalance',
      {reduce: false, startkey: startKey, endkey: endKey} );

  const balanceDiffRows = balanceDiffRes.rows.map( (row) => row.value);
  if (!balanceDiffRows || balanceDiffRows.length === 0) {
    throw new Error('Balance diff rows are missing!');
  }

  const approxAlgo = balanceDiffRows.reduce( (balance, row) => {
    balance = balance + row.algoDiff;
    if (row.didCloseAccount) {
      balance = 0;
    }
    return balance;
  }, 0);

  const approxAsa = balanceDiffRows.reduce( (balance, row) => {
    balance = balance + row.asaDiff;
    if (row.didCloseAccount || row.didCloseAsset) {
      balance = 0;
    }
    return balance;
  }, 0);

  const entry = {
    address: account,
    algoAmount: approxAlgo >= 0 ? approxAlgo : 0,
    round: round,
    asaAmount: approxAsa >= 0 ? approxAsa : 0,
    isApproximate: true,
  };

  return entry;
};

const getIndexedEscrowInfo = async (blockDB, indexedEscrowDB,
    account, round) => {
  const indexerClient = initOrGetIndexer();

  try {
    const accountInfo = await indexedEscrowDB.get(account + '-' + round);
    return accountInfo;
  } catch (err) {
    if (err.error !== 'not_found') {
      throw err;
    } else {
      let accountInfo;
      try {
        accountInfo = await indexerClient.lookupAccountByID(account)
            .round(round).includeAll(true).do();
      } catch (e) {
        if (e.status === 500 &&
          e.message.includes('not currently supported')) {
          const reducedAccountInfo =
            await getApproximateBalance(blockDB, account, round);
          const doc = {
            _id: account+'-'+round,
            ...reducedAccountInfo,
          };
          await addDocToIndexedEscrowDB(indexedEscrowDB, doc);
          return doc;
        } else {
          throw e;
        }
      }
      const reducedAccountInfo = reduceIndexerInfo(accountInfo);
      const doc = {
        _id: account+'-'+round,
        ...reducedAccountInfo,
      };
      await addDocToIndexedEscrowDB(indexedEscrowDB, doc);
      return reducedAccountInfo;
    };
  }
};

const getOwnerBalancePromise = (queue, ownerAddr, roundStr) => {
  const jobData = {'ownerAddr': ownerAddr, 'roundStr': roundStr};
  const promise = queue.add('ownerBalance', jobData,
      {removeOnComplete: true}).then(function() {
  }).catch(function(err) {
    console.error('error adding to ownerBalance queue:', {err} );
    throw err;
  });
  return promise;
};

module.exports = ({queues, databases}) =>{
  const escrowDB = databases.escrow;
  const blockDB = databases.blocks;
  // Lighten the load on the broker and do batch processing
  console.log({escrowDB});
  console.log('in order-worker.js');
  const indexedOrders = new Worker('orders', async (job)=>{
    // console.log('in orders queue');

    const blockData = job.data.blockData;
    const order = job.data.reducedOrder;
    const account = job.data.account;
    console.debug({
      msg: 'Received order',
      round: blockData.rnd,
      account: account,
    });
    const round = blockData.rnd;

    try {
      await escrowDB.get(`${account}-${blockData.rnd}`);
      console.log(`${account}-${blockData.rnd} already in DB!`);
      return; // return if already in escrowDB
    } catch (e) {
      if (e.error !== 'not_found') {
        throw e;
      }
    }
    try {
      const accountInfo = await getIndexedEscrowInfo(blockDB,
          databases.indexed_escrow, account, round);

      const data = {indexerInfo: accountInfo,
        escrowInfo: order.value};
      data.lastUpdateUnixTime = blockData.ts;
      data.lastUpdateRound = blockData.rnd;
      console.log('escrowDB posting ' +`${account}-${blockData.rnd}`);
      return escrowDB.post({_id: `${account}-${blockData.rnd}`,
        type: 'block', data: data})
          .then(function(response) {
            // console.debug({
            //  msg: `Indexed Block stored with account info`,
            //  ...response,
            // });
            const formattedOrderPromise =
              getFormattedOrderQueuePromise(queues.formattedEscrows,
                  data);
            const ownerBalancePromise =
              getOwnerBalancePromise(queues.ownerBalance,
                  order.value.ownerAddr, `${blockData.rnd}`);
            return Promise.all([formattedOrderPromise, ownerBalancePromise]);
          }).catch(function(err) {
            if (err.error === 'conflict') {
              console.error('conflict 11b', err);
            } else {
              throw err;
            }
          });
    } catch (err) {
      throw err;
    }
  }, {connection: queues.connection, concurrency: 50});

  indexedOrders.on('error', (err) => {
    console.error( {err} );
  });
};
