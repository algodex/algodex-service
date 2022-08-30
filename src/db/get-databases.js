const dbConfig = require('./db-config.js')();
const getDatabase = require('./db');
const convertURL = require('./convert-db-url');

require('dotenv').config();

const couchBaseURL = process.env['COUCHDB_BASE_URL'] ||
    'http://admin:dex@localhost:5984';

module.exports = function(prepend = '') {
  const databases = {};
  console.log('Getting DBs');
  for (let i = 0; i < dbConfig.length; i++) {
    const dbName = dbConfig[i].dbName;
    const dbURL = convertURL(couchBaseURL + '/' + prepend + dbName);
    // console.log('getting db: ' + dbURL);
    databases[dbName] = getDatabase(dbURL);
    databases[dbName].appendOnly = dbConfig[i].appendOnly;
    databases[dbName].dbName = dbName;
  }
  return databases;
};
