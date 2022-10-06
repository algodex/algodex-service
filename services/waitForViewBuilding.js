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

const throttle = require('lodash.throttle');
const axios = require('axios').default;
const sleep = require('../src/sleep');

const waitForViewBuildingSimple = async () => {
  await waitForViewBuilding(null, true, 10);
};

const waitForViewBuilding = async (blocksDB, skipCheckAgain = false, pauseMS=500) => {
  const couchUrl = process.env.COUCHDB_BASE_URL;
  let loop = true;

  const waitLogThrottle = throttle(waitData => {
    console.log('Waiting for DB indexes to rebuild...', {waitData});
  }, 5000);

  while (loop) {
    await axios.get(couchUrl + '/_active_tasks')
        .then(async function(response) {
          // handle success
          if (response.data.length === 0 ||
              response.data.filter(item =>
                // Ignore these types of DB operations since data
                // can still be added and views still work
                item.type !== 'view_compaction' &&
                item.process_status !== 'waiting' &&
                item.type !== 'database_compaction').length === 0) {
            if (!skipCheckAgain) {
              // Try to get max block
              await blocksDB.query('blocks/maxBlock',
                  {reduce: true, group: true});
              // Wait again
              await waitForViewBuilding(blocksDB, true);
            }
            loop = false;
            return;
          } else {
            waitLogThrottle();
          }
        }).catch(function(error) {
          console.error('Unexpected error when fetching active tasks! ',
              error);
        });
    if (!loop) {
      break;
    }
    await sleep(pauseMS);
  }
};

module.exports = {waitForViewBuilding, waitForViewBuildingSimple};

