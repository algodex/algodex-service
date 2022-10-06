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

const getDatabases = require('../../src/db/get-databases');
const withSchemaCheck = require('../../src/schema/with-db-schema-check');

const databases = getDatabases();

type ChangesType = 'order' | 'algx_balance';

interface DBViewEntry {
  key: number,
  value: MetadataDbDoc
}

interface MetadataDbDoc {
  _id?: string,
  _rev?: string,
  hasChanges: boolean,
  changesType: ChangesType,
}

const addMetadata = async (round:number, changesType: ChangesType, hasChanges: boolean) => {
  const metadata:MetadataDbDoc = {
    _id: `${changesType}:${round}`,
    changesType,
    hasChanges
  };

  const metadataDB = databases.block_custom_metadata;
  try {
    await metadataDB.put(withSchemaCheck('block_custom_metadata', metadata));
  } catch (e) {
    if (e.error !== 'conflict') {
      console.error(e);
      throw e;
    }
  }
}

const getRoundsWithNoDataSets = async (minRound: number, maxRound: number): Promise<Map<number,Set<ChangesType>>> => {
  const metadataDB = databases.block_custom_metadata;

  const roundsWithNoData =
  await metadataDB.query('block_custom_metadata/blocks_without_changes',
      {startkey: minRound, endkey: maxRound} );

  const retmap = roundsWithNoData.rows.reduce((map:Map<number,Set<ChangesType>>, entry:DBViewEntry) => {
    const changesType = entry.value.changesType;
    const round = entry.key;

    if (!map.has(round)) {
      map.set(round, new Set<ChangesType>);
    }
    const set = map.get(round);
    set.add(changesType);
    return map;
  }, new Map<number,Set<ChangesType>>);

  // const set:Set<ChangesType> = new Set(roundsWithNoData.rows.map(row => row.key));

  return retmap;
}
module.exports = {addMetadata, getRoundsWithNoDataSets}