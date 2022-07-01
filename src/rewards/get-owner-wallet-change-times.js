
const getOwnerWalletChangeTimes = (ownerBalanceToHist) => {
  return Object.values(ownerBalanceToHist).reduce( (set, entry) => {
    set.add(entry.time);
    return set;
  }, new Set());
};

module.exports = getOwnerWalletChangeTimes;
