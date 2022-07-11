const dbConfig = require('./db-config.js')();
const getDatabase = require('./db');
require('dotenv').config();

const couchBaseURL = process.env['COUCHDB_BASE_URL'] ||
    'http://admin:dex@localhost:5984';

module.exports = function(prepend = '') {
  const databases = {};
  for (let i = 0; i < dbConfig.length; i++) {
    const dbName = dbConfig[i].dbName;
    databases[dbName] = getDatabase(couchBaseURL + '/' + prepend + dbName);
    databases[dbName].appendOnly = dbConfig[i].appendOnly;
    databases[dbName].dbName = dbName;
  }
  return databases;
};
