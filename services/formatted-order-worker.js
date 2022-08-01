const bullmq = require('bullmq');
const withSchemaCheck = require('../src/schema/with-db-schema-check');
const pushHistory = require('../src/push-history');
const convertQueueURL = require('../src/convert-queue-url');
const withQueueSchemaCheck = require('../src/schema/with-queue-schema-check');

const Worker = bullmq.Worker;
// const algosdk = require('algosdk');

const setAssetHistory = data => {
  if (!data.escrowInfo.isAlgoBuyEscrow) {
    const historyEntry = {
      asaAmount: data.indexerInfo.asaAmount,
      round: data.lastUpdateRound,
      time: data.lastUpdateUnixTime,
    };
    pushHistory(data, historyEntry);
  } else {
    const historyEntry = {
      algoAmount: data.indexerInfo.algoAmount,
      round: data.lastUpdateRound,
      time: data.lastUpdateUnixTime,
    };
    pushHistory(data, historyEntry);
  }
};

module.exports = ({queues, databases}) =>{
  const formattedEscrowDB = databases.formatted_escrow;
  const assetDB = databases.assets;
  const verifiedDB = databases.verified_account;
  // Lighten the load on the broker and do batch processing
  console.log({formattedEscrowDB});
  console.log('in formatted-order-worker.js');

  const formattedOrderWorker = new Worker(convertQueueURL('formattedEscrows'), async job=>{
    console.log('got formatted escrows job ', {data: job.data});
    withQueueSchemaCheck('formattedEscrows', job.data);
    const assetId = job.data.escrowInfo.assetId;
    const addr = job.data.indexerInfo.address;
    const data = job.data;

    const assetGetPromise = assetDB.get(assetId)
        .then(function(res) {
          console.log({res});
          data.assetDecimals = res.asset.params.decimals;

          const formattedOrderGet = formattedEscrowDB.get(addr).then(
              async function(res) {
                data.history = res.data.history;
                if (!data.escrowInfo.version) {
                  const verifiedAccount = await verifiedDB.get(addr);
                  const version = verifiedAccount.version;
                  data.escrowInfo.version = version;
                }
                setAssetHistory(data);
                // eslint-disable-next-line max-len
                return formattedEscrowDB.put(withSchemaCheck('formatted_escrow', {
                  _id: res._id,
                  _rev: res._rev,
                  data: res.data,
                })).then(function(res) {
                  console.log('added doc revision: ' + data);
                });
              }).catch(function(err) {
            if (err.error === 'not_found') {
              setAssetHistory(data);
              return formattedEscrowDB.post(
                  withSchemaCheck('formatted_escrow', {_id: `${addr}`,
                    type: 'formatted_escrow', data: data}))
                  .then(function(response) {
                    console.log('posted formatted escrow');
                  });
            } else {
              throw err;
            }
          });
          return formattedOrderGet;
        }).catch(function(err) {
          console.error('Error fetching asset: '+ assetId);
          throw err;
        });

    return assetGetPromise;


    // const assetData = await indexer.lookupAssetByID(job.data.assetId).do();
    /* return assetDB.post({_id: `${job.data.assetId}`,
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

  formattedOrderWorker.on('error', err => {
    console.error( {err} );
  });
};

