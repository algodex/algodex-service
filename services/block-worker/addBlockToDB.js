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

const withSchemaCheck = require('../../src/schema/with-db-schema-check');

/**
 * @typedef {Object} aaaaa description
 * @param {number} a description
 * @param {string} b description
 * @param {*} c description
 */

/**
 * @param {aaaaa} blocksDB
 * @param {number} round
 * @param {*} blockData
 * @return {Promise<any>}
 */
const addBlockToDB = async (blocksDB, round, blockData) => {
  console.log('checking if block exists');

  const blockExistsQuery = await blocksDB.query('blocks/blockToTime',
      {key: `${round}`});

  if (blockExistsQuery.rows.length >= 1) {
    console.log('block ' + round + 'already added, returning');
    return;
  }
  try {
    const result =
          await blocksDB.post(withSchemaCheck('blocks', {_id: `${round}`,
            type: 'block', ...blockData}));
    console.debug({
      msg: `Block stored`, round: `${round}`,
    });
    return result;
  } catch (err) {
    if (err.error === 'conflict') {
      // eslint-disable-next-line max-len
      console.error(`already added block ${round}! Still not supposed to happen`);
    } else {
      throw err;
    }
  }
};

module.exports = addBlockToDB;
