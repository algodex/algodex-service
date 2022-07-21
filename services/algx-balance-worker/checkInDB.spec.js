const {DatabaseMock,
  DatabaseExpectedErrorMock,
  DatabaseBadErrorMock, UnexpectedError} =
    require('../../src/__mocks__/DatabaseMock');

const checkInDB = require('./checkInDB');
const algx_balance_data =
  require('../../src/__tests__/schema/db/algx_balance.json');

test('found result in DB', async () => {
  const result = await checkInDB(DatabaseMock, 444);
  expect(result).toBe(true);
});

test('found result in DB', async () => {
  const result = await checkInDB(DatabaseExpectedErrorMock, 444);
  expect(result).toBe(false);
});

test('unexpected error in DB', async () => {
  try {
    await checkInDB(DatabaseBadErrorMock, 444);
    throw new Error('unreachable code');
  } catch (e) {
    expect(e).toBeInstanceOf(UnexpectedError);
  }
});
