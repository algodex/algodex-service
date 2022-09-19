#!/usr/bin/env node

/**
 * Server configures the Queues and starts a Service based on Context
 */
require('dotenv').config();

console.log('IN SERVER.JS!!!');
// Configure Algorand
const getAlgod = require('./src/algod');
const getDatabases = require('./src/db/get-databases');
const client = getAlgod();

const databases = getDatabases();

// Configure Queues
const getQueues = require('./src/queues');
const queues = getQueues();

// Configure Events
const getEvents = require('./src/events');
const {existsSync} = require('fs');
const events = getEvents();

const servicePath =__dirname + `/services/${process.env['APP_CONTEXT']}.js`;
console.log(servicePath);
if (!existsSync(servicePath)) {
  throw new Error('Application does not exist in services!');
}

const service = require(servicePath);

service({client, events, queues, databases});
