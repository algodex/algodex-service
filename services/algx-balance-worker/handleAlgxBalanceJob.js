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

const addBalanceToDB = require('./addBalanceToDB');
const checkInDB = require('./checkInDB');
const sleep = require('../../src/sleep');
const hasAlgxChanges = require('./hasAlgxChanges');
const getCurrentBalanceMap =
  require('./getCurrentBalanceMap');
const getChangedAccountValues =
  require('./getChangedAccountValues');
const getDirtyAccounts = require('../../src/get-dirty-accounts');
// eslint-disable-next-line max-len
const withQueueSchemaCheck = require('../../src/schema/with-queue-schema-check');
const throttle = require('lodash.throttle');
const {UnrecoverableError} = require('bullmq');


// let hasMoreThanOneDoc = false;

// const checkHasMoreThanOneDoc = async db => {
//   if (hasMoreThanOneDoc) {
//     return true;
//   }
//   const docCount = await db.info().then(info => info.doc_count);
//   if (docCount === 1) {
//     // Only one doc is stored which is the _design/algx_balance.
//     // No blocks are stored.
//     return false;
//   }

//   if (!docCount) {
//     throw new Error('null docCount!');
//   }

//   hasMoreThanOneDoc = true;
//   return true;
// };

// const waitForLastRound = async (algxBalanceDB, lastRound) => {
//   const genesisRound = process.env.INTEGRATION_TEST_MODE ? 16583454 :
//   parseInt(process.env.GENESIS_LAUNCH_BLOCK);

//   if (lastRound === genesisRound - 1) {
//     return;
//   }

//   do {
//     try {
//       await algxBalanceDB.get(`${lastRound}`);
//       break;
//     } catch (e) {
//       if (e.error === 'not_found') {
//         throttle(() => {
//           console.log(`sleeping waiting for block ${lastRound}`);
//         }, 1000);
//         await sleep(25);
//       }
//     }
//   } while (1);
// };


const handleAlgxBalanceJob = async (job, algxBalanceDB) => {
  const block = job.data;
  const round = job.data.rnd;
  console.log(`Got balance job! Round: ${round}`);
  withQueueSchemaCheck('algxBalance', job.data);
  // } catch (e) {
  //  throw new UnrecoverableError(e);
  // }
  if (!hasAlgxChanges(job.data)) {
    return;
  }
  const isInDB = await checkInDB(algxBalanceDB, round);
  if (isInDB) {
  // Nothing to do
    return;
  }

  // Not necessary since only doing one job in parallel
  // await waitForLastRound(algxBalanceDB, round - 1);

  const dirtyAccounts = getDirtyAccounts(block);
  const ownerToLastBalance =
  await getCurrentBalanceMap(algxBalanceDB, dirtyAccounts);
  const changedAccountData =
  getChangedAccountValues(ownerToLastBalance, block);

  if (changedAccountData.length > 0) {
    console.log('has changes!');
  }
  await addBalanceToDB(algxBalanceDB, {
    _id: round+'',
    changes: changedAccountData,
    unix_time: block.ts,
  });
};

module.exports = handleAlgxBalanceJob;
