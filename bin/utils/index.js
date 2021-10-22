import fs from 'fs';
import path from 'path';
import os from 'os';
import {InvalidParameter} from '../../src/index.js';
import {pathToFileURL, URL, fileURLToPath} from 'url';

/**
 * Get all files from a path
 * @param {string} dirPath
 * @param {Array<string>} [arrayOfFiles]
 * @return {Array<string>}
 */
export function getAllFiles(dirPath, arrayOfFiles) {
// const getAllFiles = function(dirPath, arrayOfFiles) {
//   console.log(path.parse(dirPath));
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    const pathToFile = `${fileURLToPath(dirPath)}${path.sep}${file}`;
    const fileURL = new URL(pathToFileURL( `${pathToFile}`));
    if (fs.statSync(pathToFile).isDirectory()) {
      arrayOfFiles = getAllFiles(fileURL, arrayOfFiles);
    } else {
      arrayOfFiles.push(fileURL);
    }
  });

  return arrayOfFiles;
}

/**
 * Chunk an array of numbers to cpu slices
 * @param {Array<number>} arr
 * @return {Array<Array<number>>}
 */
export function cpuChunkArray(arr) {
// const cpuChunkArray = function(arr) {
  if (!Array.isArray(arr)) {
    throw new InvalidParameter('Must be an Array!');
  }
  const chunks = [];
  const chunk = arr.length / os.cpus().length;
  for (let i = 0, l = arr.length; i < l; i += chunk) {
    chunks.push(arr.slice(i, i + chunk));
  }
  return chunks;
}
