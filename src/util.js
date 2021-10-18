const os = require('os');
const {InvalidParameter} = require('./Errors');

/**
 * Create an Array of consecutive numbers
 * @param {number} start
 * @param {number} length
 * @return {array<number>}
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
  const chunk = arr.length / os.cpus().length;
  for (let i = 0, l = arr.length; i < l; i += chunk) {
    chunks.push(arr.slice(i, i + chunk));
  }
  return chunks;
};

module.exports = {
  cpuChunkArray,
  createConsecutiveArray,
  createConsecutiveObject,
};
