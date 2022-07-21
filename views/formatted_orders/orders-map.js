// @ts-nocheck

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

  /**
   * @param {int} asaAmount
   * @param {int} decimals
   * @return {string}
   */
  function getFormattedASAAmount(asaAmount, decimals) {
    if (isNaN(asaAmount)) {
      return null;
    }

    const val = asaAmount / Math.pow(10, decimals);
    return val;
    // return number_format((float)$val, $decimals, '.', '');
  }

  const history = doc.data.history;
  const lastHistory = history[history.length - 1];
  if (lastHistory.algoAmount > 0 || lastHistory.asaAmount > 0) {
    const asaAmount = doc.data.indexerInfo.asaAmount;
    const n = doc.data.escrowInfo.numerator;
    const d = doc.data.escrowInfo.denominator;
    const asaPrice = n > 0 ? (d/n) : null;
    const decimals = doc.data.assetDecimals;

    const escrowInfo = {
      ownerAddress: doc.data.escrowInfo.ownerAddr,
      escrowAddress: doc._id,
      algoAmount: doc.data.indexerInfo.algoAmount,
      asaAmount: asaAmount,
      assetLimitPriceD: doc.data.escrowInfo.denominator,
      assetLimitPriceN: doc.data.escrowInfo.numerator,
      asaPrice: asaPrice,
      formattedPrice: getFormattedPrice(asaPrice, decimals),
      formattedASAAmount: getFormattedASAAmount(asaAmount, decimals),
      round: doc.data.lastUpdateRound,
      unix_time: doc.data.lastUpdateUnixTime,
      decimals: decimals,
      version: doc.data.escrowInfo.version,
      isAlgoBuyEscrow: doc.data.escrowInfo.isAlgoBuyEscrow,
    };
    emit(['assetId', doc.data.escrowInfo.assetId], escrowInfo);
    emit(['ownerAddr', escrowInfo.ownerAddress], escrowInfo);
  }
};
