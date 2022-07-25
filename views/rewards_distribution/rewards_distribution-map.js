// @ts-nocheck

module.exports = function(doc) {
  emit(doc.accrualNetwork + ':' + doc.epoch,
      {'result': doc.result, 'to_wallet': doc.to_wallet});
};

