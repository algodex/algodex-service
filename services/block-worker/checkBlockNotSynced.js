
const checkBlockNotSynced = async (syncedBlocksDB, round) => {
  const roundStr = `${round}`;
  try {
    const syncedBlock = await syncedBlocksDB.get(roundStr);
    if (syncedBlock) {
      return true; // Already synced, nothing left to do
    }
  } catch (e) {
    if (e.error !== 'not_found') {
      throw e;
    }
    return false;
  }
};

module.exports = checkBlockNotSynced;
