/**
 * Server configures the Queues and starts a Service based on Context
 */
import dotenv from 'dotenv';
dotenv.config();

const env = typeof import.meta.env === 'undefined' ?
  process.env :
  import.meta.env;

// Configure database
import getDatabase from './src/db.js';
const db = await getDatabase();

// Configure Queues
import getQueues from './services/messages/queues.js';
const queues = await getQueues();

import getEvents from './services/messages/events.js';

// const getDatabase = require('./src/db');
// const db = getDatabase();
//
// // Configure Queues
// const getQueues = require('./src/queues');
// const queues = getQueues();
//
// const getEvents = require('./src/events');
// const {isInt} = require('ioredis/built/utils');

const events = await getEvents();

// Context Switcher, Set APP_CONTEXT to run individual services
if (typeof env['APP_CONTEXT'] === 'undefined') {
  env['APP_CONTEXT'] = 'socket';
}
if (typeof env['APP_WORKER'] === 'undefined') {
  env['APP_WORKER'] = 'blocks';
}


// Load the requested Context
(await import(
    `./services/${env.APP_CONTEXT}.js`
)).default({queue: env['APP_WORKER'], events, queues, db});
// console.log(env);
// Run the everything in Development
if (env.NODE_ENV === 'development') {
  Object.keys(queues).forEach(async (queue) => {
    if (queue !== 'connection') {
      (await import(`./services/worker.js`))
          .default({queue, events, queues, db});
    }
  });

  db.changes({
    descending: true,
    limit: 1,
  }).then(async function({results}) {
    console.log(results);
    let round = 1;
    if (results && results.length > 0 &&
      Number.isInteger(results[0].id.split(':')[1])) {
      round = results[0].id.split(':')[1];
    }

    // Start the Broker
    (await import(
        `./services/broker.js`
    )).default({events, queues, round, skip: true});
  }).catch(function(err) {
    // handle errors
    console.log(err);
  });
}
