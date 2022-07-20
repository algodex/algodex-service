const withSchemaCheck = require('../../src/schema/with-db-schema-check');

const addBlockToDB = async (blocksDB, round, blockData) => {
  try {
    await blocksDB.get(`${round}`);
  } catch (e) {
    if (e.error === 'not_found') {
      try {
        await blocksDB.post(withSchemaCheck('blocks', {_id: `${round}`,
          type: 'block', ...blockData}));
        console.debug({
          msg: `Block stored`, round: `${round}`,
        });
      } catch (err) {
        if (err.error === 'conflict') {
          console.error('already added! Still not supposed to happen');
        } else {
          throw err;
        }
      }
    }
  }
};

module.exports = addBlockToDB;
