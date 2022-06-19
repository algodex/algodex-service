module.exports = function(doc) {
  emit(doc._id.split('-')[0],
      {block: doc._id.split('-')[1], balance: doc.balance} );
};
