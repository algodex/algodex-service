#!/usr/bin/env node

/* 
 * Algodex Service 
 * Copyright (C) 2022 Algodex VASP (BVI) Corp.
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

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
