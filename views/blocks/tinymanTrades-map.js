module.exports = function(doc) {
  const groupsWithUsdcTrade = doc.txns
      .map(txn => txn.txn)
      .filter(txn => txn.apid === 62368684)
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
    const assetId = group[2].txn.xaid || group[3].txn.xaid;
    if ((poolXferType === 'pay' && userXferType === 'axfer') ||
    (poolXferType === 'axfer' && userXferType === 'pay')) {
      emit([assetId, doc.ts], {round: doc.rnd, assetId,
        unix_time: doc.ts, poolXferType, poolXferAmount,
        userXferAmount, userXferType});
    }
  });
};
