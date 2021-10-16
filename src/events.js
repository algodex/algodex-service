const Redis = require("ioredis");

let events;

// Singleton factory pattern
module.exports = function() {
    if(typeof events === 'undefined'){
        // Define connection
        events  = new Redis(parseInt(process.env['REDIS_PORT'] || 6379), process.env['REDIS_ADDRESS'] || "events");
    }
    return events;
}