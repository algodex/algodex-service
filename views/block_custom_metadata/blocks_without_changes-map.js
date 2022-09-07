module.exports = function(doc) {
  const hasChanges = doc.hasChanges;

  if (hasChanges === false) {
    const changesType = doc.changesType;
    const round = parseInt(doc._id.split(':')[1]);
    emit(round, {
      changesType,
    });
  }
};
