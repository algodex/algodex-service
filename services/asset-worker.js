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

module.exports = ({queues, databases}) =>{
  const assetDB = databases.assets;
  // Lighten the load on the broker and do batch processing
  console.log({assetDB});
  console.log('in assets-worker.js');
  const indexer = initOrGetIndexer();

  const assetsWorker = new Worker('assets', async (job)=>{
    console.log('got assets job ', {job});
    const assetData = await indexer.lookupAssetByID(job.data.assetId).do();
    return assetDB.post({_id: `${job.data.assetId}`,
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
  }, {connection: queues.connection, concurrency: 50});

  assetsWorker.on('error', (err) => {
    console.error( {err} );
  });
};

