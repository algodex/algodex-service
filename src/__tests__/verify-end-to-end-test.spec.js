// beforeAll(async () => {
//   await sleep(1);
//   // await runScripts();
// }, 60*1000);
const getDatabases = require('../db/get-databases');
const fs = require('fs');
const path = require('path');

test('verify end to end test', async () => {
  expect(1+1).toEqual(2);
  const databases = await getDatabases();

  // FIXME - fix later
  const skipDBSet = new Set(['rewards_distribution',
    'rewards', 'vested_rewards']);

  const verificationFileNames = Object.keys(databases)
      .filter(dbName => !skipDBSet.has(dbName)).map(dbName => {
        return `../../integration_test/validation_data/${dbName}.txt`;
      });
  const testFileNames = Object.keys(databases)
      .filter(dbName => !skipDBSet.has(dbName)).map(dbName => {
        return `../../integration_test/test_data/${dbName}.txt`;
      });
  const verificationMap = new Map();
  const testMap = new Map();
  expect(testFileNames.length).toBe(verificationFileNames.length);
  if (testFileNames.length != verificationFileNames.length) {
    throw new Error('file counts dont match');
  }
  for (let i = 0; i < testFileNames.length; i++) {
    const testData = fs.readFileSync(path.resolve(__dirname, testFileNames[i]), 'utf8');
    const verificationData = fs.readFileSync(path.resolve(__dirname, verificationFileNames[i]), 'utf8');
    const name = testFileNames[i].substring(testFileNames[i].lastIndexOf('/') + 1);
    verificationMap.set(name, verificationData);
    testMap.set(name, testData);
  }
  expect(verificationMap.size).toBe(testMap.size);
  const keysSet = new Set([...Array.from(verificationMap.keys()), ...Array.from(testMap.keys())]);
  const keys = Array.from(keysSet);
  const removeRevision = entry => {
    if (entry.value) {
      delete entry.value.rev;
    }
    return entry;
  };
  const sortById = objs => {
    objs.sort((a, b) => (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0));
  };
  keys.forEach(key => {
    const testData = JSON.parse(testMap.get(key));
    const verifData = JSON.parse(verificationMap.get(key));
    const testDataNoRev = testData.rows.map(removeRevision);
    const verifDataNoRev = verifData.rows.map(removeRevision);
    sortById(testDataNoRev);
    sortById(verifDataNoRev);
    try {
      expect(testDataNoRev).toEqual(verifDataNoRev);
    } catch (e) {
      console.error(`Mismatch in ${key} !`);
      throw e;
    }
  });
});

