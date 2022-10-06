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



const reducer = function(keys, values, rereduce) {
  const getEarliest = values => {
    const min = values
        .filter(val => val !== null && val !== undefined)
        .reduce((min, val) => Math.min(min, val), Infinity);
    return min;
  };
  const finalOrder = values.reduce(function(finalOrder, order) {
    const allKeys = [...Object.keys(order), ...Object.keys(finalOrder)];

    const firstNonNullKeyVal = allKeys.reduce((map, key) => {
      const val = finalOrder[key] || order[key];
      map[key] = val;
      return map;
    }, {});

    const earliestRound = getEarliest([finalOrder.earliestRound,
      finalOrder.round, order.round, order.earliestRound]);

    if (order.block > finalOrder.block) {
      finalOrder = order;
    }

    allKeys.forEach(key => {
      finalOrder[key] = finalOrder[key] || firstNonNullKeyVal[key];
    });

    finalOrder.earliestRound = earliestRound;
    return finalOrder;
  }, values[0]);
  finalOrder.status = finalOrder.type === 'open' ? 'open' : 'closed';
  return finalOrder;
};


module.exports = reducer;

