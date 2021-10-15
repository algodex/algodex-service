const Redis = require("ioredis");

let events;

// Singleton factory pattern
module.exports = function() {
    if(typeof events === 'undefined'){
        // Define connection
        events  = new Redis(process.env['REDIS_ADDRESS'] || "events");
    }
    return events;
}