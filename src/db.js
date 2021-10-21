const {InvalidConfiguration, InvalidParameter} = require('./errors');
const log = require('./logger');
const PouchDB = require('pouchdb-core');
PouchDB.plugin(require('pouchdb-adapter-http'));
PouchDB.plugin(require('pouchdb-adapter-memory'));

let db;


PouchDB.prototype.generateDocId = (type, _id) => {
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

PouchDB.prototype.save = function(_id, doc) {
  return this.get(_id.toString())
      .catch((err)=>{
        if (err.error === 'not_found') {
          return this.post({_id: _id, ...doc});
        }
      });
};

module.exports = function getDatabase() {
  // Check Configuration
  if (
    typeof process.env.COUCHDB_URL === 'undefined'
  ) {
    const e = new InvalidConfiguration('Couchdb not configured!');
    log(e);
    throw e;
  }

  const url = process.env.COUCHDB_URL;

  if (typeof db === 'undefined') {
    // db = new PouchDB(url, {skip_setup: true});
    db = new PouchDB(url);
  }
  return db;
};
