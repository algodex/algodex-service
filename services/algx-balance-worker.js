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


const bullmq = require('bullmq');
const handleAlgxBalanceJob =
  require('./algx-balance-worker/handleAlgxBalanceJob');

const Worker = bullmq.Worker;
const process = require('node:process');
// const algosdk = require('algosdk');
const convertQueueURL = require('../src/convert-queue-url');

module.exports = ({queues, databases}) => {
  if (!process.env.ALGX_ASSET_ID) {
    throw new Error('ALGX_ASSET_ID is not set!');
  }
  const algxBalanceDB = databases.algx_balance;

  const algxBalanceWorker =
    new Worker(convertQueueURL('algxBalance'),
        async job => handleAlgxBalanceJob(job, algxBalanceDB)
        , {connection: queues.connection, concurrency: 1});

  algxBalanceWorker.on('error', err => {
    console.error( {err} );
    throw err;
  });
};

