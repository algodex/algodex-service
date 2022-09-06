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

module.exports = {addOrderMetadata}