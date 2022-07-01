
const getOwnerWalletChangeTimes = (ownerBalanceToHist) => {
  const timeSet = Object.values(ownerBalanceToHist).reduce( (set, history) => {
    history.forEach( (item) => set.add(item.time));
    return set;
  }, new Set());
  return Array.from(timeSet).sort();
};

module.exports = getOwnerWalletChangeTimes;
