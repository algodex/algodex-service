
const getEscrowAndTimeToBalance = (escrows) => {
  const escrowTimeMap = escrows.reduce( (escrowTimeMap, escrow) => {
    escrow.data.history.forEach((historyItem) => {
      const time = historyItem.time;
      const balance = escrow.data.escrowInfo.isAlgoBuyEscrow ?
        historyItem.algoAmount : historyItem.asaAmount;
      const key = escrow._id+':'+time;
      escrowTimeMap[key] = balance;
    });
    return escrowTimeMap;
  }, {});
  return escrowTimeMap;
};

module.exports = getEscrowAndTimeToBalance;
