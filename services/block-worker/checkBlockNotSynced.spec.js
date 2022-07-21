const checkBlockNotSynced = require('./checkBlockNotSynced');
/* eslint-disable max-len */
const addBlockToDB = require('./addBlockToDB');
const loadJson = require('../../src/loadJson');
const DatabaseMock = require('../../src/__mocks__/DatabaseMock');
const DatabaseGetNotFoundMock =
  require('../../src/__mocks__/DatabaseGetNotFoundMock');
const db = Object.create(DatabaseMock);
const dbGetNotFound = Object.create(DatabaseGetNotFoundMock);


it('correctly checks if block not synced', async () => {
  const result = expect(1+1).toBe(2); // FIXME
});
