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
