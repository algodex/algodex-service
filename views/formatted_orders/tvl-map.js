module.exports = function(doc) {
  const assetId = doc.data.escrowInfo.assetId;
  const historyLen = doc.data.history.length;
  const algoAmount =
    (doc.data.history[historyLen - 1].algoAmount || 0) / (Math.pow(10, 6));
  const decimals = doc.data.assetDecimals;
  const asaAmount =
    (doc.data.history[historyLen - 1].asaAmount || 0) / (Math.pow(10, decimals));

  emit(assetId, {algoAmount, asaAmount});
};
