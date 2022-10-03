module.exports = function(doc) {
  const assetId = doc.data.escrowInfo.assetId;
  const algoAmount = (doc.data.history[0].algoAmount || 0) / (Math.pow(10, 6));
  const decimals = doc.data.assetDecimals;
  const asaAmount = (doc.data.history[0].asaAmount || 0) / (Math.pow(10, decimals));

  emit(assetId, {algoAmount, asaAmount});
};
