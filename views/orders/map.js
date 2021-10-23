module.exports = function(doc) {
  crypto = require('views/lib/crypto');
  if (typeof doc.txns !== 'undefined') {
    doc.txns.forEach((txn) => {
      // if(txn.txn.rcv && txn.txn.snd) {
      //   emit(txn.txn.rcv, [txn.txn.amt, txn.txn.fee])
      // }
      const date = new Date(doc.ts*1000);
      const month = date.getUTCMonth() + 1; // months from 1-12
      const day = date.getUTCDate();
      const year = date.getUTCFullYear();
      const hour = date.getHours();
      const min = date.getMinutes();
      const sec = date.getSeconds();

      if (txn.txn && txn.txn.type) {
        const isAlgodex = ( txn.txn.apid === 22045503 ||
          txn.txn.apid === 22045522);
        if (txn.txn.type === 'appl' && isAlgodex) {
          if (typeof txn.txn.apaa !== 'undefined') {
            const orderInfo = crypto.recode(txn.txn.apaa[1], 'aota');
            const parts =orderInfo.split(/^(\d+)-(\d+)-(\d+)-(\d+)$/);
            const res = {
              apat: txn.txn.apat,
              type: crypto.recode(txn.txn.apaa[0], 'aota'),
              orderInfo: txn.txn.apaa[1],
              numerator: parseInt(parts[1]),
              assetId: parseInt(parts[4]),
              denominator: parseInt(parts[2]),
              minimum: parseInt(parts[3]),
              price: parseFloat(parseInt(parts[2]))/parseInt(parts[1]),
              block: doc._id,
              ts: doc.ts,
            };

            emit([res.assetId, year, month, day, hour, min, sec], res);
          }
        }
      }
    });
  }
};
