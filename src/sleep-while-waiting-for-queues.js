const getQueueCounts = require('./get-queue-counts');
const sleep = require('./sleep');

const sleepWhileWaitingforQueues = async (queues) => {
  while (await getQueueCounts(queues) > 50) {
    console.log('Sleeping for 200ms while waiting for ' +
      JSON.stringify(queues) + '!');
    await sleep(200);
  }
};

module.exports = sleepWhileWaitingforQueues;

