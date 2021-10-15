const cluster = require('cluster');
const process = require('process');

const {createConsecutiveObject, createConsecutiveArray, cpuChunkArray, get} = require('../src/util');
const {getAppsBlockRange, getBlock} = require('../src/explorer');
const getQueues = require('../src/queues');
const getDatabase = require('../src/db');

const queues = getQueues();
const db = getDatabase();


const compare = async function () {
    let apps = [
        {
            id: 22045503,
            genesis: undefined,
        },
        {
            id: 22045522,
            genesis: undefined
        }
    ]
    // Get a range of blocks for a list of applications
    let {start, current} = await getAppsBlockRange(apps);
    // Create an Object keyed by blocks in the range(performance reasons to use object)
    let rounds = createConsecutiveObject(start, current);

    // Look in the database for existing blocks and remove them from rounds
    let existingBlocks = (await db.allDocs()).rows.map(doc=>parseInt(doc.id));
    existingBlocks.forEach(block=>{
        delete rounds[block];
    });

    // Chunk the keys for Multi-Threaded workers
    let chunks = cpuChunkArray(Object.keys(rounds));
    console.log(start, current)
    // Chunk Process into Forks
    for (let i = 0; i < chunks.length; i++) {
        let worker = cluster.fork();
        worker.index = i;
        worker.on('message', function (msg) {
            if (msg === "index") {
                worker.send({index: worker.index, chunks});
            }
        });
    }
};

// Fetch the block and add it to the storage queue
const queue = async function () {
    console.log('Worker working')
    process.on('message', async function ({index, chunks}) {
        for (const round of chunks[index]) {
            console.log('Queue Round', round);
            let block = await getBlock(round);
            await queues.blocks.add('blocks', block, {removeOnComplete: true});
            console.log('Queue Round Sent', round);
        }
    });
    process.send("index");
};


// Run the Sync
(async () => {
    if (!cluster.isWorker) {
        console.log(`Primary ${process.pid} is running`);
        await compare();
        cluster.on('exit', (worker, code, signal) => {
            console.log(`worker ${worker.process.pid} died`);
        });
    }
    if (cluster.isWorker) {
        await queue();
    }
})()
