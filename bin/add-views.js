#!/usr/bin/env node

const PouchDB = require('pouchdb');
PouchDB.plugin(require('pouchdb-erase'));

// const databases = require('../src/db/db-config.js')();
const getDatabases = require('../src/db/get-databases');
const databases = getDatabases();
const databaseConfigs = require('../src/db/db-config.js')();

// const dbEndpoint = 'http://127.0.0.1:5984';
// const dbUsername = 'admin';
// const dbPassword = 'dex';

const args = require('minimist')(process.argv.slice(2));
if (args.redoEveryDBExcept !== undefined &&
    args.redoEveryDBExcept.length === 0) {
  throw new Error('Views are missing!');
}
const excludeDBsSet = args.redoEveryDBExcept ? args.redoEveryDBExcept.split(',')
    .reduce((set, view) => {
      set.add(view);
      return set;
    }, new Set()) : new Set();

const dbNameToDatabase = Object.keys(databases).reduce((map, dbKey) => {
  console.log('db key: ' + dbKey);
  const db = databases[dbKey];
  map.set(dbKey, db);
  return map;
}, new Map());

databaseConfigs.forEach(database => {
  // const initializedDB = new PouchDB(dbEndpoint + '/' + database.dbName, {
  //   auth: {
  //     username: dbUsername,
  //     password: dbPassword,
  //   },
  // });
  // console.log('zz' + database.dbName);
  const initializedDB = dbNameToDatabase.get(database.dbName);
  // console.log({dbNameToDatabase});

  if (!database.design) {
    console.log('returning');
    return;
  }
  initializedDB.get(database.design._id).then(res=>{
    console.log('Index Found');
    if (excludeDBsSet.size > 0 && !excludeDBsSet.has(database.dbName)) {
      console.log('Redoing index for: ' +
        database.dbName + '/' + database.design._id);
      initializedDB.put({...database.design, _rev: res._rev}).catch(e=>{
        console.log('Update error', e);
        throw e;
      });
    } else if (excludeDBsSet.size > 0 && excludeDBsSet.has(database.dbName)) {
      console.log('Skipping redo for '+database.dbName+' since it is excluded');
    }
  }).catch(e=>{
    console.log('Error Fetching Index', e.error);
    if (e.error === 'not_found') {
      console.log('Adding index');
      initializedDB.put({...database.design}).catch(e=>{
        console.log('Create Error', e);
      });
    } else {
      throw e;
    }
  });
});