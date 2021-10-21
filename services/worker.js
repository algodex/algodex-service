const {isWindows} = require('nodemon/lib/utils');
const getLogger = require('../src/logger');
const log = getLogger();
/**
 * Windows Worker
 *
 * Patch bull to be the same interface as BullMQ.Worker
 * in a Windows environment.
 */
class WinWorker {
  /**
   * Return a Worker
   * @param {string} queue
   * @param {function} processFn
   * @param {number} concurrency
   * @return {Queue}
   */
  constructor(queue, processFn, {concurrency}) {
    const queueInst = require('../src/queues')()[queue];
    queueInst.process(queue, concurrency, processFn);
    return queueInst;
  }
}

module.exports = ({queue, queues}) =>{
  const Worker = isWindows ? WinWorker : require('bullmq').Worker;

  // Lighten the load on the broker and do batch processing
  const worker = new Worker(
      queue,
      require(`../src/worker/${queue}`),
      {connection: queues.connection, concurrency: 1},
  );

  worker.on('error',
      (err)=>log.error(err.message),
  );
  worker.on('failed',
      (job, err)=>log.error(err.message),
  );
  worker.on('completed',
      (job, result)=>log.debug({event: 'completed', data: result}),
  );
  worker.on('waiting',
      (jobId)=>log.debug({type: 'QueueWaiting', description: jobId}),
  );
};
