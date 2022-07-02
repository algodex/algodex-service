const getAlgoUsdPrices = require('../../rewards/get-algo-usd-prices');

test('can get prices', async ()=>{
  const prices = await getAlgoUsdPrices();
  console.log(prices);
});

getAlgoUsdPrices();
