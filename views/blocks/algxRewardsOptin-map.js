module.exports = function(doc) {
  // Map Function
  if (typeof doc.txns !== 'undefined') {
    doc.txns.map(txn => txn.txn).forEach(txn => {
      // "Algodex Rewards Opt-In" text in note
      if (txn.note && txn.note === 'QWxnb2RleCBSZXdhcmRzIE9wdC1Jbg==') {
        const sender = txn.snd;
        emit(sender, 1);
      }
    });
  }
};
