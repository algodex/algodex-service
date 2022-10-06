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

// eslint-disable-next-line require-jsdoc
module.exports = function(doc) {
  // eslint-disable-next-line max-len
  const unixTime = doc.unixTime*1000;
  const date = new Date(unixTime);
  // The padding is needed for sorting the view
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const year = date.getFullYear();
  const day = `${date.getUTCDate()}`.padStart(2, '0'); ;

  const YMD = `${year}-${month}-${day}`;

  const hour = `${date.getHours()}`.padStart(2, '0');
  const min = `${date.getMinutes()}`.padStart(2, '0');
  const min5 = `${Math.floor(date.getMinutes() / 5)*5}`.padStart(2, '0');
  const min15 = `${Math.floor(date.getMinutes() / 15)*15}`.padStart(2, '0');
  const hour4 = `${Math.floor(date.getHours() / 4)*4}`.padStart(2, '0');

  const formattedPrice = doc.algoAmount / doc.asaAmount /
    Math.pow(10, (6-doc.assetDecimals));
  emit([doc.asaId, '1h', `${YMD}:${hour}:00`], {formattedPrice, unixTime});
  emit([doc.asaId, '1d', `${YMD}:00:00`], {formattedPrice, unixTime});
  emit([doc.asaId, '1m', `${YMD}:${hour}:${min}`], {formattedPrice, unixTime});
  emit([doc.asaId, '5m', `${YMD}:${hour}:${min5}`], {formattedPrice, unixTime});
  emit([doc.asaId, '15m', `${YMD}:${hour}:${min15}`], {formattedPrice, unixTime});
  emit([doc.asaId, '4h', `${YMD}:${hour4}:00`], {formattedPrice, unixTime});
};
