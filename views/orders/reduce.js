module.exports = function(keys, values, rereduce) {
  const finalOrder = values.reduce(function(finalOrder, order) {
    if (order.block > finalOrder.block) {
      finalOrder.type = order.type;
    }
    return finalOrder;
  });
  finalOrder.status = finalOrder.type === 'open' ? 'open' : 'closed';
  return finalOrder;
};
