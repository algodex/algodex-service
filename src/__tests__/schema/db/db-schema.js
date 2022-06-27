const withDBSchemaCheck = require('../../../schema/with-db-schema-check');
const fs = require('fs');

const testSchema = (dbName) => {
  test(`${dbName} schema should pass`, ()=>{
    const json =
      fs.readFileSync(`./src/__tests__/schema/db/${dbName}.json`);
    const obj = JSON.parse(json);
    const isValid = withDBSchemaCheck(dbName, obj);
    expect(isValid).toBeTruthy();
  });
};

testSchema('indexed_escrow');
testSchema('formatted_escrow');
testSchema('escrow');
testSchema('assets');
testSchema('formatted_history');


