module.exports = function(doc) {
  if (typeof (doc.txns) === 'undefined') {
    return;
  }
  const getAssetChangeParams = txn => {
    if (txn.type !== 'axfer') {
      return {
        assetChangeType: 'notAssetChangeTxn',
      };
    }
    if (txn.snd === txn.arcv && typeof(txn.aamt) === 'undefined' && typeof(txn.aclose) === 'undefined' ) {
      return {
        sender: txn.snd,
        assetChangeType: 'optIn',
        assetId: txn.xaid,
      };
    }
    if (typeof(txn.aclose) !== 'undefined' ) {
      return {
        sender: txn.snd,
        assetChangeType: 'optOut',
        assetId: txn.xaid,
      };
    }
    return {
      assetChangeType: 'notAssetChangeTxn',
    };
  };

  const round = doc.rnd;
  let txnCount = 0;
  doc.txns
      .filter(txn => txn.hasOwnProperty('txn'))
      .map(txn => txn.txn)
      .forEach(txn => {
        txnCount++;
        const changeParams = getAssetChangeParams(txn);
        if (changeParams.assetChangeType !== 'notAssetChangeTxn') {
          const {assetId, assetChangeType, sender} = changeParams;
          emit(sender+':'+assetId, {
            round, assetId, assetChangeType, txnCount,
          });
        }
      });
};
