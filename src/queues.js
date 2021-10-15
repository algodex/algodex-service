const Redis = require("ioredis");
const {Queue} = require("bullmq");


let queues, connection;

// Singleton factory pattern
module.exports = function() {
    if(typeof connection === 'undefined'){
        // Define connection
        connection = new Redis(6379, process.env['REDIS_ADDRESS'] || "localhost");
    }

    if(typeof queues === 'undefined'){
        // Define Queues
        queues = {
            blocks: new Queue('blocks', {connection}),
        }
    }

    return queues;
}