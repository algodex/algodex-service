#!/usr/bin/env node

/*
 * Algodex Service
 * Copyright (C) 2022 Algodex VASP (BVI) Corp.
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

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
