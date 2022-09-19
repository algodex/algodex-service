
globalThis.emitted = [];

globalThis.emit = (key, val) => {
  const emitObj = {key, val};
  globalThis.emitted.push(emitObj);
};

const tradeHistory = require('./trade_history.json');
const chartMap = require('../../../views/formatted_history/charts-map');
const chartReduce = require('../../../views/formatted_history/charts-reduce');

const allAssetsMap = require('../../../views/formatted_history/allAssets-map');
const allAssetsReduce = require('../../../views/formatted_history/allAssets-reduce');

const fs = require('fs');

test('it can get charts', () => {
  globalThis.emitted = [];
  tradeHistory.forEach(row => {
    chartMap(row);
  });
  const chartData = globalThis.emitted;
  console.log(chartData);
  // const json = JSON.stringify(chartData, null, 2);
  // const filename = `./charts_test_output.txt`;
  // fs.writeFile(filename, json, err => {
  //   if (err) {
  //     console.error(err);
  //   }
  //   // file written successfully
  // });

  const dayData = chartData.filter(item => item.key[1] === '1d').map(item => item.val);
  console.log(dayData);
  const dayReduced = chartReduce(null, dayData, false);
  console.log(dayReduced);
});

test('gets all asset view', () => {
  globalThis.emitted = [];
  tradeHistory.forEach(row => {
    allAssetsMap(row);
  });
  const allAssetsData = globalThis.emitted;
  console.log(allAssetsData);

  const allAssetsVals = allAssetsData.map(item => item.val);

  const allAssetsReduced = allAssetsReduce(null, allAssetsVals, false);
  console.log(allAssetsReduced);
});
