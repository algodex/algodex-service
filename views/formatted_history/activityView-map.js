// @ts-nocheck

module.exports = function(doc) {
  const newDoc = Object.assign({}, doc);

  delete newDoc._id;
  delete newDoc._rev;
  emit(['assetId', doc.asaId, doc.unixTime], newDoc);
  emit(['ownerAddr', doc.assetBuyerAddr, doc.unixTime], newDoc);
  emit(['ownerAddr', doc.assetSellerAddr, doc.unixTime], newDoc);
};

// reducer: count
