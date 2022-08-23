/* eslint-disable max-len */


test('has replaced view names', () => {
  process.env.ALGODEX_ALGO_ESCROW_APP = '1312312312';
  process.env.TINYMAN_APP = '21332131';
  const dbConfig = require('./db-config')();

  const viewMap = dbConfig[0].design.views.orders.map;


  expect(viewMap.includes('txn.txn.apid === \'<ALGODEX_ALGO_ESCROW_APP>\'')).toBe(false);
  expect(viewMap.includes(`txn.txn.apid === ${process.env.ALGODEX_ALGO_ESCROW_APP}`)).toBe(true);

  const tinyManMap = dbConfig[0].design.views.tinymanTrades.map;
  expect(tinyManMap.includes('.filter(txn => txn.apid === \'<TINYMAN_APP>\')')).toBe(false);
  expect(tinyManMap.includes(`.filter(txn => txn.apid === ${process.env.TINYMAN_APP})`)).toBe(true);

  expect(process.env.TINYMAN_APP.length > 0).toBe(true);
  expect(process.env.ALGODEX_ALGO_ESCROW_APP.length > 0).toBe(true);
});
