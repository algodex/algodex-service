const {InvalidConfiguration} = require('./Errors');
const PouchDB = require('pouchdb-core');
PouchDB.plugin(require('pouchdb-adapter-http'));

const db = [];

// This function should be cleaned up in a future PR
module.exports = function(dbUrl = process.env['COUCHDB_URL']) {
  const url = dbUrl;

  console.log({url});
  if (
    typeof url === 'undefined'
  ) {
    throw new InvalidConfiguration('Couchdb not configured!');
  }

  if (!db.hasOwnProperty(url)) {
    db[url] = new PouchDB(url);
  }
  return db[url];
};
