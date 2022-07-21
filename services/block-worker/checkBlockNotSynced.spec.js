const checkBlockNotSynced = require('./checkBlockNotSynced');
/* eslint-disable max-len */
const {DatabaseMock,
  DatabaseExpectedErrorMock, DatabaseBadErrorMock} = require('../../src/__mocks__/DatabaseMock');

it('correctly gets block if synced', async () => {
  const result = await checkBlockNotSynced(DatabaseMock, 44); // FIXME
  expect(result).toEqual(true);
  const result2 = await checkBlockNotSynced(DatabaseExpectedErrorMock, 44);
  expect(result2).toEqual(false);
  try {
    await checkBlockNotSynced(DatabaseBadErrorMock, 44);
    throw new Error('unreachable code');
  } catch (e) {
    expect(e).toBeInstanceOf(Error);
  }
});
