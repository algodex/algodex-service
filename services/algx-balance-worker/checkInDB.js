
const checkInDB = async (algxBalanceDB, round) => {
  try {
    const isInDB = await algxBalanceDB.get(''+round);
    if (isInDB) {
      return true;
    }
  } catch (e) {
    if (e.error === 'not_found') {
      return false;
    } else {
      throw e;
    }
  }
  return false;
};

module.exports = checkInDB;
