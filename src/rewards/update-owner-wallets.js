
const getOwnerBalanceAtTime = require('./get-owner-balance-at-time');

const updateOwnerWallets = ({ownerWalletToALGXBalance,
  ownerWalletsBalanceChangeSet, ownerBalanceToHist, timestep}) => {
  Array.from(ownerWalletsBalanceChangeSet).forEach((wallet) => {
    const balance = getOwnerBalanceAtTime(ownerBalanceToHist, wallet,
        timestep);
    ownerWalletToALGXBalance[wallet] = balance || 0;
  });
};

module.exports = updateOwnerWallets;
