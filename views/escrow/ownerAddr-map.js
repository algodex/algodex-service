module.exports = function(doc) {
  const ownerAddr = doc.data.escrowInfo.ownerAddr;
  emit(ownerAddr, 1);
};
