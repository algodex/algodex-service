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
