const bullmq = require('bullmq');
const Worker = bullmq.Worker;
// const algosdk = require('algosdk');
const withSchemaCheck = require('../src/schema/with-db-schema-check');
const convertQueueURL = require('../src/convert-queue-url');

const initOrGetIndexer = require('../src/get-indexer');

const getAssetInCouch = async (assetDB, assetId) => {
  try {
    const res = await assetDB.get(assetId);
    if (res) {
      return true;
    }
  } catch (e) {
    if (e.error !== 'not_found') {
      throw e;
    }
  }
  return false;
};

module.exports = ({queues, databases}) =>{
  const assetDB = databases.assets;
  // Lighten the load on the broker and do batch processing
  console.log({assetDB});
  console.log('in assets-worker.js');
  const indexer = initOrGetIndexer();

  const assetsWorker = new Worker(convertQueueURL('assets'), async job=>{
    console.log('got assets job ', {job});
    const assetInCouch = await getAssetInCouch(assetDB, job.data.assetId);
    if (assetInCouch) {
      return;
    }
    const assetData = await indexer.lookupAssetByID(job.data.assetId).do();
    return assetDB.post(withSchemaCheck('assets', {_id: `${job.data.assetId}`,
      type: 'asset', ...assetData}))
        .then(async function(response) {
          console.debug({
            msg: `Asset ${job.data.assetId} stored`,
          });
        }).catch(function(err) {
          if (err.error === 'conflict') {
            console.log('asset already added');
          } else {
            throw err;
          }
        });
  }, {connection: queues.connection, concurrency: 50});

  assetsWorker.on('error', err => {
    console.error( {err} );
  });
};

