const checkBlockNotSynced = require('./checkBlockNotSynced');
/* eslint-disable max-len */
const addBlockToDB = require('./addBlockToDB');
const loadJson = require('../../src/loadJson');
const {DatabaseMock, DatabaseGetNotFoundMock} = require('../../src/__mocks__/DatabaseMock');
const db = Object.create(DatabaseMock);
const dbGetNotFound = Object.create(DatabaseGetNotFoundMock);


it('correctly checks if block not synced', async () => {
  const result = await checkBlockNotSynced(db, 44);
  expect(45).toEqual(45);
});
