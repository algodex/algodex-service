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
  doc.data.history
      .filter(item => {
        // first epoch
        // eslint-disable-next-line no-undef
        log(item); return item.time >= 1629950400 && item.time <= 1644469199;
      })
      .filter(item => (item.algoAmount && item.algoAmount > 0) ||
      (item.asaAmount && item.asaAmount > 0))
      .forEach(item => {
        emit(doc.data.escrowInfo.ownerAddr, 1);
      });
};

// reduer: _count
