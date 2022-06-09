const bullmq = require('bullmq');
const Worker = bullmq.Worker;
const algosdk = require('algosdk');

let indexerClient = null;
let escrowCounter3 = 0;
let escrowCounter4 = 0;
let escrowCounter5 = 0;
let escrowCounter6 = 0;

const printCounters = () => {
  console.debug('ESCROW COUNTERS: ' + escrowCounter3 + ' ' + 
  escrowCounter4 + ' ' + escrowCounter5 + ' ' + escrowCounter6 
  + ' total: ' + (escrowCounter4 + escrowCounter6) );
};

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
    //console.log('in orders queue');
    
    const blockData = job.data.blockData;
    const order = job.data.reducedOrder;
    const account = job.data.account;
    //console.debug({
    //  msg: 'Received order',
    //  round: blockData.rnd,
    //  account: account,
    //});
    const indexerClient = initOrGetIndexer();
    const round = blockData.rnd;
    const accountInfoPromise =
      indexerClient.lookupAccountByID(account).round(round).includeAll(true).do();

    return accountInfoPromise.then(function(accountInfo) {
     // console.log(accountInfo);
     // console.log('here57');
      const data = {indexerInfo: accountInfo, escrowInfo: order.value};
      data.lastUpdateUnixTime = blockData.ts;
      data.lastUpdateRound = blockData.rnd;
      escrowCounter3++;
      printCounters();

      return escrowDB.post({_id: `${account}-${blockData.rnd}`,
        type: 'block', data: data})
          .then(function(response) {
            escrowCounter4++;
            printCounters();
            //console.debug({
            //  msg: `Indexed Block stored with account info`,
            //  ...response,
            //});
          }).catch(function(err) {
            if (err.error === 'conflict') {
              console.error(err);
            } else {
              throw err;
            }
          });
    }).catch(function(err) {
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
              //console.debug({
              //  msg: `Indexed Escrow stored without account info`,
              //  ...response,
              //});
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
    });
  }, {connection: queues.connection, concurrency: 50});

  indexedOrders.on('error', (err) => {
    console.error( {err} );
  });
};

