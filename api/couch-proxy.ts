/* eslint-disable @typescript-eslint/no-var-requires */
require('dotenv').config();

const express = require('express')

const PouchDB = require('pouchdb')
const PouchMapReduce = require('pouchdb-mapreduce');
// const bodyParser = require('body-parser');

PouchDB.plugin(PouchMapReduce)

const app = express()
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies 
const port = 3006

const getDatabase = (dbname:string) => {
  const fullUrl = process.env.COUCHDB_BASE_URL + '/' + dbname
  // console.log({fullUrl});
  const db = new PouchDB(fullUrl)
  return db
}

// {
//   "_id": "da42b5aa00230629bb6b9175a30374db",
//   "_rev": "5-5e5d6fb9e29d0025c6c25e983e3979a6",
//   "ownerWallet": "KJMDX5PTKZCK3DMQXQ6JYSIDLVZOK5WX6FHGF7ZWPN2ROILIMO6GNBZLHA",
//   "uptime": 2843,
//   "depthSum": 1298.4046350579222,
//   "qualitySum": 28538621675447583000,
//   "algxAvg": 0,
//   "qualityFinal": 8241412412,
//   "earnedRewards": 2500,
//   "epoch": 2,
//   "assetId": 31566704
// }

app.post('/save_rewards', async (req, res) => {
  console.log('Got body:', req.body);
  res.sendStatus(200);
});

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