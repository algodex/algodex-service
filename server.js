/**
 * Server configures the Queues and starts a Service based on Context
 */
require('dotenv').config();

// Configure database
const getDatabase = require('./src/db');
const db = getDatabase();

// Configure Queues
const getQueues = require('./src/queues');
const queues = getQueues();

const getEvents = require('./src/events');
const events = getEvents();

// Context Switcher, Set APP_CONTEXT to run individual services
if(typeof process.env['APP_CONTEXT'] === 'undefined'){
    process.env['APP_CONTEXT'] = 'socket'
} else {
    require(`./services/${process.env['APP_CONTEXT']}`)({events, queues, db})
}