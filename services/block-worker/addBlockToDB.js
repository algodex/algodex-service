const addBlockToDB = async round => {
  try {
    await blocksDB.get(`${round}`);
  } catch (e) {
    if (e.error === 'not_found') {
      try {
        await blocksDB.post(withSchemaCheck('blocks', {_id: `${round}`,
          type: 'block', ...job.data}));
        console.debug({
          msg: `Block stored`,
          ...response,
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
