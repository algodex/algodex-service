import {getLogger, InvalidConfiguration, InvalidParameter} from './index.js';
import PouchDB from 'pouchdb';
// const PouchDB = require('pouchdb-core');
// import PouchHTTP from 'pouchdb-adapter-http';
// import PouchMem from 'pouchdb-adapter-memory';
// PouchDB.plugin(PouchHTTP);
// PouchDB.plugin(PouchMem);
const log = getLogger();

let db;

PouchDB.prototype.generateDocId = function generateDocId(type, _id) {
  let res;
  switch (type) {
    case 'block':
      const partition = _id >= 10000 ?
        `${_id}`.slice(0, `${_id}`.length - 4) + `0000` :
        1;
      res = `${partition}:${_id}`;
      break;
    default:
      throw new InvalidParameter('Invalid parameters!');
  }
  return res;
};

PouchDB.prototype.save = function save(_id, doc) {
  log.debug({
    msg: '📤 saving to database',
  });
  return this.get(_id.toString())
      .then(({ok, id, rev})=>{
        return {
          _id: id,
          _rev: rev,
          ok,
        };
      })
      .catch((error)=>{
        if (error.error === 'not_found') {
          return this.post({_id: _id, ...doc}).catch((e)=>{
            console.log(e);
          });
        } else {
          throw error;
        }
      });
};

/**
 * Get the Database
 * @return {PouchDB}
 */
export default function getDatabase() {
// module.exports = function getDatabase() {
  const env = typeof import.meta.env === 'undefined' ?
    process.env :
    import.meta.env;
  // Check Configuration
  if (
    // typeof process.env.COUCHDB_URL === 'undefined'
    typeof env.COUCHDB_URL === 'undefined' &&
    typeof env.SNOWPACK_PUBLIC_COUCHDB_URL === 'undefined'
  ) {
    const e = new InvalidConfiguration('Couchdb not configured!');
    log.error(e);
    throw e;
  }

  const url = env.COUCHDB_URL || env.SNOWPACK_PUBLIC_COUCHDB_URL;
  // log.debug(url);

  if (typeof db === 'undefined') {
    // db = new PouchDB(url, {skip_setup: true});
    db = new PouchDB(url);
  }
  return db;
};
