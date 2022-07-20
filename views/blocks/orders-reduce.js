

const reducer = function(keys, values, rereduce) {
  const getEarliest = values => {
    const min = values
        .filter(val => val !== null && val !== undefined)
        .reduce((min, val) => Math.min(min, val), Infinity);
    return min;
  };
  const finalOrder = values.reduce(function(finalOrder, order) {
    const version = order.version || finalOrder.version;
    const earliestRound = getEarliest([finalOrder.earliestRound,
      finalOrder.round, order.round, order.earliestRound]);

    if (order.block > finalOrder.block) {
      finalOrder = order;
    }
    if (!finalOrder.version) {
      finalOrder.version = version;
    }
    finalOrder.earliestRound = earliestRound;
    return finalOrder;
  }, values[0]);
  finalOrder.status = finalOrder.type === 'open' ? 'open' : 'closed';
  return finalOrder;
};


module.exports = reducer;

