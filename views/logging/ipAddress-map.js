module.exports = function(doc) {
  if (doc.ipAddress) {
    const newDoc = {};
    Object.assign(newDoc, doc);
    delete newDoc._id;
    delete newDoc._rev;
    emit([newDoc.ipAddress, newDoc.unixTime], newDoc);
  }
};
