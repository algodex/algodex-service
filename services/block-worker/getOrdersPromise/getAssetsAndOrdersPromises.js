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

const getAssetQueuePromise = require('./getAssetQueuePromise');

const getAssetsAndOrdersPromises = ({queues, validRows, blockData}) => {
  const assetIdSet = {};
  return validRows.reduce( (allPromises, row) => {
    const assetId = row.value.assetId;
    if (!('assetId:assetIds' in assetIdSet)) {
      assetIdSet[assetId] = 1;
      const assetAddPromise = getAssetQueuePromise(
          queues.assets,
          assetId,
      );
      console.log('creating asset add promise: ' + assetId);
      allPromises.push(assetAddPromise);
    }

    const account = row.key[0];

    const ordersJob = {account: account,
      blockData: blockData, reducedOrder: row};
    console.log('queuing order: ' + ordersJob.account + ' ' +
      ordersJob.blockData.rnd);

    const promise = queues.orders.add('orders', ordersJob,
        {removeOnComplete: true}).catch(function(err) {
      console.error('error adding to orders queue:', {err} );
      throw err;
    });
    allPromises.push(promise);
    return allPromises;
    // //console.log('adding to orders');
  }, []);
};

module.exports = getAssetsAndOrdersPromises;
