/* 
 * Algodex Service 
 * Copyright (C) 2022 Algodex VASP (BVI) Corp.
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

const dbConfig = require('./db-config.js')();
const getDatabase = require('./db');
const convertURL = require('./convert-db-url');

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
