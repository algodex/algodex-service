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

const os = require('os');
const {InvalidParameter} = require('./Errors');

/**
 * Create an Array of consecutive numbers
 * @param {number} start
 * @param {number} length
 * @return {Array<number>}
 */
const createConsecutiveArray = function( start, length) {
  if (start > length) {
    throw new InvalidParameter('Start must be less than length!');
  }
  const arr = new Array(length-start);
  let idx = start;
  for (let i = 0; i < arr.length; i++) {
    arr[i] = idx;
    idx++;
  }
  return arr;
};

/**
 * Create an Object keyed by consecutive numbers
 * @param {number} start
 * @param {number} length
 * @return {{}}
 */
const createConsecutiveObject = function(start, length) {
  if (start > length) {
    throw new InvalidParameter('Start must be less than length!');
  }
  return createConsecutiveArray(start, length)
      .reduce((previousValue, currentValue)=>{
        previousValue[currentValue] = true;
        return previousValue;
      }, {});
};

/**
 * Chunk an array of numbers to cpu slices
 * @param {Array<number>} arr
 * @return {Array<Array<number>>}
 */
const cpuChunkArray = function(arr) {
  if (!Array.isArray(arr)) {
    throw new InvalidParameter('Must be an Array!');
  }
  const chunks = [];
  const chunk = Math.max(arr.length / os.cpus().length, 1);
  for (let i = 0; i < arr.length; i += chunk) {
    chunks.push(arr.slice(i, i + chunk));
  }
  return chunks;
};

module.exports = {
  cpuChunkArray,
  createConsecutiveArray,
  createConsecutiveObject,
};
