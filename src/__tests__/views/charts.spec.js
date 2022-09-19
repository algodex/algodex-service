
globalThis.emitted = [];

globalThis.emit = (key, val) => {
  const emitObj = {key, val};
  globalThis.emitted.push(emitObj);
};

const tradeHistory = require('./trade_history.json');
const chartMap = require('../../../views/formatted_history/charts-map');
const chartReduce = require('../../../views/formatted_history/charts-reduce');
const fs = require('fs');

test('it can get charts', () => {
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