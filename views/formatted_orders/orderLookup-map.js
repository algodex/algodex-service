module.exports = function(doc) {
  emit(doc._id, doc);
};