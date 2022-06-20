const bullmq = require('bullmq');
const Worker = bullmq.Worker;
// const algosdk = require('algosdk');
const initOrGetIndexer = require('../src/get-indexer');

let indexerClient = null;

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

const getindexedEscrowInfo = async (indexedEscrowDB, account, round) => {
  const indexerClient = initOrGetIndexer();

  try {
    const accountInfo = await indexedEscrowDB.get(account+ '-'+ round);
    if (accountInfo.noAccountInfo) {
      const err = {status: 500,
        message: 'not currently supported'};
      throw err;
    }
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
          const doc = {
            _id: account+'-'+round,
            noAccountInfo: true,
          };
          await addDocToIndexedEscrowDB(indexedEscrowDB, doc);
        }
        throw e;
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
}
module.exports = ({queues, databases}) =>{
  const escrowDB = databases.escrow;
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
      const accountInfo = await getindexedEscrowInfo(databases.indexed_escrow,
          account, round);

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
      if (err.status === 500 &&
        err.message.includes('not currently supported')) {
        const data = {indexerInfo: 'noAccountInfo', escrowInfo: order.value};
        data.lastUpdateUnixTime = blockData.ts;
        data.lastUpdateRound = blockData.rnd;

        return escrowDB.post({_id: `${account}-${blockData.rnd}`,
          type: 'block', data: data})
            .then(function(response) {
              const ownerBalancePromise =
                getOwnerBalancePromise(queues.ownerBalance,
                    order.value.ownerAddr, `${blockData.rnd}`);
              return ownerBalancePromise;
            }).catch(function(err) {
              if (err.error === 'conflict') {
                console.error('conflict 11a', err);
              } else {
                throw err;
              }
            });
      } else {
        // console.log({err});
        throw err;
      }
    }
  }, {connection: queues.connection, concurrency: 50});

  indexedOrders.on('error', (err) => {
    console.error( {err} );
  });
};
