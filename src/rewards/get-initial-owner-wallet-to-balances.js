// eslint-disable-next-line max-len
const getOwnerBalanceAtTime = require('./get-owner-balance-at-time');

const getInitialOwnerWalletToBalances = (time, ownerBalanceToHist) => {
  return Object.keys(ownerBalanceToHist).reduce( (map, ownerAddr) => {
    const balance = getOwnerBalanceAtTime(ownerBalanceToHist, ownerAddr, time);
    map[ownerAddr] = balance;
    return map;
  }, {});
};

module.exports = getInitialOwnerWalletToBalances;
