module.exports = function(keys, values, rereduce) {
  const finalOrder = values.reduce(function(finalOrder, order) {
    const version = order.version || finalOrder.version;
    const finalOrderEarliestRound =
      finalOrder.earliestRound || finalOrder.round;
    const earliestRound = Math.min(finalOrderEarliestRound, order.round);
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
}
