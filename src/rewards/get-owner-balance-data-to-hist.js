
const getDatabases = require('../../src/db/get-databases');
const databases = getDatabases();

const getOwnerBalanceDataToHist = async (ownerBalanceData) => {
  const blockSet = ownerBalanceData.rows.reduce(
      (set, row) => set.add(row.value.block), new Set());

  const blockDB = databases.blocks;
  const timesData = await blockDB.query('blocks/blockToTime', {
    keys: Array.from(blockSet)});
  const blockToTime = timesData.rows.reduce((map, row) => {
    map[`rnd:${row.key}`] = row.value;
    return map;
  }, {});

  return ownerBalanceData.rows.reduce( (ownerToHist, row) => {
    const owner = row.key;
    const algxBalance = row.value.balance;
    const block = parseInt(row.value.block);
    const time = blockToTime[`rnd:${block}`];
    if (ownerToHist[owner] === undefined) {
      ownerToHist[owner] = [];
    }
    const entry = {
      round: block,
      time,
      algxBalance,
    };
    ownerToHist[owner].push(entry);
    return ownerToHist;
  }, {});
};

module.exports = getOwnerBalanceDataToHist;
