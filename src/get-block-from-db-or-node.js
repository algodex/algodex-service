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

