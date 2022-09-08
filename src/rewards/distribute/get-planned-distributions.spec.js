
const {getPlannedDistributions} = require('./vest-distribute-rewards');
// const {DistributeRewardsInput} = require('./vest-distribute-rewards-schema');
// const fs = require('fs');
const algosdk = require('algosdk');

const getAlgod = require('../../algod');
const getIndexer = require('../../get-indexer');
// import * as PouchDB from 'pouchdb';


// // const getAlgod = require('../src/algod');
// const getDatabases = require('../src/db/get-databases');
// const getIndexer = require('../src/get-indexer');

// const distributeRewards =
//   require('../src/rewards/distribute/vest-distribute-rewards');

test('gets planned distributions', async () => {
  const algodClient = getAlgod();
  const indexer = getIndexer();
  // const database = getDatabases().rewards;
  // const inputFile = 'NA';
  // const amount = 24141;
  const distributeNetwork = 'mainnet';
  const mnemonic = process.env.REWARDS_WALLET_MNEMONIC;
  const accrualNetwork = 'mainnet';
  const assetId = parseInt(process.env.ALGX_ASSET_ID);
  const epoch = 2;
  const account = algosdk.mnemonicToSecretKey(mnemonic);

  const input = {
    algodClient, distributeNetwork, indexer,
    fromAccount: account, accrualNetwork, sendAssetId: assetId, epoch,
  };
  const plannedDists = await getPlannedDistributions(input);
  // console.log({plannedDists});
  expect(plannedDists.length > 0);
});
