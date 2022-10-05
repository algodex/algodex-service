#!/usr/bin/env node

/* Usage
 *
 * ./clear-rewards --epoch=<epoch>
 */

const args = require('minimist')(process.argv.slice(2));
const getDatabases = require('../src/db/get-databases');

const clearRewards = async () => {
  if (!args.epoch) {
    throw new Error('epoch is not defined');
  }
  const epoch:number = parseInt(args.epoch);

  console.log("Going to delete old records from rewards for epoch: " + epoch);
  const databases = getDatabases();
  const db = databases.rewards;
  const allDocs = await db.allDocs();
  // console.log(allDocs.rows.filter(row => row.id.includes(":")).length + " docs to delete");
  const deletePromises = allDocs.rows
    .filter(row => row.id.includes(":"))
    .filter(row => parseInt(row.id.split(':')[0]) === epoch)
    .map(row => {
      console.log("sending remove for: ", {id: row.id});
     return db.get(row.id).then(doc => db.remove(doc))
      .then(console.log("removed "+row.id)).catch(e => console.log("failed to remove " + row.id, e))
    });
  await Promise.allSettled(deletePromises);
};


clearRewards();

export {};
