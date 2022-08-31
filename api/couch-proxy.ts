/* eslint-disable @typescript-eslint/no-var-requires */
require('dotenv').config();

const express = require('express')

const PouchDB = require('pouchdb')
const PouchMapReduce = require('pouchdb-mapreduce');
PouchDB.plugin(PouchMapReduce)

const app = express()
const port = 3006

const getDatabase = (dbname:string) => {
  const fullUrl = process.env.COUCHDB_BASE_URL + '/' + dbname
  // console.log({fullUrl});
  const db = new PouchDB(fullUrl)
  return db
}

app.get('/rewards_distribution', async (req, res) => {
  const db = getDatabase('rewards_distribution');
  const statusData = await db.query('rewards_distribution/rewards_distribution', {
    reduce: false,
    group: false
  })

  // const getPromises = statusData.rows
  //   .map(row => row.value._id)
  //   .filter(id => {
  //     const alreadySeen = idSet.has(id);
  //     idSet.add(id);
  //     return !alreadySeen;
  //   })
  //   .map(id => {
  //     return db.get(id);
  //   });

  // const allDocs = await Promise.all(getPromises);
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(statusData.rows))
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})