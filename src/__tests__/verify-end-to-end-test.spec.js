// beforeAll(async () => {
//   await sleep(1);
//   // await runScripts();
// }, 60*1000);
const getDatabases = require('../db/get-databases');
const fs = require('fs');
const path = require('path');

test('verify end to end test', async () => {
  const databases = await getDatabases();

  // FIXME - fix later
  const skipDBSet = new Set(['rewards_distribution',
    'rewards', 'vested_rewards', 'logging', 'view_cache']);
  // FIXME - add view_cache to here

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
  const removeRevisionAndOtherData = entry => {
    delete entry._rev;
    entry.lastVerified = entry.lastVerified ? 123456 : undefined;
    if (entry.data?.indexerInfo?.round) {
      entry.data.indexerInfo.round = 12345;
    }
    if (entry.data?.indexerInfo?._rev) {
      delete entry.data.indexerInfo._rev;
    }
    if (entry.data?.lastUpdateRound) {
      delete entry.data.lastUpdateRound;
      delete entry.data.lastUpdateUnixTime;
    }

    if (entry.data?.escrowInfo) {
      // This can vary based on heavy vs light mode
      delete entry.data.escrowInfo.apat;
      delete entry.data.escrowInfo.block;
      delete entry.data.escrowInfo.status;
      delete entry.data.escrowInfo.ts;
      delete entry.data.escrowInfo.type;
    }

    if ('current-round' in entry) {
      entry['current-round'] = 12345;
    }
    if ('round' in entry) {
      entry['round'] = 12345;
    }
    return entry;
  };
  const sortById = objs => {
    objs.sort((a, b) => (a._id > b._id) ? 1 : ((b._id > a._id) ? -1 : 0));
  };
  keys.forEach(key => {
    const testData = JSON.parse(testMap.get(key));
    const verifData = JSON.parse(verificationMap.get(key));
    const testDataNoRev = testData
        .filter(doc => !doc._id.includes('_design/'))
        .map(removeRevisionAndOtherData);
    const verifDataNoRev = verifData
        .filter(doc => !doc._id.includes('_design/'))
        .map(removeRevisionAndOtherData);
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

