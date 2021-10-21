module.exports = function(doc) {
  emit(doc._id, typeof doc.txns !== 'undefined' ? doc.txns.length : 0);
};
