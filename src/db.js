import {InvalidConfiguration, InvalidParameter} from './errors/index.js';
// import getLogger from '@exports/logger';
import PouchDB from 'pouchdb';
// import PouchHTTP from 'pouchdb-adapter-http';
// import PouchMem from 'pouchdb-adapter-memory';
import getLogger from './logger.js';
// PouchDB.plugin(PouchHTTP);
// PouchDB.plugin(PouchMem);
const log = getLogger();
// import PouchHTTP from 'pouchdb-adapter-http';
// import PouchMem from 'pouchdb-adapter-memory';
// const {InvalidConfiguration, InvalidParameter} = require('./errors');
// const log = require('./logger');
// const PouchDB = require('pouchdb-core');

// PouchDB.plugin(require('pouchdb-adapter-http'));
// PouchDB.plugin(require('pouchdb-adapter-memory'));

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
  return this.get(_id.toString())
      .catch((err)=>{
        if (err.error === 'not_found') {
          return this.post({_id: _id, ...doc});
        }
      });
}; ;

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
  console.log(url);

  if (typeof db === 'undefined') {
    // db = new PouchDB(url, {skip_setup: true});
    db = new PouchDB(url);
  }
  return db;
};
