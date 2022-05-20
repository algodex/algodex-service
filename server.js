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

// const workers = require('./services/workers');

// Context Switcher, Set APP_CONTEXT to run individual services
// if (typeof process.env['APP_CONTEXT'] === 'undefined') {
//   process.env['APP_CONTEXT'] = 'socket';
// } else {
if (['socket', 'worker', 'broker'].includes(process.env['APP_CONTEXT'])) {
  require(`./services/${process.env['APP_CONTEXT']}`)({events, queues, db});
} else {
  // eslint-disable-next-line max-len
  require(`./services/workers/${process.env['APP_CONTEXT']}`)({events, queues, db});
}

// }
