#!/usr/bin/env node

/**
 * Server configures the Queues and starts a Service based on Context
 */
import dotenv from 'dotenv';
dotenv.config();

import {
  getDatabase,
  getQueues,
  getEvents,
  getEnvironment,
} from './src/index.js';

// Configure Database
const db = await getDatabase();
// Configure Redis
const queues = await getQueues();
const events = await getEvents();

const APP_CONTEXT = getEnvironment(
    'APP_CONTEXT',
    {throwError: false},
) || 'socket';
const APP_WORKER = getEnvironment(
    'APP_WORKER',
    {throwError: false},
) || 'blocks';

/**
 * Run the Server
 * @param {number} round
 * @param {string} context
 * @param {string} worker
 * @param {boolean} skip
 * @return {Promise<*>}
 */
async function run({round=1, context, worker, skip=true}={}) {
  return (await import(
      `./src/services/${context || APP_CONTEXT}.js`
  )).default({
    queue: worker || APP_WORKER,
    events,
    queues,
    round,
    db,
    skip,
  });
}

/**
 * Run the Broker
 * @return {Promise<*>}
 */
async function runBroker() {
  return db.query('sync/blocks', {
    limit: 1,
    descending: true,
  }).then(async ({rows}) => {
    let round;
    if (rows && rows.length > 0 && Number.isInteger(rows[0].key)) {
      round = rows[0].key;
    }
    return await run({round, context: 'broker', skip: true});
  }).catch((e)=>{
    console.log(e);
  });
}

if (APP_CONTEXT === 'broker') {
  await runBroker();
} else {
  await run();
}
