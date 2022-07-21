// eslint-disable-next-line require-jsdoc
module.exports = function(doc) {
  // eslint-disable-next-line max-len
  if (typeof doc.type !== 'undefined' && doc.type === 'price' && typeof doc.price === 'number') {
    const date = new Date(doc.timestamp);
    const month = date.getUTCMonth() + 1; // months from 1-12
    const day = date.getUTCDate();
    const year = date.getUTCFullYear();
    const hour = date.getHours();
    const min = date.getMinutes();
    const sec = date.getSeconds();
    emit([doc.asset.id, year, month, day, hour, min, sec], doc.price);
  }
};
