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
  const blockExistsQuery = await blocksDB.query('blocks/blockToTime',
      {key: `${round}`});

  if (blockExistsQuery.rows.length === 0) {
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
