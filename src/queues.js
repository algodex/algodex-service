const Redis = require("ioredis");
const {Queue} = require("bullmq");

let queues, connection;

// Singleton factory pattern
module.exports = function() {
    if(typeof connection === 'undefined'){
        // Define connection
        connection = new Redis(parseInt(process.env['REDIS_MQ_PORT'] || 6379), process.env['REDIS_MQ_ADDRESS'] || "queues");
    }

    if(typeof queues === 'undefined'){
        // Define Queues
        queues = {
            connection,
            blocks: new Queue('blocks', {connection}),
            assets: new Queue('assets', {connection}),
            orders: new Queue('orders', {connection}),
        }
    }

    return queues;
}