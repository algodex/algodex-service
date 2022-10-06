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
const withSchemaCheck = require('../src/schema/with-db-schema-check');
const pushHistory = require('../src/push-history');
const convertQueueURL = require('../src/convert-queue-url');
const withQueueSchemaCheck = require('../src/schema/with-queue-schema-check');
const sleep = require('../src/sleep');
const throttle = require('lodash.throttle');
const {waitForViewBuildingSimple} = require('./waitForViewBuilding');
const axios = require('axios').default;

const Worker = bullmq.Worker;
// const algosdk = require('algosdk');

/*

-const setAssetHistory = data => {
-  if (!data.escrowInfo.isAlgoBuyEscrow) {
-    const historyEntry = {
-      asaAmount: data.indexerInfo.asaAmount,
-      round: data.lastUpdateRound,
-      time: data.lastUpdateUnixTime,
-    };
-    pushHistory(data, historyEntry);
-  } else {
-    const historyEntry = {
-      algoAmount: data.indexerInfo.algoAmount,
-      round: data.lastUpdateRound,
-      time: data.lastUpdateUnixTime,
-    };
-    pushHistory(data, historyEntry);

*/

const createHistoryEntry = jobData => {
  const historyEntry = {
    round: jobData.lastUpdateRound,
    time: jobData.lastUpdateUnixTime,
  };

  if (!jobData.escrowInfo.isAlgoBuyEscrow) {
    historyEntry.asaAmount = jobData.indexerInfo.asaAmount;
  } else {
    historyEntry.algoAmount = jobData.indexerInfo.algoAmount;
  }
  return historyEntry;
};

const activelyUpdatingOrderSet = new Set();

// Delete the cache of the reverse proxy so it gets refreshed again
// Example:
// curl http://localhost:8000/orders/asset/31566704
//      -H 'Clear-Cache: True' -H 'Clear-Cache-Key: MySecretKey'
const deleteCache = async (ownerAddr, assetId) => {
  const reverseProxyAddr = process.env.CACHE_REVERSE_PROXY_SERVER;

  const headers = {'Clear-Cache': true,
    'Clear-Cache-Key': process.env.CACHE_REVERSE_PROXY_KEY};

  const clearCacheUrls = [
    `${reverseProxyAddr}/orders/asset/${assetId}`,
    `${reverseProxyAddr}/orders/wallet/${ownerAddr}`,
  ];

  const clearCachePromises = clearCacheUrls.map(url => axios({
    method: 'get',
    url: url,
    timeout: 3000,
    headers,
  }));
  await Promise.all(clearCachePromises);
};

module.exports = ({queues, databases}) =>{
  const formattedEscrowDB = databases.formatted_escrow;
  const assetDB = databases.assets;
  const verifiedDB = databases.verified_account;

  // Lighten the load on the broker and do batch processing
  console.log({formattedEscrowDB});
  console.log('in formatted-order-worker.js');

  const formattedOrderWorker = new Worker(convertQueueURL('formattedEscrows'),
      async job=>{
        console.log('got formatted escrows job ', {data: job.data});
        withQueueSchemaCheck('formattedEscrows', job.data);
        await waitForViewBuildingSimple();

        const assetId = job.data.escrowInfo.assetId;
        const addr = job.data.indexerInfo.address;
        const data = job.data;
        const ownerAddr = job.data.escrowInfo.ownerAddr;

        const assetGetPromise = assetDB.get(assetId)
            .then(async function(res) {
              console.log({res});
              data.assetDecimals = res.asset.params.decimals;
              while (activelyUpdatingOrderSet.has(addr)) { // TODO: move to Redis
                throttle(() => {
                  console.log('sleeping waiting for ' + addr);
                }, 1000);

                // Prevents document update conflicts when trying to
                // update the same address at once
                await sleep(25);
              }
              activelyUpdatingOrderSet.add(addr);
              const formattedOrderGet = formattedEscrowDB.get(addr).then(
                  async function(res) {
                    const historyEntry = createHistoryEntry(data);
                    pushHistory(res.data, historyEntry);

                    data.history = res.data.history;
                    if (!data.escrowInfo.version) {
                      const verifiedAccount = await verifiedDB.get(addr);
                      const version = verifiedAccount.version;
                      data.escrowInfo.version = version;
                    }
                    if (data.escrowInfo.block && res.data.escrowInfo.block &&
                  data.escrowInfo.block < res.data.escrowInfo.block) {
                      data.escrowInfo = res.data.escrowInfo;
                      data.lastUpdateUnixTime = res.data.lastUpdateUnixTime;
                      data.lastUpdateRound = res.data.lastUpdateRound;
                    }
                    if (data.indexerInfo.round && res.data.indexerInfo.round &&
                  data.indexerInfo.round < res.data.indexerInfo.round) {
                      data.indexerInfo = res.data.indexerInfo;
                    }
                    // eslint-disable-next-line max-len
                    return formattedEscrowDB.put(withSchemaCheck('formatted_escrow', {
                      _id: res._id,
                      _rev: res._rev,
                      data,
                    })).then(function(res) {
                      console.log('added doc revision: ' + data);
                      deleteCache(ownerAddr, assetId);
                      activelyUpdatingOrderSet.delete(addr);
                    }).catch(function(err) {
                      console.error('error 442b', err);
                      activelyUpdatingOrderSet.delete(addr);
                      throw err;
                    });
                  }).catch(function(err) {
                if (err.error === 'not_found') {
                  const historyEntry = createHistoryEntry(data);
                  pushHistory(data, historyEntry);
                  return formattedEscrowDB.post(
                      withSchemaCheck('formatted_escrow', {_id: `${addr}`,
                        type: 'formatted_escrow', data: data}))
                      .then(function(response) {
                        console.log('posted formatted escrow');
                        deleteCache(ownerAddr, assetId);
                        activelyUpdatingOrderSet.delete(addr);
                      }).catch(function(err) {
                        console.error('error 445b', err);
                        activelyUpdatingOrderSet.delete(addr);
                        throw err;
                      });
                } else {
                  activelyUpdatingOrderSet.delete(addr);
                  console.error('error 442a', err);
                  throw err;
                }
              });
              return formattedOrderGet;
            }).catch(function(err) {
              console.error('Error fetching asset: '+ assetId, err);
              throw err;
            });

        return assetGetPromise;
      }, {connection: queues.connection, concurrency: 250});

  formattedOrderWorker.on('error', err => {
    console.error( {err} );
  });
};

