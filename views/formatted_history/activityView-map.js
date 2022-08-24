// @ts-nocheck

module.exports = function(doc) {
  const newDoc = Object.assign({}, doc);

  delete newDoc._id;
  delete newDoc._rev;
  emit(doc.assetBuyerAddr, newDoc);
  emit(doc.assetBuyerAddr, newDoc);
};

// reducer: count
