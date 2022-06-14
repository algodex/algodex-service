module.exports = function(doc) {
  const addr = doc._id.split('-')[0];
  emit(addr, 1);
};
