import asset from "../src/schema/queue/asset";

const bullmq = require('bullmq');
const Worker = bullmq.Worker;
// const algosdk = require('algosdk');
const withSchemaCheck = require('../src/schema/with-db-schema-check');
const convertQueueURL = require('../src/convert-queue-url');
const withQueueSchemaCheck = require('../src/schema/with-queue-schema-check');
const {waitForViewBuildingSimple} = require('./waitForViewBuilding');
const axios = require('axios').default;
const initOrGetIndexer = require('../src/get-indexer');

const getAssetInCouch = async (assetDB, assetId) => {
  try {
    const res = await assetDB.get(assetId);
    if (res) {
      return res;
    }
  } catch (e) {
    if (e.error !== 'not_found') {
      throw e;
    }
  }
  return null;
};

export interface AssetDoc {
  _id: string
  _rev: string
  type: string
  verified: boolean
  lastVerified: number
  asset: Asset
  "current-round": number
}

export interface Asset {
  "created-at-round": number
  deleted: boolean
  index: number
  params: Params
}

export interface Params {
  clawback: string
  creator: string
  decimals: number
  "default-frozen": boolean
  freeze: string
  manager: string
  name: string
  "name-b64": string
  reserve: string
  total: number
  "unit-name": string
  "unit-name-b64": string
}

const shouldReverify = (currentTime:number, lastVerified:number, verified:boolean):boolean => {
  if (lastVerified === 0) {
    return true;
  } else if (!verified && currentTime - lastVerified > 86400) {
    return true;
  } else if (verified && currentTime - lastVerified > 1209600) {
    return true;
  }
  return false;
};

const verifyIfNeeded = async (assetDB, assetDoc:AssetDoc) => {
  const currentTime = Math.round((new Date()).getTime() / 1000);
  const lastVerified = assetDoc.lastVerified || 0;
  const verified = assetDoc.verified || false;
  const assetId = parseInt(assetDoc._id);
  const reverify = shouldReverify(currentTime, lastVerified, verified);
  if (reverify) {
    console.log('Fetching asset info from algo explorer for verification! ' + assetDoc._id);
    const algoExplorerUrl = process.env.ALGORAND_NETWORK == 'testnet' ? 
      'https://indexer.testnet.algoexplorerapi.io/v2/assets/' + assetId :
      'https://indexer.algoexplorerapi.io/v2/assets/' + assetId;
    const algoExplorerRes = (await axios.get(algoExplorerUrl)).data;
    console.log({algoExplorerRes});
    const verified = !!(algoExplorerRes?.asset?.verification);
    assetDoc.verified = verified;
    assetDoc.lastVerified = currentTime;
    await assetDB.put(assetDoc);
  }
};

module.exports = ({queues, databases}) =>{
  const assetDB = databases.assets;
  // Lighten the load on the broker and do batch processing
  console.log({assetDB});
  console.log('in assets-worker.js');
  const indexer = initOrGetIndexer();

  const assetsWorker = new Worker(convertQueueURL('assets'), async job=>{
    console.log('got assets job ', {assetId: job.data.assetId});
    await waitForViewBuildingSimple();
    withQueueSchemaCheck('asset', job.data);
    const assetInCouch = await getAssetInCouch(assetDB, job.data.assetId);
    if (assetInCouch) {
      await verifyIfNeeded(assetDB, assetInCouch);
      return;
    }
    const assetData = await indexer.lookupAssetByID(job.data.assetId)
        .includeAll().do();
    assetData.verified = false;
    assetData.lastVerified = 0; // Never verified, so set to 0
    return assetDB.post(withSchemaCheck('assets', {_id: `${job.data.assetId}`,
      type: 'asset', ...assetData}))
        .then(async function(response) {
          console.debug({
            msg: `Asset ${job.data.assetId} stored`,
          });
          const assetInCouch = await getAssetInCouch(assetDB, job.data.assetId);
          await verifyIfNeeded(assetDB, assetInCouch);
        }).catch(function(err) {
          if (err.error === 'conflict') {
            console.log('asset already added');
          } else {
            throw err;
          }
        });
  }, {connection: queues.connection, concurrency: 250});

  assetsWorker.on('error', err => {
    console.error( {err} );
  });
};

export {};
