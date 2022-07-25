const withDBSchemaCheck = require('../../../schema/with-db-schema-check');
const fs = require('fs');
const getDatabases = require('../../../db/get-databases');

const testSchema = dbName => {
  test(`${dbName} schema should pass`, ()=>{
    const json =
      fs.readFileSync(`./src/__tests__/schema/db/${dbName}.json`);
    const obj = JSON.parse(json);
    const isValid = withDBSchemaCheck(dbName, obj);
    expect(isValid).toBeTruthy();
  });
};

const databases = getDatabases();
Object.keys(databases)
    .filter(dbName => dbName !== 'prices')
    .forEach(dbName => testSchema(dbName));


