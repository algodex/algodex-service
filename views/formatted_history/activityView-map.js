// @ts-nocheck

module.exports = function(doc) {
  if (doc.tradeType === 'buy') {
    emit(doc.assetBuyerAddr, 1);
  } else if (doc.tradeType === 'sell') {
    emit(doc.assetSellerAddr, 1);
  }
};

// reducer: count
