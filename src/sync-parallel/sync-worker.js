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


const {getBlock} = require('../explorer');
const {parentPort, workerData} = require('worker_threads');
const getDatabases = require('../db/get-databases');

const databases = getDatabases();
const blocksDB = databases.blocks;

const getAndAddBlocksFromChunk = async function({index, chunk}) {
  console.log('Worker working');
  console.log(`Worker index is ${index}`);

  for (const round of chunk) {
    console.log('Adding Round', round);
    let gotBlock = false;

    do {
      try {
        const block = await getBlock({round});
        if (!block.rnd) {
          continue;
        }
        gotBlock = true;
        try {
          await blocksDB.post({_id: `${block.rnd}`, type: 'block', ...block});
        } catch (e) {
          if (e.error === 'conflict') {
            console.log('the block ['+block.rnd+']was already added!');
            continue;
          }
          console.error('could not save block: ' +
              block.rnd + ' to db: ' + e.error + ' ' + e);
        }
      } catch (e) {
        console.log('could not fetch block', {e});
      }
    } while (gotBlock === false);
  }
};

const run = async () => {
  await getAndAddBlocksFromChunk({
    index: workerData.index,
    chunk: workerData.chunk,
  });
  parentPort.postMessage(`finished from worker index ${workerData.index}`);
};

run();
