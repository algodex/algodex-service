module.exports = function(keys, values, rereduce) {
  const finalOrder = values.reduce(function(finalOrder, order) {
    if (order.block > finalOrder.block) {
      finalOrder = order;
    }
    if (order.version && !finalOrder.version) {
      finalOrder.version = order.version;
    }
    return finalOrder;
  }, values[0]);
  finalOrder.status = finalOrder.type === 'open' ? 'open' : 'closed';
  return finalOrder;
};
