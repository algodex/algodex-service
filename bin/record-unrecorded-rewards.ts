#!/usr/bin/env node

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

// Add this as a cron job

import { getUnrecordedEpochs } from "../api/rewards";
import { exec } from 'child_process';

const calcRewards = (epoch) => {
  return new Promise((resolve, reject) => {
  exec(`../../rewards-calc/target/release/rewards-calc --epoch=${epoch} --debug 0`, {
    cwd: __dirname
    },
      (error, stdout, stderr) => {
          console.log(stdout);
          console.log(stderr);
          if (error !== null) {
              console.log(`exec error: ${error}`);
              reject(error);
          } else {
            resolve('success');
          }
      });
  });
}
const recordUnrecordedRewards = async () => {
  const unrecordedEpochs = await getUnrecordedEpochs();
  console.log({__dirname});
  for (let i = 0; i < unrecordedEpochs.length; i++) {
    const epoch = unrecordedEpochs[i];
    console.log({epoch});
    await calcRewards(epoch);
  }
  process.exit(0);
};

recordUnrecordedRewards();
export {};
