#!/usr/bin/env node
const args = require('minimist')(process.argv.slice(2));
const getAlgod = require('../src/algod');
const getDatabases = require('../src/db/get-databases');
const getIndexer = require('../src/get-indexer');
const { distributeRewards } =
  require('../src/rewards/distribute/vest-distribute-rewards');
const algosdk = require('algosdk');

import {DistributeRewardsInput} from '../src/rewards/distribute/vest-distribute-rewards-schema';

/* Usage
 *
 * ./vest-and-distribute-rewards [--dryRunWithDBSave] [--removeOldFirst]
 */

const initAndDistribute = async () => {
  const algodClient = getAlgod();
  const distributeNetwork = process.env.ALGORAND_NETWORK;
  const mnemonic = process.env.REWARDS_WALLET_MNEMONIC;
  const assetId = process.env.ALGX_ASSET_ID;
  const dryRunWithDBSave = args.dryRunWithDBSave;
  const removeOldFirst = args.removeOldFirst;

  if (!mnemonic) {
    throw new Error('no mnemonic defined');
  }
  if (!assetId) {
    throw new Error('no assetId defined');
  }
  const account = algosdk.mnemonicToSecretKey(mnemonic);
  const indexer = getIndexer();

  const config:DistributeRewardsInput = {algodClient,
    distributeNetwork, indexer,
    dryRunWithDBSave, removeOldFirst,
    fromAccount: account, sendAssetId: parseInt(assetId)};

  printIntro(config);
  distributeRewards(config);
};

const printIntro = config => {
  const copy = JSON.parse(JSON.stringify(config));
  delete copy.rewardsDB;
  delete copy.indexer;
  delete copy.wallets;
  copy.fromWallet = copy.fromAccount.addr;
  delete copy.fromAccount;
  console.log('ALGODEX REWARDS DISTRIBUTION');
  console.log('CONFIG:', JSON.stringify(copy));
};


process.on('SIGINT', async function() {
  console.log('Caught interrupt signal');
  globalThis.isGloballyShuttingDown = true;
});


initAndDistribute();

export {};
