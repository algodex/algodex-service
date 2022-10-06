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
