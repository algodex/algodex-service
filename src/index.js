export {default as getDatabase} from './db.js';
export {waitForBlock, getBlock, getAppsBlockRange} from './explorer.js';
export {default as getLogger} from './logger.js';
export {createConsecutiveArray, createConsecutiveObject} from './util.js';
// export {default as getQueues} from './queues';
// export {default as getEvents} from './events';
export {default as DexError} from './errors/DexError.js';
export {InvalidConfiguration, InvalidParameter} from './errors/index.js';
// export {default as assetWorker} from './worker/assets';

// const getDatabase = require('./db');
// const getExplorer = require('./explorer');
// const getLogger = require('./logger');
// const util = require('./util');
// const getQueues = require('./queues');
// const getEvents = require('./events');
// const DexError = require('./errors/index');
// const InvalidConfiguration = require('./errors/InvalidConfiguration');
// const InvalidParameter = require('./errors/InvalidParameter');
//
// export default {
//   getDatabase,
//   getExplorer,
//   getLogger,
//   util,
//   getQueues,
//   getEvents,
//   DexError,
//   InvalidParameter,
//   InvalidConfiguration,
// };
