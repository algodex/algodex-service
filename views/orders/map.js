module.exports = function(doc) {
  crypto = require('../lib/crypto');
  doc.txns.forEach((txn) => {
    if (txn.txn && txn.txn.type) {
      const isAlgodex = txn.txn.apid === 22045503 || txn.txn.apid === 22045522;
      if (txn.txn.type === 'appl' && isAlgodex) {
        if (typeof txn.txn.apaa !== 'undefined') {
          const orderInfo = crypto.recode(txn.txn.apaa[1], 'aota');
          const parts =orderInfo.split(/^(\d+)-(\d+)-(\d+)-(\d+)$/);
          const res = {
            type: crypto.recode(txn.txn.apaa[0], 'aota'),
            order: {
              orderInfo: txn.txn.apaa[1],
              numerator: parseInt(parts[1]),
              denominator: parseInt(parts[2]),
              minimum: parseInt(parts[3]),
              assetId: parseInt(parts[4]),
            },
          };
          emit(res.order.assetId, res);
        }
      }
    }
  });
};
