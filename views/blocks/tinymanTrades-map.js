module.exports = function(doc) {
  const groupsWithUsdcTrade = doc.txns
      .map(txn => txn.txn)
      .filter(txn => txn.apid === '<TINYMAN_APP>')
      .filter(txn => {
        return true;
      })
      .filter(txn => txn.grp !== undefined)
      .reduce((obj, txn) => {
        const grp = txn.grp;
        obj[grp] = 1;
        return obj;
      }, {});

  const allGroups = doc.txns
      .filter(txn => groupsWithUsdcTrade.hasOwnProperty(txn.txn.grp))
      .reduce((allGroups, txn) => {
        const txnGroup = txn.txn.grp;
        if (txnGroup === undefined) {
          return allGroups;
        }

        const groupTxnArr = (allGroups[txnGroup] || []);
        groupTxnArr.push(txn);
        allGroups[txnGroup] = groupTxnArr;
        return allGroups;
      }, {});

  Object.values(allGroups).forEach(group => {
    if (group.length !== 4) {
      return;
    }
    const poolXferAmount = group[3].txn.amt || group[3].txn.aamt;
    const userXferAmount = group[2].txn.amt || group[2].txn.aamt;
    const poolXferType = group[3].txn.type;
    const userXferType = group[2].txn.type;
    const poolXferAssetId = group[3].txn.xaid || 1;
    const userXferAssetId = group[2].txn.xaid || 1;
    if ((poolXferType === 'pay' && userXferType === 'axfer') ||
    (poolXferType === 'axfer' && userXferType === 'pay')) {
      const asset1 = Math.min(poolXferAssetId, userXferAssetId);
      const asset2 = Math.max(poolXferAssetId, userXferAssetId);
      emit([asset1, asset2, doc.ts], {round: doc.rnd, poolXferAssetId,
        userXferAssetId,
        unix_time: doc.ts, poolXferType, poolXferAmount,
        userXferAmount, userXferType});
    }
  });
};
