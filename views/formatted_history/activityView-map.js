// @ts-nocheck

module.exports = function(doc) {
  const newDoc = Object.assign({}, doc);

  delete newDoc._id;
  delete newDoc._rev;
  if (doc.tradeType === 'buy') {
    emit(doc.assetBuyerAddr, newDoc);
  } else if (doc.tradeType === 'sell') {
    emit(doc.assetSellerAddr, newDoc);
  }
};

// reducer: count
