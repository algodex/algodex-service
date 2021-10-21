const {InvalidConfiguration} = require('../Errors');
const getDatabase = require('../db');
const PouchDB = require('pouchdb-core');

if (typeof process.env.INTEGRATION_TEST === 'undefined') {
  PouchDB.plugin(require('pouchdb-adapter-memory'));
}

describe('Database Suite', function() {
  test('can be created', async ()=>{
    process.env.COUCHDB_URL = process.env.COUCHDB_URL || 'test-runner';
    const dbSingleton = getDatabase();
    const singletonInfo = await dbSingleton.info();
    expect(dbSingleton).toBeInstanceOf(PouchDB);
    expect(singletonInfo.db_name).toEqual(process.env.COUCHDB_URL);
  });

  test('should be singleton', async ()=>{
    process.env.COUCHDB_URL = process.env.COUCHDB_URL || 'test-runner';
    const dbSingleton = getDatabase();
    const singletonInfo = await dbSingleton.info();
    expect(dbSingleton).toBeInstanceOf(PouchDB);
    expect(singletonInfo.db_name).toEqual(process.env.COUCHDB_URL);

    const db = getDatabase();
    expect(db).toBe(dbSingleton);
    const info = await dbSingleton.info();
    expect(info).toEqual(singletonInfo);
  });

  test( 'fails on missing database url', ()=>{
    delete process.env.COUCHDB_URL;
    expect(getDatabase).toThrow(InvalidConfiguration);
  });
});
