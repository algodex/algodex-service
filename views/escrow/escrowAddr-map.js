module.exports = function(doc) {
  const addr = doc._id.split('-')[0];
  const ownerAddr = doc.data.escrowInfo.ownerAddr;
  emit(addr, ownerAddr);
};
