#!/usr/bin/env node

const getDatabases = require('../src/db/get-databases');

const clearRewards = async () => {
  console.log("Going to delete all old records from vested_rewards");
  const databases = getDatabases();
  const db = databases.rewards;
  const allDocs = await db.allDocs();
  console.log(allDocs.rows.filter(row => row.id.includes(":")).length + " docs to delete");
  const deletePromises = allDocs.rows
    .filter(row => row.id.includes(":"))
    .map(row => {
      console.log("sending remove for: ", {id: row.id});
     return db.get(row.id).then(doc => db.remove(doc))
      .then(console.log("removed "+row.id)).catch(e => console.log("failed to remove " + row.id, e))
    });
  await Promise.allSettled(deletePromises);
};


clearRewards();

export {};
