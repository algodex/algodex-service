// eslint-disable-next-line require-jsdoc
module.exports = function(doc) {
  // eslint-disable-next-line max-len
  const unixTime = doc.unixTime;
  const date = new Date(unixTime);
  const day = date.getUTCDate();
  const hour = date.getHours();
  const min = date.getMinutes();
  const min5 = min % 5;
  const min15 = min % 15;
  const hour4 = hour % 4;

  const formattedPrice = doc.algoAmount / doc.asaAmount / (10**(6-doc.assetDecimals));
  emit([doc.asaId, '1h', hour], {formattedPrice, unixTime});
  emit([doc.asaId, '1d', day], {formattedPrice, unixTime});
  emit([doc.asaId, '1m', min], {formattedPrice, unixTime});
  emit([doc.asaId, '5m', min5], {formattedPrice, unixTime});
  emit([doc.asaId, '15m', min15], {formattedPrice, unixTime});
  emit([doc.asaId, '4h', hour4], {formattedPrice, unixTime});
};
