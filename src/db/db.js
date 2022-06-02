const {InvalidConfiguration} = require('../Errors');
const PouchDB = require('pouchdb-node');

const db = [];

// This function should be cleaned up in a future PR
module.exports = function(dbUrl) {
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
