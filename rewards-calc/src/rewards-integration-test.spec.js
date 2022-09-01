/* eslint-disable max-len */

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

  Object.keys(initialStateValidateEpoch2).forEach(key => {
    console.log('key is: ' + key);
    expect(initialStateValidateEpoch2[key]).toEqual(initialStateTestEpoch2[key]);
  });
});
