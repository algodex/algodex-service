/* eslint-disable camelcase */
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
        map.set(entry[0], {
          address: entry[0],
          amount: entry[1].balance,
        });
        return map;
      }, new Map());

  const createEmptyOwnerBalance = address => {
    return {
      address,
      amount: 0,
    };
  };
  const newOwnerToBalance = block.txns.map(txn => txn.txn)
      .filter(txn => txn.type === 'axfer')
      .filter(txn => txn.xaid === parseInt(algxAssetId))
      .reduce((ownerToBalance, txn) => {
        // aamt, //arcv, snd, aclose
        const sender = txn.snd;
        const receiver = txn.arcv;
        const aclose = txn.aclose;

        const senderBalance = ownerToBalance.get(sender) ||
          createEmptyOwnerBalance(sender);
        ownerToBalance.set(sender, senderBalance);
        const receiverBalance = ownerToBalance.get(receiver) ||
          createEmptyOwnerBalance(receiver);
        if (receiver) {
          ownerToBalance.set(receiver, receiverBalance);
        }
        const closeReceiverBalance = ownerToBalance.get(aclose) ||
          createEmptyOwnerBalance(aclose);
        if (aclose) {
          ownerToBalance.set(aclose, closeReceiverBalance);
        }

        const amount = txn.aamt || 0;

        receiverBalance.amount += amount;
        senderBalance.amount -= amount;
        if (aclose) {
          const closeAmount = senderBalance.amount;
          closeReceiverBalance.amount += closeAmount;
          senderBalance.amount -= closeAmount;
        }
        return ownerToBalance;
      }, new Map(JSON.parse(
          JSON.stringify(Array.from(ownerToBalance)),
      )));
  if (newOwnerToBalance.size === 0) {
    return [];
  }
  const keys = Array.from(newOwnerToBalance.keys());
  const changedAccounts = keys.reduce((set, key) => {
    if (newOwnerToBalance.get(key).amount !== ownerToBalance.get(key)?.amount) {
      set.add(key);
    }
    return set;
  }, new Set());
  const retarr = Array.from(changedAccounts)
      .filter(account => newOwnerToBalance.has(account))
      .filter(account => newOwnerToBalance.get(account).amount > 0)
      .map(account => {
        if (typeof newOwnerToBalance.get(account) !== 'object') {
          throw new Error('incorrect type');
        }
        return {
          account,
          balance: newOwnerToBalance.get(account).amount,
        };
      });
  return retarr;
};

module.exports = getChangedAccountValues;
