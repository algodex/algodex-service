

const reducer = function(keys, values, rereduce) {
  const getEarliest = values => {
    const min = values
        .filter(val => val !== null && val !== undefined)
        .reduce((min, val) => Math.min(min, val), Infinity);
    return min;
  };
  const finalOrder = values.reduce(function(finalOrder, order) {
    const allKeys = [...Object.keys(order), ...Object.keys(finalOrder)];

    const firstNonNullKeyVal = allKeys.reduce((map, key) => {
      const val = finalOrder[key] || order[key];
      map[key] = val;
      return map;
    }, {});

    const earliestRound = getEarliest([finalOrder.earliestRound,
      finalOrder.round, order.round, order.earliestRound]);

    if (order.block > finalOrder.block) {
      finalOrder = order;
    }

    allKeys.forEach(key => {
      finalOrder[key] = finalOrder[key] || firstNonNullKeyVal[key];
    });

    finalOrder.earliestRound = earliestRound;
    return finalOrder;
  }, values[0]);
  finalOrder.status = finalOrder.type === 'open' ? 'open' : 'closed';
  return finalOrder;
};


module.exports = reducer;

