module.exports = function(keys, values, rereduce) {
  return values.reduce((max, val) => {
    return Math.max(max, val);
  });
};
