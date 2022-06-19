const bullmq = require('bullmq');
const Worker = bullmq.Worker;
// const algosdk = require('algosdk');
const initOrGetIndexer = require('../src/get-indexer');

let indexerClient = null;
let escrowCounter3 = 0;
let escrowCounter4 = 0;
let escrowCounter5 = 0;
let escrowCounter6 = 0;

const printCounters = () => {
  console.debug('ESCROW COUNTERS: ' + escrowCounter3 + ' ' +
  escrowCounter4 + ' ' + escrowCounter5 + ' ' + escrowCounter6 +
  ' total: ' + (escrowCounter4 + escrowCounter6) );
};

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
    // console.debug({
    //  msg: 'Received order',
    //  round: blockData.rnd,
    //  account: account,
    // });
    const round = blockData.rnd;

    try {
      const accountInfo = await getindexedEscrowInfo(databases.indexed_escrow,
          account, round);

      const data = {indexerInfo: accountInfo,
        escrowInfo: order.value};
      data.lastUpdateUnixTime = blockData.ts;
      data.lastUpdateRound = blockData.rnd;
      escrowCounter3++;
      printCounters();
      return escrowDB.post({_id: `${account}-${blockData.rnd}`,
        type: 'block', data: data})
          .then(function(response) {
            escrowCounter4++;
            printCounters();
            // console.debug({
            //  msg: `Indexed Block stored with account info`,
            //  ...response,
            // });
            const formattedOrderPromise =
              getFormattedOrderQueuePromise(queues.formattedEscrows,
                  data);
            return formattedOrderPromise;
          }).catch(function(err) {
            if (err.error === 'conflict') {
              console.error(err);
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
        escrowCounter5++;
        printCounters();

        return escrowDB.post({_id: `${account}-${blockData.rnd}`,
          type: 'block', data: data})
            .then(function(response) {
              escrowCounter6++;
              printCounters();
              // console.debug({
              //  msg: `Indexed Escrow stored without account info`,
              //  ...response,
              // });
            }).catch(function(err) {
              if (err.error === 'conflict') {
                console.error(err);
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
