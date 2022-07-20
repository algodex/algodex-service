const process = require('node:process');

const getChangedAccountValues = (ownerToBalanceWithRounds, block) => {
  if (!block.txns) {
    return [];
  }
  const algxAssetId = process.env.ALGX_ASSET_ID;
  if (algxAssetId === undefined) {
    throw new Error('process.env.ALGX_ASSET_ID is not defined!');
  }

  const ownerToBalance = Array.from(ownerToBalanceWithRounds.entries())
      .reduce((map, entry) => {
        map.set(entry[0], entry[1].balance);
        return map;
      }, new Map());

  const newOwnerToBalance = block.txns.map(txn => txn.txn)
      .filter(txn => txn.type === 'axfer')
      .filter(txn => txn.xaid === parseInt(algxAssetId))
      .reduce((ownerToBalance, txn) => {
        // aamt, //arcv, snd, aclose
        const sender = txn.snd;
        const receiver = txn.arcv;
        const aclose = txn.aclose;
        let senderBalance = ownerToBalance.get(sender) || 0;
        let receiverBalance =
          receiver ? (ownerToBalance.get(receiver) || 0) : 0;
        let closeReceiverBalance =
          aclose ? (ownerToBalance.get(aclose) || 0) : 0;
        const amount = txn.aamt || 0;

        receiverBalance += amount;
        closeReceiverBalance += Math.max(0, (senderBalance - amount));
        senderBalance = Math.max(0, senderBalance - amount);
        if (aclose) {
          senderBalance = 0;
          ownerToBalance.set(aclose, closeReceiverBalance);
        }
        if (sender) {
          ownerToBalance.set(sender, senderBalance);
        }
        if (receiver) {
          ownerToBalance.set(receiver, receiverBalance);
        }
        return ownerToBalance;
      }, new Map(ownerToBalance));
  if (newOwnerToBalance.size === 0) {
    return [];
  }
  const keys = Array.from(newOwnerToBalance.keys());
  const changedAccounts = keys.reduce((set, key) => {
    if (newOwnerToBalance.get(key) !== ownerToBalance.get(key)) {
      set.add(key);
    }
    return set;
  }, new Set());
  const retarr = Array.from(changedAccounts)
      .filter(account => newOwnerToBalance.has(account))
      .map(account => {
        if (typeof newOwnerToBalance.get(account) === 'object') {
          throw new Error('incorrect type');
        }
        return {
          account,
          balance: newOwnerToBalance.get(account) || 0,
        };
      });
  return retarr;
};

module.exports = getChangedAccountValues;
