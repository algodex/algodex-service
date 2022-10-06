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
  if (typeof doc.type !== 'undefined' && doc.type === 'price' && typeof doc.price === 'number') {
    const date = new Date(doc.timestamp);
    const month = date.getUTCMonth() + 1; // months from 1-12
    const day = date.getUTCDate();
    const year = date.getUTCFullYear();
    const hour = date.getHours();
    const min = date.getMinutes();
    const sec = date.getSeconds();
    emit([doc.asset.id, year, month, day, hour, min, sec], doc.price);
  }
};
