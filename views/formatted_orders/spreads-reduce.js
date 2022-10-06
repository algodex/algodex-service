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

/* eslint-disable max-len */
module.exports = function(keys, values, rereduce) {
  if (rereduce) {
    return values.reduce((finalVal, val) => {
      if (val.highestBid.maxPrice > finalVal.highestBid.maxPrice) {
        finalVal.highestBid.maxPrice = val.highestBid.maxPrice;
      }
      if (val.lowestAsk.minPrice < finalVal.lowestAsk.minPrice) {
        finalVal.lowestAsk.minPrice = val.lowestAsk.minPrice;
      }
      return finalVal;
    }, values[0]);
  } else {
    const highestBid = values.reduce((max, val) => {
      if (val.formattedPrice && val.isAlgoBuyEscrow && val.formattedPrice > max.maxPrice) {
        max.maxPrice = val.formattedPrice;
      }
      return max;
    }, {maxPrice: 0, isAlgoBuyEscrow: true});
    const lowestAsk = values.reduce((min, val) => {
      if (val.formattedPrice && !val.isAlgoBuyEscrow && val.formattedPrice < min.minPrice) {
        min.minPrice = val.formattedPrice;
      }
      return min;
    }, {minPrice: 1E30, isAlgoBuyEscrow: false});

    return {highestBid, lowestAsk};
  }
};
