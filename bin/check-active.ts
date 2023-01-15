import { exec } from 'child_process';
require('dotenv').config();

const runExec = (cmd:string):Promise<String> => {
  console.log(cmd);
  return new Promise((resolve, reject) => 
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`error: ${error.message}`);
        reject(`error: ${error.message}`);
        return;
      }
    
      if (stderr) {
        console.error(`stderr: ${stderr}`);
        resolve(`stderr: ${stderr}`);
        return;
      }
    
      console.log(`stdout:\n${stdout}`);
      resolve(`stdout:\n${stdout}`);
    })
  );
}

function sleep(ms:number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const checkBrokerActive = async () => {
  await sleep(1000);  
  const logText = await runExec('pm2 logs --nostream broker');
  // console.log(logText);
  const lines = logText.split('\n');
  const regex = /\s+([0-9]{13})\s*/mg;
  let lastBlockTime;
  for (const line of lines) {
    for (const match of line.matchAll(regex)) {
      lastBlockTime = match[0];
    }
  }
  const currentTime = Date.now();
  const secondsSinceBlock = (currentTime/1000) - (lastBlockTime/1000);
  const maxSeconds = 60;
  if (secondsSinceBlock > maxSeconds) {
    console.log('restarting services due to ' + secondsSinceBlock + ' seconds since last block!');
    await runExec('pm2 stop broker');
    await sleep(1000);
    await runExec('pm2 restart all');
  } else {
    console.log('seconds is ' + secondsSinceBlock + ' not restarting ' );
    await runExec(`curl -fsS -m 10 --retry 5 -o /dev/null ${process.env.BROKER_HEALTHCHECK_URL}`);
  }
}

checkBrokerActive();

