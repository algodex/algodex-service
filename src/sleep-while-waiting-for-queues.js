const getQueueCounts = require('./get-queue-counts');
const sleep = require('./sleep');

const sleepWhileWaitingforQueues = async (queues, limit=50) => {
  while (await getQueueCounts(queues) > limit) {
    console.log('Sleeping for 200ms while waiting for ' +
      JSON.stringify(queues) + '!');
    await sleep(200);
  }
};

module.exports = sleepWhileWaitingforQueues;

