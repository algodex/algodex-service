const getDatabases = require('../../src/db/get-databases');
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
    await metadataDB.put(metadata);
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
      {startKey: minRound, endKey: maxRound} );

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