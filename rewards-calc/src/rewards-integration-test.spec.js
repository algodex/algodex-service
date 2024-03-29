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

/* eslint-disable max-len */
const fs = require('fs');
const path = require('path');

const recursiveSortKeys = unordered => {
  if (
    typeof unordered === 'object' &&
    !Array.isArray(unordered) &&
    unordered !== null
  ) {
    const ordered = Object.keys(unordered).sort().reduce(
        (obj, key) => {
          obj[key] = recursiveSortKeys(unordered[key]);
          return obj;
        },
        {},
    );
    return ordered;
  } else if (Array.isArray(unordered)) {
    const sorted = unordered.sort((a, b) => {
      const jsonA = JSON.stringify(a);
      const jsonB = JSON.stringify(b);
      return jsonA.localeCompare(jsonB);
    });
    for (let i = 0; i < sorted.length; i++) {
      sorted[i] = recursiveSortKeys(sorted[i]);
    }
    return sorted;
  }

  return unordered;
};
test('initial state matches', () => {
  let initialStateValidateEpoch2 = require('../integration_test/validation_data/initial_state_epoch_2.json');
  let initialStateTestEpoch2 = require('../integration_test/test_data/initial_state_epoch_2.json');

  initialStateValidateEpoch2 = recursiveSortKeys(initialStateValidateEpoch2);
  initialStateTestEpoch2 = recursiveSortKeys(initialStateTestEpoch2);
  initialStateValidateEpoch2.env = initialStateTestEpoch2.env;

  Object.keys(initialStateValidateEpoch2).forEach(key => {
    console.log('key is: ' + key);
    expect(initialStateValidateEpoch2[key]).toEqual(initialStateTestEpoch2[key]);
  });
});

test('initial state matches in order', () => {
  const initialStateValidateEpoch2 = require('../integration_test/validation_data/initial_state_epoch_2.json');
  const initialStateTestEpoch2 = require('../integration_test/test_data/initial_state_epoch_2.json');

  const matchesInOrderKeys = ['changedEscrowSeq', 'tinymanPrices', 'algxBalanceData'];
  matchesInOrderKeys.forEach(key => {
    console.log('key is: ' + key);
    expect(initialStateValidateEpoch2[key]).toEqual(initialStateTestEpoch2[key]);
  });
});


const readFileAsJson = filename => {
  const data = fs.readFileSync(filename, {encoding: 'ascii'});
  const json = JSON.parse(data);
  return json;
};

test('state machine matches', () => {
  console.log('current dir: ' + __dirname);
  const dirPath = __dirname+'/../integration_test/test_data/';
  fs.readdirSync(dirPath).forEach(file => {
    console.log(file);
    const testData = recursiveSortKeys(readFileAsJson(__dirname+'/../integration_test/test_data/'+ file));
    const validationData = recursiveSortKeys(readFileAsJson(__dirname+'/../integration_test/validation_data/'+ file));
    expect(testData).toEqual(validationData);
  });
});
