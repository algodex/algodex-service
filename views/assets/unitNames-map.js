module.exports = function(doc) {
  emit(doc._id, doc.asset.params['unit-name']);
};
