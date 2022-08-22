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

