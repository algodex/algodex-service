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

const Redis = require('ioredis');
const {InvalidConfiguration} = require('./Errors');

let events;

/**
 * Get Events
 *
 * Return a singleton instance of Redis. Optionally
 * pass in an instance to use as the singleton.
 * Passing in redis is useful for testing.
 *
 * @example
 *   const getEvents = require('./src/events');
 *   const events = getEvents();
 *
 * @return {Redis}
 */
module.exports = function() {
  if (
    typeof process.env['REDIS_PORT'] === 'undefined' ||
    typeof process.env['REDIS_ADDRESS'] === 'undefined'
  ) {
    throw new InvalidConfiguration('Redis not configured!');
  }

  const port = parseInt(process.env['REDIS_PORT']);
  const address = process.env['REDIS_ADDRESS'];

  if (typeof events === 'undefined') {
    // Define connection
    events = new Redis(port, address);
  }
  return events;
};
