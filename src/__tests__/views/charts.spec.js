/*
 * Algodex Service
 * Copyright (C) 2022 Algodex VASP (BVI) Corp.
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */


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
