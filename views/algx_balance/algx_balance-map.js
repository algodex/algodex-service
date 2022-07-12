module.exports = function(doc) {
  doc.changes.forEach(change => {
    emit(change.account, {
      balance: change.balance,
      round: parseInt(doc._id),
    });
  });
};
