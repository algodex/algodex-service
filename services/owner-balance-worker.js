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

const bullmq = require('bullmq');
const Worker = bullmq.Worker;
// const algosdk = require('algosdk');
const initOrGetIndexer = require('../src/get-indexer');
const withSchemaCheck = require('../src/schema/with-db-schema-check');
const convertQueueURL = require('../src/convert-queue-url');
const getAlgxBalance = require('./owner-balance-worker/getAlgxBalance');
const {waitForViewBuildingSimple} = require('./waitForViewBuilding');

const checkInDB = async (ownerBalanceDB, ownerAddr, round) => {
  try {
    const isInDB = await ownerBalanceDB.get(ownerAddr+'-'+round);
    if (isInDB) {
      return true;
    }
  } catch (e) {
    if (e.error === 'not_found') {
      return false;
    } else {
      throw e;
    }
  }
  return false;
};

const addBalanceToDB = async (ownerBalanceDB, doc) => {
  try {
    await ownerBalanceDB.put(withSchemaCheck('owner_balance', doc));
  } catch (err) {
    if (err.error === 'conflict') {
      console.error(err);
    } else {
      throw err;
    }
  }
};

module.exports = ({queues, databases}) =>{
  if (!process.env.ALGX_ASSET_ID) {
    throw new Error('ALGX_ASSET_ID is not set!');
  }
  const ownerBalanceDB = databases.owner_balance;
  const indexerClient = initOrGetIndexer();

  const ownerBalanceWorker = new Worker(convertQueueURL('ownerBalance'), async job=>{
    const ownerAddr = job.data.ownerAddr;
    const round = job.data.roundStr;
    console.log(`Got job! Round: ${round} OwnerAddr: ${ownerAddr}`);
    await waitForViewBuildingSimple();

    const isInDB = await checkInDB(ownerBalanceDB, ownerAddr, round);
    if (isInDB) {
      // Nothing to do
      return;
    }

    let accountInfo;
    try {
      accountInfo = await indexerClient.lookupAccountByID(ownerAddr)
          .round(round).includeAll(true).do();
    } catch (e) {
      if (e.status === 500 &&
        (e.message.includes('not currently supported') ||
        e.message.includes('is not supported'))) {
        const doc = {
          _id: ownerAddr+'-'+round,
          noAccountInfo: true,
        };
        await addBalanceToDB(ownerBalanceDB, doc);
      } else {
        throw e;
      }
    }
    const algxBalance = getAlgxBalance(accountInfo);
    const doc = {
      _id: ownerAddr+'-'+round,
      assetId: process.env.ALGX_ASSET_ID,
      balance: algxBalance,
    };
    // eslint-disable-next-line max-len
    console.log(`Adding owner balance to DB! Round: ${round} OwnerAddr: ${ownerAddr}`);
    await addBalanceToDB(ownerBalanceDB, doc);
  }, {connection: queues.connection, concurrency: 50});

  ownerBalanceWorker.on('error', err => {
    console.error( {err} );
    throw err;
  });
};

