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

const {getBlock} = require('../src/explorer');
const addBlockToDB = require('../services/block-worker/addBlockToDB');

module.exports = async (blocksDB, round) => {
  try {
    const block = await blocksDB.get(round);
    console.log('Got ' + round + ' block from DB');
    return block;
  } catch (e) {
    if (e.error === 'not_found') {
      console.error('block not found in DB! Fetching from Algorand node');
    } else {
      throw e;
    }
  }
  // Not in couchdb, so get from Algorand node
  try {
    const block = await getBlock({round});
    await addBlockToDB(blocksDB, round, block);

    console.log('Got ' + round + ' block from Algorand node');
    return block;
  } catch (e) {
    console.error('Could not get block from node!');
    throw e;
  }
};

