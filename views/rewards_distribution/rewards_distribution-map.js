// @ts-nocheck

module.exports = function(doc) {
  emit(doc._id, doc.network + ':' + doc.epoch);
};

