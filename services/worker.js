const IORedis = require('ioredis');
const bullmq = require('bullmq');
const Worker = bullmq.Worker;
const redis = new IORedis(6379, "queue");
const PouchDB = require('pouchdb-core');
PouchDB.plugin(require('pouchdb-adapter-http'));

const db = new PouchDB('http://admin:dex@couchdb:5984/dex')

// Lighten the load on the broker and do batch processing
const orders = new Worker('orders', async (job)=>{
    console.log(`Worker found ${job.data.length} orders`);

    // Save to database
    return db.post({orderbook: job.data}).then(function (response) {
        console.log(response)
    }).catch(function (err) {
        console.log(err);
    });

}, { connection: redis, concurrency: 50 });

orders.on('error', (err) => {
    console.error(err);
});