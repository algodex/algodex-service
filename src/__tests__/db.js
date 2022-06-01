const {InvalidConfiguration} = require('../Errors');
const getDatabase = require('../db');
const PouchDB = require('pouchdb-core');
PouchDB.plugin(require('pouchdb-adapter-memory'));

test( 'database should fail with InvalidConfiguration', ()=>{
  delete process.env.COUCHDB_URL;
  expect(getDatabase).toThrow(InvalidConfiguration);
});

test('database can be constructed', async ()=>{
  process.env.COUCHDB_URL = 'test-runner';
  const dbSingleton = getDatabase();
  const singletonInfo = await dbSingleton.info();
  expect(dbSingleton).toBeInstanceOf(PouchDB);
  expect(singletonInfo.db_name).toEqual(process.env.COUCHDB_URL);

  const db = getDatabase();
  expect(db).toBe(dbSingleton);
  const info = await dbSingleton.info();
  expect(info).toEqual(singletonInfo);
});
