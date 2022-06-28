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

