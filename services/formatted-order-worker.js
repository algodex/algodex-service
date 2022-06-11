const bullmq = require('bullmq');
const Worker = bullmq.Worker;
const algosdk = require('algosdk');

const pushHistory = (data, historyEntry) => {
  const history = data.history || [];
  history.push(historyEntry);
  data.history = history;
};
const setAssetHistory = (data) => {
  if (!data.escrowInfo.isAlgoBuyEscrow) {
    const historyEntry = {
      block: data.indexerInfo.account.round,
      asaAmount: data.indexerInfo.account.assets[0]['amount'],
    };
    pushHistory(data, historyEntry);
  } else {
    const historyEntry = {
      block: data.indexerInfo.account.round,
      algoAmount: data.indexerInfo.account.amount,
    };
    pushHistory(data, historyEntry);
  }
};

module.exports = ({queues, databases}) =>{
  const formattedEscrowDB = databases.formattedEscrow;
  const assetDB = databases.assets;
  // Lighten the load on the broker and do batch processing
  console.log({formattedEscrowDB});
  console.log('in formatted-order-worker.js');

  const formattedOrderWorker = new Worker('formattedEscrows', async (job)=>{
    console.log('got formatted escrows job ', {job});
    const assetId = job.data.escrowInfo.assetId;
    const addr = job.data.indexerInfo.account.address;
    const data = job.data;

    const assetGetPromise = assetDB.get(assetId)
        .then(function(res) {
          console.log({res});
          data.assetInfo = res.asset;

          const formattedOrderGet = formattedEscrowDB.get(addr).then(function(res) {
            data.history = res.data.history;
            setAssetHistory(data);
            return formattedEscrowDB.put({
              _id: res._id,
              _rev: res._rev,
              data: res.data,
            }).then(function(res) {
              console.log('added doc revision: ' + data);
            });
          }).catch(function(err) {
            if (err.error === 'not_found') {
              setAssetHistory(data);
              return formattedEscrowDB.post({_id: `${addr}`,
                type: 'formatted_escrow', data: data})
                  .then(function(response) {
                    console.log('posted formatted escrow');
                  });
            } else {
              throw err;
            }
          });
          return formattedOrderGet;
          
        }).catch(function(err) {
          throw err;
        });
      
        return assetGetPromise;


    //const assetData = await indexer.lookupAssetByID(job.data.assetId).do();
    /*return assetDB.post({_id: `${job.data.assetId}`,
      type: 'asset', ...assetData})
        .then(async function(response) {
          console.debug({
            msg: `Asset ${job.data.assetId} stored`,
            ...response,
          });
        }).catch(function(err) {
          if (err.error === 'conflict') {
            console.log('asset already added');
          } else {
            throw err;
          }
        });
      */
  }, {connection: queues.connection, concurrency: 50});

  formattedOrderWorker.on('error', (err) => {
    console.error( {err} );
  });
};

