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

const getQueueCounts = require('./get-queue-counts');
const sleep = require('./sleep');
const throttle = require('lodash.throttle');

const sleepWhileWaitingforQueues = async (queues, limit=250) => {
  while (await getQueueCounts(queues) > limit) {
    throttle(() => {
      console.log('Sleeping for 200ms while waiting for ' +
      JSON.stringify(queues) + '!');
    }, 1000);

    await sleep(200);
  }
};

module.exports = sleepWhileWaitingforQueues;

