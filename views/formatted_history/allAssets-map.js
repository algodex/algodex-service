// @ts-nocheck

module.exports = function(doc) {
  emit(doc.asaId,
      {
        price: doc.algoAmount/doc.asaAmount,
        unixTime: doc.unixTime,
      });
};
