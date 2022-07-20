
const checkBlockNotSynced = async (syncedBlocksDB, round) => {
  const roundStr = `${round}`;
  try {
    const syncedBlock = await syncedBlocksDB.get(roundStr);
    if (syncedBlock) {
      return; // Already synced, nothing left to do
    }
  } catch (e) {
    if (e.error !== 'not_found') {
      throw e;
    }
  }
};

module.exports = checkBlockNotSynced;
