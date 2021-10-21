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
const {isInt} = require('ioredis/built/utils');

const events = getEvents();

// Context Switcher, Set APP_CONTEXT to run individual services
if (typeof process.env['APP_CONTEXT'] === 'undefined') {
  process.env['APP_CONTEXT'] = 'socket';
}
if (typeof process.env['APP_WORKER'] === 'undefined') {
  process.env['APP_WORKER'] = 'blocks';
}

// Load the requested Context
require(
    `./services/${process.env['APP_CONTEXT']}`,
)({queue: process.env['APP_WORKER'], events, queues, db});

// Run the everything in Development
if (process.env.NODE_ENV === 'development') {
  Object.keys(queues).forEach((queue) => {
    if (queue !== 'connection') {
      require(`./services/worker`)({queue, events, queues, db});
    }
  });

  db.changes({
    descending: true,
    limit: 1,
  }).then(function({results}) {
    console.log(results);
    let round = 1;
    if (isInt(results[0].id.split(':')[1])) {
      round = results[0].id.split(':')[1];
    }

    // Start the Broker
    require(
        `./services/broker`,
    )({events, queues, round, skip: true});
  }).catch(function(err) {
    // handle errors
  });
}
