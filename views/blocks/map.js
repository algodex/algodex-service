module.exports = function(doc) {
  emit(doc.rnd, typeof doc.txns !== 'undefined' ? doc.txns.length : 0);
};
