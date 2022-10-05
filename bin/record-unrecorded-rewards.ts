#!/usr/bin/env node

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
