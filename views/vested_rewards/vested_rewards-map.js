module.exports = function(doc) {
  const obj = Object.assign({}, doc);
  delete obj.ownerWallet;
  delete obj._id;
  delete obj._rev;
  emit(doc.ownerWallet, obj);
};
