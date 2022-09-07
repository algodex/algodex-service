
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

