const checkBlockNotSynced = require('./checkBlockNotSynced');
/* eslint-disable max-len */
const addBlockToDB = require('./addBlockToDB');
const loadJson = require('../../src/loadJson');
const {DatabaseMock,
  DatabaseGetNotFoundMock, DatabaseBadErrorMock} = require('../../src/__mocks__/DatabaseMock');
const db = Object.create(DatabaseMock);
const dbGetNotFound = Object.create(DatabaseGetNotFoundMock);
const dbBadError = Object.create(DatabaseBadErrorMock);

it('correctly gets block if synced', async () => {
  const result = await checkBlockNotSynced(db, 44); // FIXME
  expect(result).toEqual(true);
  const result2 = await checkBlockNotSynced(dbGetNotFound, 44);
  expect(result2).toEqual(false);
  try {
    await checkBlockNotSynced(dbBadError, 44);
    throw new Error('unreachable code');
  } catch (e) {
    expect(e).toBeInstanceOf(Error);
  }
});
