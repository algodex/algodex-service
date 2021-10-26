import getLogger from '../logger.js';
import {Worker as BullWorker} from 'bullmq';
// const {isWindows} = require('nodemon/lib/utils');
// const getLogger = require('../src/logger');
const log = getLogger();
const isWindows = process.platform === 'win32';

/**
 * Windows Worker
 *
 * Patch bull to be the same interface as BullMQ.Worker
 * in a Windows environment.
 */
export class WinWorker {
  /**
   * Return a Worker
   * @param {string} queue
   * @param {function} processFn
   * @param {number} concurrency
   * @return {Promise<Queue>}
   */
  constructor(queue, processFn, {concurrency}) {
    return this.getQueue(queue, concurrency, processFn);
  }

  /**
   * MonkeyPatch an Async GetQueue
   * @param {string} queue
   * @param {number} concurrency
   * @param {function} processFn
   * @return {Promise<*>}
   */
  async getQueue(queue, concurrency, processFn) {
    const getQ = (await import('../services/messages/queues.js')).default;
    const queueInst = (await getQ())[queue];
    queueInst.process(queue, concurrency, processFn);
    return queueInst;
  }
}

/**
 * Get the dictionary of Queues
 * @param {string} queue
 * @param {object} queues
 * @return {Promise<void>}
 */
export default async function run({queue, queues}) {
  log.debug({
    description: 'running worker',
    queue,
  });
  const Worker = isWindows ? WinWorker : BullWorker;

  // Lighten the load on the broker and do batch processing
  const worker = await new Worker(
      queue,
      (await import(`../services/worker/${queue}.js`)).default,
      {connection: queues.connection, concurrency: 10},
  );

  worker.on('error',
      (err)=>log.error({
        msg: '👷 worker failure!',
        data: err,
      }),
  );
  worker.on('failed',
      (job, err)=>{
        log.error({
          msg: '👷 job failed!',
          data: err,
        });
      },
  );
  // worker.on('completed',
  //     (job, result)=>log.debug({
  //       name: `${name}/job/${job.id}`,
  //       msg: '👷 job completed',
  //       data: result,
  //     }),
  // );
  // worker.on('waiting',
  //     (jobId)=>log.debug({
  //       name: `${name}/job/${jobId}`,
  //       msg: '👷 job waiting...',
  //     }),
  // );
};
