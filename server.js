/**
 * Server configures the Queues and starts a Service based on Context
 */
require('dotenv').config();
const Redis  = require('ioredis');
const PouchDB = require("pouchdb-core");
const Queue = require('bullmq').Queue;

// Setup connections to Redis
const queue = new Redis(process.env['REDIS_MQ_ADDRESS'] || 6379, process.env['REDIS_MQ_ADDRESS'] || "queue");
const events  = new Redis(process.env['REDIS_ADDRESS'] || "events");

const dbUrl = 'http://admin:dex@couchdb:5984/dex'

const getDatabase = require('./src/db');
const db = getDatabase();

// Configure Queues
const getQueues = require('./src/queues');
const queues = getQueues();

// Context Switcher, Set APP_CONTEXT to run individual services
if(typeof process.env['APP_CONTEXT'] === 'undefined'){
    process.env['APP_CONTEXT'] = 'socket'
} else {
    require(`./services/${process.env['APP_CONTEXT']}`)({queues, db})
}