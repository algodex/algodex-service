module.exports = function(doc) {
  if (doc.has_order_changes === false) {
    emit(parseInt(doc._id), 1);
  }
};
