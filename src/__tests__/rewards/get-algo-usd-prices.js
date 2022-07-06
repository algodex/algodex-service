const getAlgoUsdPrices = require('../../rewards/get-algo-usd-prices');

test('can get prices', async ()=>{
  const dateToPrice = await getAlgoUsdPrices();
  // console.log(dateToPrice);
  expect(dateToPrice.get('2021-08-02')).toBe(0.8208465);
  expect(dateToPrice.get('2022-01-28')).toBe(0.9540255);
});

getAlgoUsdPrices();
