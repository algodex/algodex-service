/* eslint-disable max-len */
const block1 = require('../../src/__tests__/block-testnet-16583462.json');
const getChangedAccountValues = require('./getChangedAccountValues');
const {initTestnetEnv} = require('../../src/initTestnetEnv');

beforeAll(async () => {
  await initTestnetEnv();
});
test('Can get changed balance data from block', () => {
  const ownerToBalanceWithRoundsJson =
    `[["DFZF6OGWPLVXMNB6AJY3IZZRJYEUKVYRKFT2UDA4EXAHLCEAPSIKGNMBMQ",{"balance":0,"round":16583459}],
      ["MLKMGZCB73W34VZMKOTKON6PZQKB2UHNA63XPSWOAXU6A5RT3TNUTS3NHA",{"balance":3333,"round":16583459}]]`;
  const ownerToBalanceWithRounds =
    new Map(JSON.parse(ownerToBalanceWithRoundsJson));
  const changedValues =
    getChangedAccountValues(ownerToBalanceWithRounds, block1);
  expect(changedValues).toEqual([{'account': 'MLKMGZCB73W34VZMKOTKON6PZQKB2UHNA63XPSWOAXU6A5RT3TNUTS3NHA', 'balance': 6673}, {'account': 'OZYJXXGTVLR25273QI3GYTLBC5ZR2OPB6EQNCZPSAHWAUOYOOSLLDDWEJY', 'balance': 3561}]);
});
