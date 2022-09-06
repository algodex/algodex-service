const getDatabases = require('../../src/db/get-databases');
const databases = getDatabases();

interface MetadataDbDoc {
  _id: string,
  _rev?: string,
  has_order_changes: boolean
}

const addOrderMetadata = async (round:number, has_order_changes: boolean) => {
  const metadata:MetadataDbDoc = {
    _id: `${round}`,
    has_order_changes
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

const getRoundsWithNoOrderDataSet = async (minRound: number, maxRound: number): Promise<Set<number>> => {
  const metadataDB = databases.block_custom_metadata;

  const roundsWithNoOrderData =
  await metadataDB.query('block_custom_metadata/blocks_without_order_changes',
      {startKey: minRound, endKey: maxRound} );

  const set:Set<number> = new Set(roundsWithNoOrderData.rows.map(row => row.key));

  return set;
}
module.exports = {addOrderMetadata, getRoundsWithNoOrderDataSet}