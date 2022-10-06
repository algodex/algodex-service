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

#!/usr/bin/env node
const fs = require('fs');
const args = require('minimist')(process.argv.slice(2));
const getAlgod = require('../src/algod');
const getDatabases = require('../src/db/get-databases');
const getIndexer = require('../src/get-indexer');
const distributeRewards =
  require('../src/rewards/distribute/distribute-rewards');
const algosdk = require('algosdk');

/* Usage
 *
 * ./distribute-rewards --inputFile=<file> --amount=<amount of ALGX>
 *                      --epoch=<epoch> --accrualNetwork=<testnet|mainnet>
 */

const initAndDistribute = async () => {
  const algodClient = getAlgod();
  const databases = getDatabases();
  const inputFile = args.inputFile;
  const amount = parseFloat(args.amount);
  const network = process.env.ALGORAND_NETWORK;
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
  if (!network) {
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

  const config = {wallets, epoch, algodClient,
    rewardsDB: databases.rewards_distribution, amount: (amount * 10**6),
    network, indexer,
    accrualNetwork,
    fromAccount: account, assetId: parseInt(assetId)};

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
