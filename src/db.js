const {InvalidConfiguration} = require('./Errors');
const PouchDB = require('pouchdb-core');
PouchDB.plugin(require('pouchdb-adapter-http'));

let db;

module.exports = function() {
  if (
    typeof process.env['COUCHDB_URL'] === 'undefined'
  ) {
    throw new InvalidConfiguration('Couchdb not configured!');
  }

  const url = process.env['COUCHDB_URL'];

  if (typeof db === 'undefined') {
    db = new PouchDB(url);
  }
  return db;
};
