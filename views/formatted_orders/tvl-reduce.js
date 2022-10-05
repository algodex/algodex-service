module.exports = function(keys, values, rereduce) {
  return values.reduce((sum, val) => {
    sum.algoAmount += val.algoAmount;
    sum.asaAmount += val.asaAmount;
    return sum;
  }, {algoAmount: 0, asaAmount: 0});
};
