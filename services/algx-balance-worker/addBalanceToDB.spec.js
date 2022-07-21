const {DatabaseMock,
  DatabaseExpectedErrorMock,
  DatabaseBadErrorMock, UnexpectedError} =
    require('../../src/__mocks__/DatabaseMock');

const addBalanceToDB = require('./addBalanceToDB');
const algx_balance_data =
  require('../../src/__tests__/schema/db/algx_balance.json');


it('adds balance to DB', async () => {
  const result = await addBalanceToDB(DatabaseMock, algx_balance_data);
  expect(result).toEqual('put');
});

it('does not throw error when conflict adding to DB', async () => {
  const expectedCalls = [
    [
      {
        '_id': '16255313',
        '_rev': '1-4a4adaf2eca6140caa62f5693af8499c',
        'changes': [
          {
            'account': 'ODXX4TP3IYQKIMFRYLA7AFKKFXUTFCXLU3YZVTGNW4VUNZBGKV7LQBG2DQ',
            'balance': 3571429,
          },
          {
            'account': '4O2N4LS5MJ37PK6OVBWEFGZWZ4VYUPDWB4LKEVKRQ2PWCKXOZ7IKWARKDY',
            'balance': 0,
          },
        ],
      },
    ],
  ];
  try {
    await addBalanceToDB(DatabaseExpectedErrorMock, algx_balance_data);
    expect(DatabaseExpectedErrorMock.put.mock.calls).toEqual(expectedCalls);
  } catch (e) {
    throw new Error('should not have error from conflict');
  }
});


it('does throw error adding to DB with unexpected error', async () => {
  try {
    await addBalanceToDB(DatabaseBadErrorMock, algx_balance_data);
  } catch (e) {
    expect(e).toBeInstanceOf(UnexpectedError);
  }
});
