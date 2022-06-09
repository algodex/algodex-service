const bullmq = require('bullmq');
const Worker = bullmq.Worker;
const algosdk = require('algosdk');

let indexerClient = null;

const initOrGetIndexer = () => {
  if (indexerClient !== null) {
    return indexerClient;
  }
  const algosdk = require('algosdk');
  const baseServer = "https://testnet-algorand.api.purestake.io/idx2";
  const port = "";
  
  const token = {
      'X-API-key': 'VELyABA1dGqGbAVktbew4oACvp0c0298gMgYtYIb',
  }
  
  indexerClient = new algosdk.Indexer(token, baseServer, port);
  return indexerClient;
}

module.exports = ({queues, db, escrowDB}) =>{
  // Lighten the load on the broker and do batch processing
  console.log({escrowDB});
  console.log('in orderworker.js');
  const indexedOrders = new Worker('orders', async (job)=>{
    console.log('in orders queue');
    
    const blockData = job.data.blockData;
    const order = job.data.reducedOrder;
    const account = job.data.account;
    console.debug({
      msg: 'Received order',
      round: blockData.rnd,
      account: account,
    });
    const indexerClient = initOrGetIndexer();
    const round = blockData.rnd;
    const accountInfoPromise =
      indexerClient.lookupAccountByID(account).round(round).includeAll(true).do();

    return accountInfoPromise.then(function(accountInfo) {
      console.log(accountInfo);
      console.log('here57');
      const data = {indexerInfo: accountInfo, escrowInfo: order.value};
      data.lastUpdateUnixTime = blockData.ts;
      data.lastUpdateRound = blockData.rnd;
      return escrowDB.post({_id: `${account}-${blockData.rnd}`, type: 'block', data: data})
          .then(function(response) {
            console.debug({
              msg: `Indexed Block stored`,
              ...response,
            });
          }).catch(function(err) {
            if (err.error === 'conflict') {
              console.error(err);
            } else {
              throw err;
            }
          });
      }).catch(function (err) {
        console.log({err});
        throw err;
      });

  }, {connection: queues.connection, concurrency: 50});

  indexedOrders.on('error', (err) => {
    console.error( {err} );
  });
};

