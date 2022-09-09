module.exports = function(doc) {
  doc.changes.forEach(change => {
    const round = parseInt(doc._id);
    emit(change.account, {
      balance: change.balance,
      round: round,
    });
  });
};
