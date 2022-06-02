const dbConfig = require('../src/db-config.js')();
const getDatabase = require('../src/db');

const couchBaseURL = process.env['COUCHDB_BASE_URL'] ||
    'http://admin:dex@localhost:5984';

module.exports = function() {
  const databases = {};
  for (let i = 0; i < dbConfig.length; i++) {
    const dbName = dbConfig[i].dbName;
    databases[dbName] = getDatabase(couchBaseURL + '/' + dbName);
  }
  return databases;
};
