const getQueueCounts = require('./get-queue-counts');
const sleep = require('./sleep');

const sleepWhileWaitingforQueues = async (queues) => {
  while (await getQueueCounts(queues) > 10) {
    console.log('Sleeping for 1 second while waiting for ' +
      JSON.stringify(queues) + '!');
    await sleep(1000);
  }
};

module.exports = sleepWhileWaitingforQueues;

