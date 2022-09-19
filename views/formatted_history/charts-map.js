// eslint-disable-next-line require-jsdoc
module.exports = function(doc) {
  // eslint-disable-next-line max-len
  const unixTime = doc.unixTime*1000;
  const date = new Date(unixTime);
  // The padding is needed for sorting the view
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const year = date.getFullYear();
  const day = `${date.getUTCDate()}`.padStart(2, '0'); ;

  const YMD = `${year}:${month}:${day}`;

  const hour = `${date.getHours()}`.padStart(2, '0');
  const min = `${date.getMinutes()}`.padStart(2, '0');
  const min5 = `${date.getMinutes() % 5}`.padStart(2, '0'); ;
  const min15 = `${date.getMinutes() % 15}`.padStart(2, '0');
  const hour4 = `${date.getHours() % 4}`.padStart(2, '0');

  const formattedPrice = doc.algoAmount / doc.asaAmount /
    Math.pow(10, (6-doc.assetDecimals));
  emit([doc.asaId, '1h', `${YMD}:${hour}`], {formattedPrice, unixTime});
  emit([doc.asaId, '1d', `${YMD}`], {formattedPrice, unixTime});
  emit([doc.asaId, '1m', `${YMD}:${min}`], {formattedPrice, unixTime});
  emit([doc.asaId, '5m', `${YMD}:${min5}`], {formattedPrice, unixTime});
  emit([doc.asaId, '15m', `${YMD}:${min15}`], {formattedPrice, unixTime});
  emit([doc.asaId, '4h', `${YMD}:${hour4}`], {formattedPrice, unixTime});
};
