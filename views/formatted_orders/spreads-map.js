module.exports = function(doc) {
  /**
   * @param {int} unformattedPrice
   * @param {int} decimals
   * @return {string}
   */
  function getFormattedPrice(unformattedPrice, decimals) {
    if (isNaN(unformattedPrice)) {
      return null;
    }
    const price = unformattedPrice * Math.pow(10, (decimals - 6));
    // return number_format((float)$price, 6, '.', '');
    return price;
  }

  const history = doc.data.history;
  const lastHistory = history[history.length - 1];
  if (lastHistory.algoAmount > 0 || lastHistory.asaAmount > 0) {
    const decimals = doc.data.assetDecimals;
    const n = doc.data.escrowInfo.numerator;
    const d = doc.data.escrowInfo.denominator;
    const asaPrice = n > 0 ? (d / n) : null;
    const escrowInfo = {
      formattedPrice: getFormattedPrice(asaPrice, decimals),
      isAlgoBuyEscrow: doc.data.escrowInfo.isAlgoBuyEscrow,
    };
    emit(doc.data.escrowInfo.assetId, escrowInfo);
  }
};
