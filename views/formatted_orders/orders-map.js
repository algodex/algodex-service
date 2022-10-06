/* 
 * Algodex Service 
 * Copyright (C) 2022 Algodex VASP (BVI) Corp.
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

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
    const n = doc.data.escrowInfo.numerator;
    const d = doc.data.escrowInfo.denominator;
    const asaPrice = n > 0 ? (d/n) : null;
    const decimals = doc.data.assetDecimals;
    const lastHistoryItemIndex = doc.data.history.length - 1;
    const lastHistoryItem = doc.data.history[lastHistoryItemIndex];
    const asaAmount = lastHistoryItem.asaAmount || 0;
    const escrowInfo = {
      ownerAddress: doc.data.escrowInfo.ownerAddr,
      escrowAddress: doc._id,
      algoAmount: lastHistoryItem.algoAmount,
      asaAmount: asaAmount,
      assetLimitPriceD: doc.data.escrowInfo.denominator,
      assetLimitPriceN: doc.data.escrowInfo.numerator,
      asaPrice: asaPrice,
      formattedPrice: getFormattedPrice(asaPrice, decimals),
      formattedASAAmount: getFormattedASAAmount(asaAmount, decimals),
      round: lastHistory.round,
      unix_time: lastHistory.time,
      decimals: decimals,
      version: doc.data.escrowInfo.version,
      isAlgoBuyEscrow: doc.data.escrowInfo.isAlgoBuyEscrow,
      assetId: doc.data.escrowInfo.assetId,
    };
    emit(['assetId', doc.data.escrowInfo.assetId], escrowInfo);
    emit(['ownerAddr', escrowInfo.ownerAddress], escrowInfo);
  }
};
