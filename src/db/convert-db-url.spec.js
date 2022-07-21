const convertURL = require('./convert-db-url');

test('converts url', () => {
  process.env.INTEGRATION_TEST_MODE = '1';
  const converted = convertURL('http://admin@dex:localhost:2131/escrow');
  expect(converted).toEqual('http://admin@dex:localhost:2131/integration_test__escrow');

  process.env.INTEGRATION_TEST_MODE = '0';
  const converted2 = convertURL('http://admin@dex:localhost:2131/escrow');
  expect(converted2).toEqual('http://admin@dex:localhost:2131/escrow');

  delete process.env.INTEGRATION_TEST_MODE;
  const converted3 = convertURL('http://admin@dex:localhost:2131/escrow');
  expect(converted3).toEqual('http://admin@dex:localhost:2131/escrow');
});
