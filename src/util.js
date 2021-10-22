// import fs from 'fs';
// import path from 'path';
// import os from 'os';
import {InvalidParameter} from './errors/index.js';

// const fs = require('fs');
// const path = require('path');
// const os = require('os');
// const {InvalidParameter} = require('./errors');

/**
 * Create an Array of consecutive numbers
 * @param {number} start
 * @param {number} length
 * @return {array<number>}
 */
export function createConsecutiveArray( start, length) {
// const createConsecutiveArray = function( start, length) {
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
}

/**
 * Create an Object keyed by consecutive numbers
 * @param {number} start
 * @param {number} length
 * @return {{}}
 */
export function createConsecutiveObject(start, length) {
// const createConsecutiveObject = function(start, length) {
  if (start > length) {
    throw new InvalidParameter('Start must be less than length!');
  }
  return createConsecutiveArray(start, length)
      .reduce((previousValue, currentValue)=>{
        previousValue[currentValue] = true;
        return previousValue;
      }, {});
}

// /**
//  * Chunk an array of numbers to cpu slices
//  * @param {Array<number>} arr
//  * @return {Array<Array<number>>}
//  */
// export function cpuChunkArray(arr) {
// // const cpuChunkArray = function(arr) {
//   if (!Array.isArray(arr)) {
//     throw new InvalidParameter('Must be an Array!');
//   }
//   const chunks = [];
//   const chunk = arr.length / os.cpus().length;
//   for (let i = 0, l = arr.length; i < l; i += chunk) {
//     chunks.push(arr.slice(i, i + chunk));
//   }
//   return chunks;
// }


// /**
//  * Get all files from a path
//  * @param {string} dirPath
//  * @param {Array<string>} [arrayOfFiles]
//  * @return {Array<string>}
//  */
// export function getAllFiles(dirPath, arrayOfFiles) {
// // const getAllFiles = function(dirPath, arrayOfFiles) {
//   const files = fs.readdirSync(dirPath);
//
//   arrayOfFiles = arrayOfFiles || [];
//
//   files.forEach(function(file) {
//     if (fs.statSync(dirPath + '/' + file).isDirectory()) {
//       arrayOfFiles = getAllFiles(dirPath + '/' + file, arrayOfFiles);
//     } else {
//       arrayOfFiles.push(path.join(dirPath, '/', file));
//     }
//   });
//
//   return arrayOfFiles;
// }

// module.exports = {
//   getAllFiles,
//   cpuChunkArray,
//   createConsecutiveArray,
//   createConsecutiveObject,
// };
