const bullmq = require('bullmq');
const Worker = bullmq.Worker;
const PouchDB = require('pouchdb-core');
PouchDB.plugin(require('pouchdb-adapter-http'));

module.exports = ({connections, queues, db}) =>{
    // Lighten the load on the broker and do batch processing
    const orders = new Worker('blocks', async (job)=>{
        console.log(`Worker found block ${job.data.rnd}`);
        // Save to database
        return db.post({_id: `${job.data.rnd}`, ...job.data}).then(function (response) {
            console.log(response)
        }).catch(function (err) {
            console.log(err);
        });

    }, { connection: connections.queue, concurrency: 50 });

    orders.on('error', (err) => {
        console.error(err);
    });
}

