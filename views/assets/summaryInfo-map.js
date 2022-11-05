module.exports = function(doc) {
  emit(doc._id, {
    unitName: doc.asset.params['unit-name'] || 'UNKNOWN',
    name: doc.asset.params['name'] || 'UNKNOWN',
    decimals: doc.asset.params['decimals'],
    total: doc.asset.params['total'],
    verified: doc.verified ? true : false,
  });
};
