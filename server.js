/**
 * Server configures the Queues and starts a Service based on Context
 */
require('dotenv').config();

// Configure Algorand
const getAlgod = require('./src/algod');
const client = getAlgod();

// Configure Couchdb Blocks Database
const getDatabase = require('./src/db');
const db = getDatabase();

// Configure Queues
const getQueues = require('./src/queues');
const queues = getQueues();

// Configure Events
const getEvents = require('./src/events');
const {existsSync} = require('fs');
const events = getEvents();

const servicePath =`./services/${process.env['APP_PATH']}.js`;
console.log(servicePath);
if (!existsSync(servicePath)) {
  throw new Error('Application does not exist in services!');
}

const service = require(servicePath);

service({client, events, queues, db});
