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

const getDatabase = require('../db/db');
// const PouchDB = require('pouchdb-node');
// PouchDB.plugin(require('pouchdb-adapter-memory'));
require('dotenv').config();

jest.mock('pouchdb-node', () => {
  return jest.fn().mockImplementation(() => {
    return {};
  });
});

test('database can be constructed', async ()=>{
  const dbName = 'testdb';
  if (!process.env.COUCHDB_BASE_URL) {
    process.env.COUCHDB_BASE_URL = 'http://localhost';
  }
  const dbURL = process.env.COUCHDB_BASE_URL + '/' + dbName;

  const dbSingleton = getDatabase(dbURL);
  // const singletonInfo = await dbSingleton.info();
  // expect(dbSingleton).toBeInstanceOf(PouchDB);
  // expect(singletonInfo.db_name).toEqual(dbName);

  const db = getDatabase(dbURL);
  expect(db).toBe(dbSingleton);
  // const info = await dbSingleton.info();
  // expect(info).toEqual(singletonInfo);
});

