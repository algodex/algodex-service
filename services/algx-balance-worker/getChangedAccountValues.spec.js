const blockTestnet16627873 = require('../../src/__tests__/blocks/block-testnet-16627873.json');
const getChangedAccountValues = require('./getChangedAccountValues');


test('gets correct changed values', () => {
  const ownerToBalanceMap = new Map();
  process.env.ALGX_ASSET_ID = 15322902;
  ownerToBalanceMap.set('4WD4SFG5LF4WJLQ7E7MHY7L7S2A6HPBXNYXRYFS2V7HONO5UMKMEAUPX3A',
      {
        'balance': 174082,
        'round': 1662786,
      });
  const changedValues = getChangedAccountValues(ownerToBalanceMap, blockTestnet16627873);
  expect(changedValues).toEqual(
      [{'account': '4WD4SFG5LF4WJLQ7E7MHY7L7S2A6HPBXNYXRYFS2V7HONO5UMKMEAUPX3A',
        'balance': 164830},
      {'account': 'DUE565PAEADF3L5PNQ7TJNGEDZ5GN7STBUM2LSFVSBMZKSHV52U46SVFWI',
        'balance': 9252}]);
  // expect(changedValues)
});
