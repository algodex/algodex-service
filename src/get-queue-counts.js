const getQueues = require('./queues');
const queues = getQueues();

const getQueueCounts = async queueNames => {
  let counts = 0;
  for (let i = 0; i < queueNames.length; i++) {
    const name = queueNames[i];
    counts += await queues[name].getActiveCount() +
      await queues[name].getWaitingCount();
  }
  return counts;
};

module.exports = getQueueCounts;
