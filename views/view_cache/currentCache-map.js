module.exports = function(doc) {
  emit(doc._id, {rev: doc._rev, round: doc.round});
};
