const getDatabase = require('../db/db');
const PouchDB = require('pouchdb-core');
// PouchDB.plugin(require('pouchdb-adapter-memory'));
require('dotenv').config();

jest.mock('pouchdb-core', () => {
  return jest.fn().mockImplementation(() => {
    return {};
  });
});

test('database can be constructed', async ()=>{
  const dbName = 'testdb';
  const dbURL = process.env.COUCHDB_BASE_URL + '/' + dbName;

  const dbSingleton = getDatabase(dbURL);
  const singletonInfo = await dbSingleton.info();
  // expect(dbSingleton).toBeInstanceOf(PouchDB);
  expect(singletonInfo.db_name).toEqual(dbName);

  const db = getDatabase(dbURL);
  expect(db).toBe(dbSingleton);
  const info = await dbSingleton.info();
  expect(info).toEqual(singletonInfo);
});

