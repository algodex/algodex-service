#!/usr/bin/env node
const fs = require('fs');
const args = require('minimist')(process.argv.slice(2));
const getAlgod = require('../src/algod');
const getDatabases = require('../src/db/get-databases');
const getIndexer = require('../src/get-indexer');
const distributeRewards =
  require('../src/rewards/distribute/vest-distribute-rewards');
const algosdk = require('algosdk');

import {DistributeRewardsInput} from '../src/rewards/distribute/vest-distribute-rewards-schema';

/* Usage
 *
 * ./vest-and-distribute-rewards --inputFile=<file> --amount=<amount of ALGX>
 *                      --epoch=<epoch> --accrualNetwork=<testnet|mainnet>
 */

const initAndDistribute = async () => {
  const algodClient = getAlgod();
  const databases = getDatabases();
  const inputFile = args.inputFile;
  const amount = parseFloat(args.amount);
  const distributeNetwork = process.env.ALGORAND_NETWORK;
  const mnemonic = process.env.REWARDS_WALLET_MNEMONIC;
  const accrualNetwork = args.accrualNetwork;
  const assetId = process.env.ALGX_ASSET_ID;
  const epoch = args.epoch;

  if (!inputFile) {
    throw new Error('No input file defined!');
  }
  if (!amount) {
    throw new Error('No amount defined!');
  }
  if (!accrualNetwork) {
    throw new Error('no network defined');
  }
  if (!epoch) {
    throw new Error('no epoch defined');
  }
  if (!mnemonic) {
    throw new Error('no mnemonic defined');
  }
  if (!accrualNetwork) {
    throw new Error('no accrualNetwork defined');
  }
  if (!assetId) {
    throw new Error('no assetId defined');
  }
  const account = algosdk.mnemonicToSecretKey(mnemonic);
  const data = fs.readFileSync(inputFile, 'utf8');
  const wallets = data.split('\n').filter(line => line.length > 0);
  const indexer = getIndexer();

  const config:DistributeRewardsInput = {epoch, algodClient,
    distributeNetwork, indexer,
    accrualNetwork,
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
