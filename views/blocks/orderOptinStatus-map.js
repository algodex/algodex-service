// IMPORTANT!! This needs to be orderOptinStatus/orderOptinStatus
// not blocks/orderOptinStatus

module.exports = function(doc) {
  if (typeof(doc.txns) === 'undefined') {
    return;
  }
  const buyAppId = '<ALGODEX_ALGO_ESCROW_APP>';
  const sellAppId = '<ALGODEX_ASA_ESCROW_APP>';

  const getOnCompleteFromApan = apan => {
    if (apan === 1) {
      return 'OptIn';
    } else if (apan === 2) {
      return 'CloseOut';
    } else if (apan === 3) {
      return 'ClearState';
    }
    return 'Unknown';
  };
  const round = doc.rnd;
  let txnCount = 0;
  doc.txns
      .filter(txn => txn.hasOwnProperty('txn'))
      .map(txn => txn.txn)
      .forEach(txn => {
        txnCount++;
        if (txn.apid === buyAppId || txn.apid === sellAppId) {
          const apan = txn.apan;
          const onComplete = getOnCompleteFromApan(apan);
          if (onComplete === 'Unknown') {
            return;
          }
          const orderType = txn.apid === buyAppId ? 'buyOrder' : 'sellOrder';
          const escrowAddr = txn.snd;
          emit(escrowAddr, {
            round, apan, onComplete, orderType, txnCount,
          });
        }
      });
};
