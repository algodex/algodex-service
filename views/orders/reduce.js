module.exports = function(keys, values, rereduce) {
  const finalOrder = values.reduce(function(finalOrder, order) {
    if (order.block > finalOrder.block) {
      finalOrder = order;
    }
    return finalOrder;
  }, values[0]);
  finalOrder.status = finalOrder.type === 'open' ? 'open' : 'closed';
  return finalOrder;
};
