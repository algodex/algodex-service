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

const verifyContracts = require('../../src/verify-contracts');
const {addMetadata} = require('./orderMetadata');

const getAssetsAndOrdersPromises =
  require('./getOrdersPromise/getAssetsAndOrdersPromises');
const removeEarliestRound = require('./getOrdersPromise/removeEarliestRound');

const getOrdersPromise = ({databases, queues, dirtyAccounts, blockData}) => {
  return databases.blocks.query('blocks/orders',
      {reduce: true, group: true, keys: dirtyAccounts})
      .then(async function(res) {
        // This below situation occurs during testing. Basically, the
        // known earliest round is after the current round because
        // the block where the order was initialized
        // wasn't yet in the database. So, filter any unknown orders

        res.rows = removeEarliestRound(res.rows, blockData.rnd);
        await addMetadata(blockData.rnd, 'order', res.rows.length > 0);

        if (!res.rows.length) {
          return;
        }
        const accountsToVerify = res.rows;

        console.log('verifying ' + blockData.rnd,
            JSON.stringify(accountsToVerify));

        const validRows = await verifyContracts(res.rows,
            databases.verified_account);
        console.log('got valid rows: ' + JSON.stringify(validRows));

        const assetsAndOrdersPromises =
          getAssetsAndOrdersPromises({queues, validRows, blockData});
        return Promise.all(assetsAndOrdersPromises);
      }).catch(function(err) {
        if (err.error === 'not_found') {
          // //console.log('not found');
          throw err;
        } else {
          console.error('likely reducer error!!!', err);
          throw err;
        }
      });
};

module.exports = getOrdersPromise;
