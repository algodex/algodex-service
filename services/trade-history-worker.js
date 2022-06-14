const bullmq = require('bullmq');
const Worker = bullmq.Worker;
// const algosdk = require('algosdk');

let indexerClient = null;

const initOrGetIndexer = () => {
  if (indexerClient !== null) {
    return indexerClient;
  }
  const algosdk = require('algosdk');
  const baseServer = 'https://testnet-algorand.api.purestake.io/idx2';
  const port = '';

  const token = {
    'X-API-key': 'VELyABA1dGqGbAVktbew4oACvp0c0298gMgYtYIb',
  };

  indexerClient = new algosdk.Indexer(token, baseServer, port);
  return indexerClient;
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
  const asaAmount = indexerInfo.account.assets ?
    indexerInfo.account.assets[0].amount : 0;
  return {
    address: indexerInfo.account.address,
    algoAmount: indexerInfo.account.amount,
    round: indexerInfo['current-round'],
    asaAmount: asaAmount,
  };
};

module.exports = ({queues, databases}) =>{
  const blockDB = databases.blocks;
  // Lighten the load on the broker and do batch processing
  console.log({blockDB});
  console.log('in trade-history-worker.js');
  const tradeHistoryWorker = new Worker('tradeHistory', async (job)=>{
    const blockId = job.data.block;
    console.log('received block: ' + blockId);
    return blockDB.query('blocks/tradeHistory',
        {reduce: false, key: blockId})
        .then(async function(res) {
          // Get valid escrows from trade history
          // Get asset information from DB
          // Mix data
          // Submit to trade history DB
          // res.rows.forEach( (row) => {
          //   const promise = 
          // });
          console.log({res});
        }).catch(function(e) {
          console.log(e);
          throw e;
        });
  }, {connection: queues.connection, concurrency: 50});

  tradeHistoryWorker.on('error', (err) => {
    console.error( {err} );
    throw err;
  });
};

