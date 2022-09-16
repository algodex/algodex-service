// @ts-nocheck

module.exports = function(doc) {
  const price = doc.algoAmount / doc.asaAmount /
    Math.pow(10, (6-doc.assetDecimals));

  emit(doc.asaId,
      {
        price,
        unixTime: doc.unixTime,
      });
};
