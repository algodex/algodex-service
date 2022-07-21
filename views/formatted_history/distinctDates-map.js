// @ts-nocheck

module.exports = function(doc) {
  const milliseconds = doc.unixTime * 1000;
  const dateObject = new Date(milliseconds);
  const humanDateFormat = dateObject.toLocaleString(); // 2019-12-9 10:30:15
  const date = humanDateFormat.split(',')[0];
  const monthYear = date.split('/')[0] + '/' + date.split('/')[2];
  const owner = doc.tradeType === 'buy' ?
    doc.assetBuyerAddr : doc.assetSellerAddr;
  emit(owner+':date', date);
  emit(owner+':month', monthYear);
};
